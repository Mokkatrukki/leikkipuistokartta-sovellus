import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Feature as GeoJsonFeatureType, GeoJsonObject } from 'geojson'; // For casting

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
const DEFAULT_POSITION_MAP: L.LatLngTuple = [65.0124, 25.4682]; // Oulu coordinates
const DEFAULT_ZOOM_MAP = 13;
const DISTRICT_DISPLAY_ZOOM_MAP = 7;

interface MapComponentProps {
  playgroundsData: CityGeoJsonData | null;
  districtsData: CityGeoJsonData | null;
  loading: boolean;
  error: Error | null;
  onDistrictSelect: (districtFeature: CityGeoJsonFeature | null, playgroundsInDistrict: CityGeoJsonFeature[]) => void;
  selectedDistrictFeature: CityGeoJsonFeature | null;
  focusedPlaygroundId: string | null;
}

const MapComponent: React.FC<MapComponentProps> = ({
  playgroundsData,
  districtsData,
  loading,
  error,
  onDistrictSelect,
  selectedDistrictFeature,
  focusedPlaygroundId,
}) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (error) console.error("Error loading map data:", error);
  }, [error]);

  const geoJsonDistrictStyle = (feature?: CityGeoJsonFeature) => ({
    fillColor: feature && selectedDistrictFeature && feature.id === selectedDistrictFeature.id ? 'rgba(0, 0, 255, 0.5)' : 'rgba(255, 0, 0, 0.3)',
    weight: 1,
    opacity: 1,
    color: feature && selectedDistrictFeature && feature.id === selectedDistrictFeature.id ? 'blue' : 'red',
    fillOpacity: 0.3,
  });

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
        const pgPoint = getPointFromGeoJsonFeature(pg as CityGeoJsonFeature); // Cast pg
        if (pgPoint && feature.geometry) {
          // Create a temporary GeoJSON layer for the district to use its bounds
          const districtLayerForBounds = L.geoJSON(feature as GeoJsonFeatureType); 
          if (districtLayerForBounds.getBounds().contains(pgPoint)) {
            return true;
          }
        }
        return false;
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

            // Calculate playgrounds within this district feature
            let playgroundsInDistrictCount = 0;
            if (playgroundsData?.features && layerFeature.geometry) {
              const districtLayerForBoundsCheck = L.geoJSON(layerFeature as GeoJsonFeatureType);
              playgroundsInDistrictCount = playgroundsData.features.filter(pg => {
                const pgPoint = getPointFromGeoJsonFeature(pg as CityGeoJsonFeature);
                return pgPoint && districtLayerForBoundsCheck.getBounds().contains(pgPoint);
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
          style={geoJsonDistrictStyle as L.StyleFunction<GeoJsonFeatureType>}
          onEachFeature={onEachDistrictFeature as (feature: GeoJsonFeatureType, layer: L.Layer) => void}
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