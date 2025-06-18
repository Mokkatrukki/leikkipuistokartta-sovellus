import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Feature as GeoJsonFeature, GeoJsonObject, Point, Polygon, MultiPolygon, Position } from 'geojson'; // For casting and Turf.js types
import { booleanPointInPolygon, centroid, point as turfPoint } from '@turf/turf';

// Fix for default marker icon issue with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

import { getPointFromGeoJsonFeature } from '../utils/geoUtils';
import type { CityGeoJsonData, CityGeoJsonFeature } from '../hooks/useCityData';

const FOCUSED_PLAYGROUND_ZOOM = 16;
const DEFAULT_POSITION_MAP: L.LatLngTuple = [65.060, 25.440]; // Approx. Kuivasjärvi, Oulu
const DEFAULT_ZOOM_MAP = 15; // Zoom closer
const DISTRICT_DISPLAY_ZOOM_MAP = 7;

interface MapComponentProps {
  playgroundsData: CityGeoJsonData | null;
  districtsData: CityGeoJsonData | null;
  loading: boolean;
  error: Error | null;
  onDistrictSelect: (districtFeature: CityGeoJsonFeature | null, playgroundsInDistrict: CityGeoJsonFeature[]) => void;
  selectedDistrictFeature: CityGeoJsonFeature | null;
  focusedPlaygroundId: string | null;
  onViewportDistrictChange: (districtName: string | null, playgroundsInViewport: CityGeoJsonFeature[]) => void;
  viewportDistrictName: string | null; // District currently at map center
}

