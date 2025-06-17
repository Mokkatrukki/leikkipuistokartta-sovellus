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

import type { SelectedDistrictData, PlaygroundInfo, DistrictProperties, PlaygroundFeatureProperties } from '../App'; // Import types from App.tsx

interface MapComponentProps {
  onDistrictSelect: (data: SelectedDistrictData | null) => void;
  selectedDistrict: SelectedDistrictData | null; // Prop to know what's in the InfoPanel
}

const MapComponent: React.FC<MapComponentProps> = ({ onDistrictSelect, selectedDistrict }) => {
  const [districtData, setDistrictData] = useState<any | null>(null);
  const [playgroundData, setPlaygroundData] = useState<any | null>(null);
  const [districtPlaygroundInfo, setDistrictPlaygroundInfo] = useState<Record<string, PlaygroundInfo>>({}); // For tooltips
  const [districtDetailedPlaygroundInfo, setDistrictDetailedPlaygroundInfo] = useState<Record<string, PlaygroundInfo>>({}); // For InfoPanel
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
      const newTooltipData: Record<string, PlaygroundInfo> = {};
      const newDetailedData: Record<string, PlaygroundInfo> = {};

      districtData.features.forEach((districtFeature: any) => {
        const districtNameKey = districtFeature.properties?.Aj_kaupu_1 || districtFeature.properties?.NIMI || districtFeature.properties?.name || 'Unknown District';
        
        if (!newTooltipData[districtNameKey]) {
          newTooltipData[districtNameKey] = { count: 0, featurePropertiesList: [] };
        }
        if (!newDetailedData[districtNameKey]) {
          newDetailedData[districtNameKey] = { count: 0, featurePropertiesList: [] };
        }

        const districtGeoJsonLayer = L.geoJSON(districtFeature);
        const districtBounds = districtGeoJsonLayer.getBounds();

        playgroundData.features.forEach((playgroundFeature: any) => {
          const playgroundPoint = getPointFromGeoJsonFeature(playgroundFeature);
          if (playgroundPoint && districtBounds.contains(playgroundPoint)) {
            newTooltipData[districtNameKey].count++;
            newDetailedData[districtNameKey].count++;
            
            const currentPlaygroundProperties = playgroundFeature.properties as PlaygroundFeatureProperties;

            // For Tooltip: Add properties of up to 3 unique named playgrounds
            // (Tooltip will then extract names from these properties)
            if (newTooltipData[districtNameKey].featurePropertiesList.length < 3) {
              const name = currentPlaygroundProperties.tags?.name;
              if (name && !newTooltipData[districtNameKey].featurePropertiesList.some(p => p.tags?.name === name)) {
                 newTooltipData[districtNameKey].featurePropertiesList.push(currentPlaygroundProperties);
              }
            }

            // For Detailed InfoPanel: Add all playground properties
            // (InfoPanel can then filter/display as needed, including unnamed ones for debugging)
            newDetailedData[districtNameKey].featurePropertiesList.push(currentPlaygroundProperties);
          }
        });
      });
      setDistrictPlaygroundInfo(newTooltipData);
      setDistrictDetailedPlaygroundInfo(newDetailedData);
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

    // When a district feature is clicked, call onDistrictSelect
    layer.on('click', () => {
      const districtNameKey = feature.properties?.Aj_kaupu_1 || feature.properties?.NIMI || feature.properties?.name || 'Unknown District';
      const detailedPlaygroundInfoForClick = districtDetailedPlaygroundInfo[districtNameKey] || { count: 0, featurePropertiesList: [] };
      
      onDistrictSelect({
        properties: feature.properties as DistrictProperties,
        playgroundInfo: detailedPlaygroundInfoForClick
      });
    });

    // Bind popup for click (original functionality) - can be kept or removed if info panel is primary
    // layer.bindPopup(`District: ${districtName}`); // Keeping it for now, can be removed.
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
            // Extract up to 3 names from the featurePropertiesList for the tooltip
            const tooltipNames = info.featurePropertiesList
              .map(p => p.tags?.name)
              .filter((name): name is string => !!name) // Filter out undefined/empty names and ensure type is string
              .slice(0, 3);
            if (tooltipNames.length > 0) {
              newTooltipContent += `: ${tooltipNames.join(', ')}${info.featurePropertiesList.length > 3 && info.count > 3 ? '...' : ''}`;
            }
            if (typeof (layer as any).setTooltipContent === 'function') {
              (layer as any).setTooltipContent(newTooltipContent);
            }
          } else if (info) { // Info exists but count is 0
             if (typeof (layer as any).setTooltipContent === 'function') {
              (layer as any).setTooltipContent(newTooltipContent);
            }
          }
        }
      });
    }
  }, [districtPlaygroundInfo]); // Rerun when info changes

  // Effect to update InfoPanel if its selected district's playground data gets populated/updated
  useEffect(() => {
    // This effect now uses districtDetailedPlaygroundInfo to refresh the InfoPanel
    if (selectedDistrict && selectedDistrict.properties && Object.keys(districtDetailedPlaygroundInfo).length > 0) {
      const districtNameKey = selectedDistrict.properties.Aj_kaupu_1 || selectedDistrict.properties.NIMI || selectedDistrict.properties.name || 'Unknown District';
      const latestDetailedPlaygroundInfo = districtDetailedPlaygroundInfo[districtNameKey];

      if (latestDetailedPlaygroundInfo) {
        const panelInfo = selectedDistrict.playgroundInfo;
        if (
          !panelInfo || 
          panelInfo.count !== latestDetailedPlaygroundInfo.count || 
          // Compare based on a sorted list of names derived from featurePropertiesList for stability
          JSON.stringify(panelInfo.featurePropertiesList.map(p => p.tags?.name).sort()) !== 
          JSON.stringify(latestDetailedPlaygroundInfo.featurePropertiesList.map(p => p.tags?.name).sort())
        ) {
          onDistrictSelect({
            properties: selectedDistrict.properties,
            playgroundInfo: latestDetailedPlaygroundInfo
          });
        }
      }
    }
  }, [districtDetailedPlaygroundInfo, selectedDistrict, onDistrictSelect]);

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