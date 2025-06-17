import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
// osmtogeojson is now used within usePlaygroundOsmData hook

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

import type { SelectedDistrictData, DistrictProperties } from '../App'; // Import types from App.tsx

interface MapComponentProps {
  onDistrictSelect: (data: SelectedDistrictData | null) => void;
  selectedDistrict: SelectedDistrictData | null; // Prop to know what's in the InfoPanel
}

import { useDistrictData } from '../hooks/useDistrictData';
import { usePlaygroundOsmData } from '../hooks/usePlaygroundOsmData';
import { usePlaygroundAggregator } from '../hooks/usePlaygroundAggregator';

const MapComponent: React.FC<MapComponentProps> = ({ onDistrictSelect, selectedDistrict }) => {
  const { districtData, loading: districtLoading, error: districtError } = useDistrictData();
  // Assuming 'Oulu' is the default or we can pass it dynamically if needed later
  const { playgroundData: rawPlaygroundGeoJson, loading: playgroundLoading, error: playgroundError } = usePlaygroundOsmData('Oulu'); 
  const { districtPlaygroundInfo, districtDetailedPlaygroundInfo, processing: aggregationProcessing } = usePlaygroundAggregator(districtData, rawPlaygroundGeoJson);

  const mapRef = useRef<L.Map | null>(null);

  // Handle loading and error states from hooks (optional, for now just logging)
  useEffect(() => {
    if (districtError) console.error("Error fetching district data:", districtError);
    if (playgroundError) console.error("Error fetching playground data:", playgroundError);
  }, [districtError, playgroundError]);

  // The rest of the component uses districtData, rawPlaygroundGeoJson, 
  // districtPlaygroundInfo, and districtDetailedPlaygroundInfo from the hooks.

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
      {/* Display loading indicators or error messages based on hook states */}
      {(districtLoading || playgroundLoading || aggregationProcessing) && 
        <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'rgba(255,255,255,0.8)', padding: '20px', borderRadius: '8px'}}>Loading map data...</div>}
      
      {/* Render District GeoJSON layer once data is available */}
      {!districtLoading && districtData && (
        <GeoJSON 
          data={districtData as any} // Cast to any to satisfy GeoJSON component, or refine DistrictData type
          style={geoJsonDistrictStyle} 
          onEachFeature={onEachDistrictFeature} 
        />
      )}

      {/* Render Playground GeoJSON layer once data is available */}
      {!playgroundLoading && rawPlaygroundGeoJson && (
        <GeoJSON
          data={rawPlaygroundGeoJson as any} // Cast to any for consistency, or refine PlaygroundGeoJsonData type
          onEachFeature={(feature, layer) => {
            const name = feature.properties?.tags?.name || feature.properties?.name || "Playground"; // Check direct name too
            layer.bindPopup(name);
          }}
          pointToLayer={(_feature, latlng) => 
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