const MapComponent: React.FC<MapComponentProps> = ({
  playgroundsData,
  districtsData,
  loading,
  error,
  onDistrictSelect,
  selectedDistrictFeature,
  focusedPlaygroundId,
  onViewportDistrictChange,
  viewportDistrictName,
}) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (error) console.error("Error loading map data:", error);
  }, [error]);

  const geoJsonDistrictStyle = (feature?: CityGeoJsonFeature) => {
    const districtName = feature?.properties?.name || feature?.properties?.NIMI || feature?.properties?.Aj_kaupu_1;
    let style = {
      fillColor: 'rgba(255, 0, 0, 0.3)', // Default: light red
      color: 'red',                     // Default: red
      weight: 1,
      opacity: 1,
      fillOpacity: 0.3,
    };

    if (feature && viewportDistrictName && districtName === viewportDistrictName) {
      style = {
        ...style,
        fillColor: 'rgba(0, 255, 0, 0.3)', // Viewport: light green
        color: 'green',                   // Viewport: green
        weight: 2, // Slightly thicker border for viewport district
      };
    }

    if (feature && selectedDistrictFeature && feature.id === selectedDistrictFeature.id) {
      style = {
        ...style,
        fillColor: 'rgba(0, 0, 255, 0.5)', // Selected: light blue
        color: 'blue',                    // Selected: blue
        weight: 2, // Thicker border for selected district
      };
    }
    return style;
  };

  const onEachDistrictFeature = (feature: CityGeoJsonFeature, layer: L.Layer) => {
    const districtName = feature.properties?.name || feature.properties?.NIMI || feature.properties?.Aj_kaupu_1 || 'Unknown District';
    layer.bindTooltip(districtName, {
      permanent: true,
      direction: 'center',
      className: 'district-label',
      sticky: false,
      interactive: false,
      opacity: 0.9,
    });

    layer.on('click', () => {
      const playgroundsInClickedDistrict = playgroundsData?.features.filter(pg => {
        if (!pg.geometry || !feature.geometry) return false;

        let pointToCheckForBoolean: GeoJsonFeature<Point> | Position | null = null;

        if (pg.geometry.type === 'Point') {
          pointToCheckForBoolean = pg.geometry.coordinates as Position;
        } else if (pg.geometry.type === 'Polygon' || pg.geometry.type === 'MultiPolygon') {
          // turf.centroid expects a Feature, not just Geometry
          const pgFeature = pg as GeoJsonFeature<Polygon | MultiPolygon>; 
          pointToCheckForBoolean = centroid(pgFeature);
        }

        if (!pointToCheckForBoolean) return false;
        // 'feature' here is the district feature (already a GeoJSON Feature object)
        return booleanPointInPolygon(pointToCheckForBoolean, feature as GeoJsonFeature<Polygon | MultiPolygon>);
      }) || [];
      onDistrictSelect(feature, playgroundsInClickedDistrict as CityGeoJsonFeature[]); // Cast result
    });
  };

  useEffect(() => {
    const map = mapRef.current;
    if (map && districtsData) {
      map.eachLayer((layer) => {
        if ((layer as any).feature) { // Check if it's a GeoJSON layer with a feature
          const layerFeature = (layer as L.GeoJSON).feature as CityGeoJsonFeature;
          if (layerFeature && layerFeature.properties && (layerFeature.properties.boundary === 'administrative')) { // Identify district layers
            const props = layerFeature.properties;
            const districtNameKey = props.name || props.NIMI || props.Aj_kaupu_1 || 'Unknown District';
            let newTooltipContent = districtNameKey;

            // Calculate playgrounds within this district feature using Turf.js
            let playgroundsInDistrictCount = 0;
            if (playgroundsData?.features && layerFeature.geometry) {
              playgroundsInDistrictCount = playgroundsData.features.filter(pg => {
                if (!pg.geometry || !layerFeature.geometry) return false;

                let pointToCheckForBoolean: GeoJsonFeature<Point> | Position | null = null;

                if (pg.geometry.type === 'Point') {
                  pointToCheckForBoolean = pg.geometry.coordinates as Position;
                } else if (pg.geometry.type === 'Polygon' || pg.geometry.type === 'MultiPolygon') {
                  const pgFeature = pg as GeoJsonFeature<Polygon | MultiPolygon>;
                  pointToCheckForBoolean = centroid(pgFeature);
                }

                if (!pointToCheckForBoolean) return false;
                // 'layerFeature' here is the district feature (already a GeoJSON Feature object)
                return booleanPointInPolygon(pointToCheckForBoolean, layerFeature as GeoJsonFeature<Polygon | MultiPolygon>);
              }).length;
            }

            if (playgroundsInDistrictCount > 0) {
              newTooltipContent += `<br/>🏞️ ${playgroundsInDistrictCount} playground${playgroundsInDistrictCount > 1 ? 's' : ''}`;
            }
            if (typeof (layer as L.FeatureGroup).setTooltipContent === 'function') {
              (layer as L.FeatureGroup).setTooltipContent(newTooltipContent);
            } else {
              layer.unbindTooltip().bindTooltip(newTooltipContent, {
                permanent: true, direction: 'center', className: 'district-label', sticky: false, interactive: false, opacity: 0.9,
              });
            }
          }
        }
      });
    }
  }, [districtsData, playgroundsData]);

  useEffect(() => {
    if (focusedPlaygroundId && playgroundsData?.features && mapRef.current) {
      const map = mapRef.current;
      const playgroundFeature = playgroundsData.features.find(
        (feature) => feature.properties?.['@id'] === focusedPlaygroundId || feature.id === focusedPlaygroundId
      );
      if (playgroundFeature) {
        const point = getPointFromGeoJsonFeature(playgroundFeature as CityGeoJsonFeature); // Cast
        if (point) {
          map.flyTo(point, FOCUSED_PLAYGROUND_ZOOM);
        }
      }
    }
  }, [focusedPlaygroundId, playgroundsData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !districtsData || !districtsData.features || !onViewportDistrictChange) {
      return;
    }

    const handleMoveEnd = () => {
      const center = map.getCenter();
      // Turf.js expects [longitude, latitude]
      const centerPoint = turfPoint([center.lng, center.lat]); 

      let currentDistrictName: string | null = null;
      for (const district of districtsData.features) {
        // Ensure district is a valid GeoJSON Feature with Polygon or MultiPolygon geometry for Turf
        if (district.geometry && (district.geometry.type === 'Polygon' || district.geometry.type === 'MultiPolygon')) {
          const districtFeature = district as GeoJsonFeature<Polygon | MultiPolygon>;
          if (booleanPointInPolygon(centerPoint, districtFeature)) {
            currentDistrictName = district.properties?.name || district.properties?.NIMI || district.properties?.Aj_kaupu_1 || 'Unknown District';
            break; // Found the district
          }
        }
      }
      let playgroundsInCurrentDistrict: CityGeoJsonFeature[] = [];
      if (currentDistrictName && districtsData?.features && playgroundsData?.features) {
        const currentDistrictFeature = districtsData.features.find(d => (d.properties?.name || d.properties?.NIMI || d.properties?.Aj_kaupu_1) === currentDistrictName);
        if (currentDistrictFeature && currentDistrictFeature.geometry) {
          playgroundsInCurrentDistrict = playgroundsData.features.filter(pg => {
            if (!pg.geometry) return false;
            let pointToCheck: GeoJsonFeature<Point> | Position | null = null;
            if (pg.geometry.type === 'Point') {
              pointToCheck = pg.geometry.coordinates as Position;
            } else if (pg.geometry.type === 'Polygon' || pg.geometry.type === 'MultiPolygon') {
              pointToCheck = centroid(pg as GeoJsonFeature<Polygon | MultiPolygon>);
            }
            // Ensure the playground feature is a valid GeoJSON feature for Turf
            return pointToCheck && booleanPointInPolygon(pointToCheck, currentDistrictFeature as GeoJsonFeature<Polygon | MultiPolygon>);
          }) as CityGeoJsonFeature[]; // Cast the result
        }
      }
      onViewportDistrictChange(currentDistrictName, playgroundsInCurrentDistrict);
    };

    map.on('moveend', handleMoveEnd);
    // Initial check when map loads or districtsData changes
    handleMoveEnd(); 

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [mapRef, districtsData, onViewportDistrictChange]); // Dependencies

  return (
    <MapContainer
      ref={mapRef}
      center={DEFAULT_POSITION_MAP}
      zoom={districtsData ? DISTRICT_DISPLAY_ZOOM_MAP : DEFAULT_ZOOM_MAP}
      scrollWheelZoom={true}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={DEFAULT_POSITION_MAP}>
        <Popup>Playground Conquest! <br /> Oulu Center.</Popup>
      </Marker>
      {loading && (
        <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'rgba(255,255,255,0.8)', padding: '20px', borderRadius: '8px'}}>Loading map data...</div>
      )}
      {!loading && districtsData && (
        <GeoJSON
          key={selectedDistrictFeature ? `district-${selectedDistrictFeature.id}` : 'districts'} // Force re-render on selection change for style
          data={districtsData as GeoJsonObject}
          style={geoJsonDistrictStyle as L.StyleFunction<GeoJsonFeature>}
          onEachFeature={onEachDistrictFeature as (feature: GeoJsonFeature, layer: L.Layer) => void}
        />
      )}
      {!loading && playgroundsData && (
        <GeoJSON
          data={playgroundsData as GeoJsonObject}
          onEachFeature={(feature, layer) => {
            const props = (feature as CityGeoJsonFeature).properties;
            const name = props?.name || props?.tags?.name || "Playground";
            layer.bindPopup(name);
          }}
          pointToLayer={(_feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 6, fillColor: "#f90", fillOpacity: 0.8, color: "#333", weight: 1,
            })
          }
          style={{ color: "#f90", weight: 2, fillOpacity: 0.3 }}
        />
      )}
    </MapContainer>
  );
};

export default MapComponent;