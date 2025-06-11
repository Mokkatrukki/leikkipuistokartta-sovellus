import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon issue with Webpack/Vite
// This is important to ensure Leaflet's default icons work correctly with module bundlers like Vite.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const DEFAULT_POSITION: L.LatLngTuple = [60.192059, 24.945831]; // Helsinki coordinates
const DEFAULT_ZOOM = 13;

// Basic props type, can be expanded later if needed
// type MapProps = {};

const MapComponent: React.FC /* <MapProps> */ = () => {
  // The client-side rendering logic (useState, useEffect for isClient)
  // and mapRef can be re-introduced if specific interactions with the map instance
  // are needed or if server-side rendering (SSR) becomes a concern.
  // For a basic display, they are not strictly necessary if the CSS ensures container size.

  return (
    <MapContainer
      center={DEFAULT_POSITION}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={true}
      style={{ height: '100vh', width: '100%' }} // Ensure map takes up full viewport
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={DEFAULT_POSITION}>
        <Popup>
          Playground Conquest! <br /> Helsinki Center.
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;
