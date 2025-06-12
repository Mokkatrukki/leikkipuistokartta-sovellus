import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// Fix for default marker icon issue with Webpack/Vite
// This is important to ensure Leaflet's default icons work correctly with module bundlers like Vite.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const DEFAULT_POSITION: L.LatLngTuple = [65.0124, 25.4682]; // Oulu coordinates
const DEFAULT_ZOOM = 13;
const DISTRICT_DISPLAY_ZOOM = 7; // Zoom level to see more of Finland for districts

// Basic props type, can be expanded later if needed
// type MapProps = {};

const MapComponent: React.FC /* <MapProps> */ = () => {
  const [districtData, setDistrictData] = useState<any | null>(null); // Using 'any' for GeoJSON data type for now

  useEffect(() => {
    fetch('/data/city-districts.geojson')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setDistrictData(data);
      })
      .catch((error) => {
        console.error("Could not fetch city-districts.geojson data:", error);
        setDistrictData(null); // Ensure it's null on error
      });
  }, []);

  const geoJsonStyle = () => {
    return {
      fillColor: 'rgba(255, 0, 0, 0.3)', // Semi-transparent red fill
      weight: 1,
      opacity: 1,
      color: 'red', // Border color
      fillOpacity: 0.3,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    let districtName = 'District'; // Default name
    if (feature.properties) {
      if (feature.properties.Aj_kaupu_1) {
        districtName = feature.properties.Aj_kaupu_1;
      } else if (feature.properties.NIMI) { // Fallback to NIMI
        districtName = feature.properties.NIMI;
      } else if (feature.properties.name) { // Fallback to name
        districtName = feature.properties.name;
      }
      // Bind popup for click
      layer.bindPopup(`District: ${districtName}`);

      // Bind permanent, non-interactive, non-sticky tooltip for label in the center
      if (typeof (layer as any).getBounds === 'function') { // Cast to any for TS check; runtime check ensures safety
        layer.bindTooltip(districtName, {
          permanent: true,
          direction: 'center',
          className: 'district-label', // Allows custom styling via CSS
          sticky: false, // Prevent tooltip from following the mouse
          interactive: false // Prevent tooltip from capturing mouse events
        });
      }
    }
  };
  // The client-side rendering logic (useState, useEffect for isClient)
  // and mapRef can be re-introduced if specific interactions with the map instance
  // are needed or if server-side rendering (SSR) becomes a concern.
  // For a basic display, they are not strictly necessary if the CSS ensures container size.

  return (
    <MapContainer
      center={DEFAULT_POSITION}
      zoom={districtData ? DISTRICT_DISPLAY_ZOOM : DEFAULT_ZOOM}
      scrollWheelZoom={true}
      style={{ height: '100vh', width: '100%' }} // Ensure map takes up full viewport
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
          style={geoJsonStyle}
          onEachFeature={onEachFeature} 
        />
      )}
    </MapContainer>
  );
};

export default MapComponent;
