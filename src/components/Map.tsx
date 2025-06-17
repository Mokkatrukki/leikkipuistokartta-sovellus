import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import osmtogeojson from 'osmtogeojson';

// Fix for default marker icon issue with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const DEFAULT_POSITION: L.LatLngTuple = [65.0124, 25.4682]; // Oulu coordinates
const DEFAULT_ZOOM = 13;
const DISTRICT_DISPLAY_ZOOM = 7; // Zoom level to see more of Finland for districts

const MapComponent: React.FC = () => {
  const [districtData, setDistrictData] = useState<any | null>(null);
  const [playgroundData, setPlaygroundData] = useState<any | null>(null);
  const [districtPlaygroundInfo, setDistrictPlaygroundInfo] = useState<Record<string, { count: number; names: string[] }>>({});
  const mapRef = useRef<L.Map | null>(null);

  // Fetch district data
  useEffect(() => {
    fetch('/data/city-districts.geojson')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(setDistrictData)
      .catch((error) => {
        console.error("Could not fetch city-districts.geojson data:", error);
        setDistrictData(null);
      });
  }, []);

  // Fetch playground data from Overpass API
  useEffect(() => {
    const overpassQuery = `
      [out:json][timeout:25];
      area["name"="Oulu"]->.a;
      (
        node["leisure"="playground"](area.a);
        way["leisure"="playground"](area.a);
        relation["leisure"="playground"](area.a);
      );
      out body;
      >;
      out skel qt;
    `;
    const overpassUrl = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(overpassQuery);

    fetch(overpassUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Overpass API HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((osmData) => {
        const geojsonData = osmtogeojson(osmData);
        setPlaygroundData(geojsonData);
      })
      .catch((error) => {
        console.error("Could not fetch or process playground data:", error);
        setPlaygroundData(null);
      });
  }, []);

  // Helper to get a representative point from a GeoJSON feature
  const getPointFromGeoJsonFeature = (feature: any): L.LatLng | null => {
    if (!feature?.geometry?.coordinates) return null;
    if (feature.geometry.type === 'Point') {
      return L.GeoJSON.coordsToLatLng(feature.geometry.coordinates as [number, number]);
    }
    // For LineString, Polygon, MultiPolygon, take the first coordinate of the first part.
    // This is a simplification; a centroid would be more accurate for complex shapes.
    let firstCoord = feature.geometry.coordinates[0];
    while (Array.isArray(firstCoord) && Array.isArray(firstCoord[0]) && typeof firstCoord[0][0] === 'number') { // Descend for MultiPolygon, etc.
      firstCoord = firstCoord[0];
    }
     if (Array.isArray(firstCoord) && firstCoord.length >= 2 && typeof firstCoord[0] === 'number' && typeof firstCoord[1] === 'number') {
      return L.GeoJSON.coordsToLatLng(firstCoord as [number, number]);
    }
    return null;
  };

  // Calculate playground counts per district
  useEffect(() => {
    if (districtData?.features && playgroundData?.features) {
      const newInfo: Record<string, { count: number; names: string[] }> = {};
      districtData.features.forEach((districtFeature: any) => {
        const districtName = districtFeature.properties?.Aj_kaupu_1 || districtFeature.properties?.NIMI || districtFeature.properties?.name || 'Unknown District';
        if (!newInfo[districtName]) {
          newInfo[districtName] = { count: 0, names: [] };
        }
        // Create a temporary Leaflet layer for the district to use .getBounds() and .contains()
        const districtGeoJsonLayer = L.geoJSON(districtFeature);
        const districtBounds = districtGeoJsonLayer.getBounds();

        playgroundData.features.forEach((playgroundFeature: any) => {
          const playgroundPoint = getPointFromGeoJsonFeature(playgroundFeature);
          if (playgroundPoint && districtBounds.contains(playgroundPoint)) {
            newInfo[districtName].count++;
            const playgroundName = playgroundFeature.properties?.tags?.name || 'Unnamed Playground';
            if (newInfo[districtName].names.length < 3) { // Limit to 3 names in the list
              newInfo[districtName].names.push(playgroundName);
            }
          }
        });
      });
      setDistrictPlaygroundInfo(newInfo);
    }
  }, [districtData, playgroundData]);

  const geoJsonDistrictStyle = () => ({
    fillColor: 'rgba(255, 0, 0, 0.3)',
    weight: 1,
    opacity: 1,
    color: 'red',
    fillOpacity: 0.3,
  });

  const onEachDistrictFeature = (feature: any, layer: L.Layer) => {
    // Store properties on the layer for later access by the tooltip update effect
    (layer as any).featureProperties = feature.properties;
    const districtName = feature.properties?.Aj_kaupu_1 || feature.properties?.NIMI || feature.properties?.name || 'Unknown District';
    
    // Bind initial simple tooltip (just the name)
    layer.bindTooltip(districtName, {
      permanent: true,
      direction: 'center',
      className: 'district-label',
      sticky: false,
      interactive: false,
      opacity: 0.9,
    });

    // Bind popup for click (original functionality)
    layer.bindPopup(`District: ${districtName}`);
  };

  // Effect to update district tooltips when districtPlaygroundInfo is ready
  useEffect(() => {
    const map = mapRef.current;
    if (map && Object.keys(districtPlaygroundInfo).length > 0) {
      map.eachLayer((layer) => {
        // Check if this layer is a district layer (has featureProperties we set)
        const props = (layer as any).featureProperties;
        if (props && (props.Aj_kaupu_1 || props.NIMI || props.name)) {
          const districtNameKey = props.Aj_kaupu_1 || props.NIMI || props.name || 'Unknown District';
          const info = districtPlaygroundInfo[districtNameKey];
          
          let newTooltipContent = districtNameKey;
          if (info && info.count > 0) {
            newTooltipContent += `<br/>🏞️ ${info.count} playground${info.count > 1 ? 's' : ''}`;
            if (info.names.length > 0) {
              newTooltipContent += `: ${info.names.join(', ')}${info.count > info.names.length ? '...' : ''}`;
            }
            // Ensure the layer can have setTooltipContent (usually GeoJSON layers can)
            if (typeof (layer as any).setTooltipContent === 'function') {
              (layer as any).setTooltipContent(newTooltipContent);
            }
          } else if (info) { // Info exists but count is 0, or no names
             if (typeof (layer as any).setTooltipContent === 'function') {
              (layer as any).setTooltipContent(newTooltipContent); // Ensure it's at least the name
            }
          }
        }
      });
    }
  }, [districtPlaygroundInfo]); // Rerun when info changes

  return (
    <MapContainer 
      ref={mapRef} 
      center={DEFAULT_POSITION} 
      zoom={districtData ? DISTRICT_DISPLAY_ZOOM : DEFAULT_ZOOM} 
      scrollWheelZoom={true} 
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={DEFAULT_POSITION}>
        <Popup>
          Playground Conquest! <br /> Oulu Center.
        </Popup>
      </Marker>
      {districtData && (
        <GeoJSON 
          data={districtData} 
          style={geoJsonDistrictStyle} 
          onEachFeature={onEachDistrictFeature} 
        />
      )}
      {playgroundData && (
        <GeoJSON
          data={playgroundData}
          onEachFeature={(feature, layer) => {
            const name = feature.properties?.tags?.name || "Playground";
            layer.bindPopup(name);
          }}
          pointToLayer={(_feature, latlng) => // _feature to denote unused param
            L.circleMarker(latlng, {
              radius: 6,
              fillColor: "#f90", // Orange
              fillOpacity: 0.8,
              color: "#333", // Dark grey border
              weight: 1,
            })
          }
          style={{ // Style for playground ways/polygons
            color: "#f90", 
            weight: 2,
            fillOpacity: 0.3,
          }}
        />
      )}
    </MapContainer>
  );
};

export default MapComponent;