import { useState } from 'react';
import MapComponent from './components/Map';
import InfoPanel from './components/InfoPanel';
import './App.css';

// Define types for the selected district data
// Represents the properties of a single playground feature from GeoJSON
export interface PlaygroundFeatureProperties {
  tags?: { [key: string]: string }; // OSM tags, including name if present
  // Add other common GeoJSON properties if needed, or allow any
  [key: string]: any; 
}

export interface PlaygroundInfo {
  count: number;
  // Store an array of properties from each playground feature
  featurePropertiesList: PlaygroundFeatureProperties[]; 
}

export interface DistrictProperties {
  NIMI?: string;
  Aj_kaupu_1?: string;
  name?: string;
  [key: string]: any;
}

export interface SelectedDistrictData {
  properties: DistrictProperties | null;
  playgroundInfo: PlaygroundInfo | null;
}

function App() {
  const [selectedDistrict, setSelectedDistrict] = useState<SelectedDistrictData | null>(null);

  return (
    <div className="app-container">
      <div className="map-panel"> {/* Corrected class name */}
        <MapComponent onDistrictSelect={setSelectedDistrict} selectedDistrict={selectedDistrict} />
      </div>
      <div className="info-panel"> {/* Corrected class name */}
        <InfoPanel selectedDistrict={selectedDistrict} />
      </div>
    </div>
  );
}

export default App;
