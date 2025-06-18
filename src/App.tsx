import { useState, useEffect } from 'react';
import MapComponent from './components/Map';
import InfoPanel from './components/InfoPanel';
import './App.css';
import { useCityData } from './hooks/useCityData';
import type { CityGeoJsonFeature } from './hooks/useCityData'; // Added import, CityGeoJsonFeature


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
  const { cityData, playgroundsData, districtsData, loading: cityDataLoading, error: cityDataError } = useCityData('oulu');

  useEffect(() => {
    if (cityDataLoading) {
      console.log('[App.tsx] City data loading...');
    }
    if (cityDataError) {
      console.error('[App.tsx] Error loading city data:', cityDataError);
    }
    if (cityData) {
      console.log('[App.tsx] Raw city data loaded:', cityData);
    }
    if (playgroundsData) {
      console.log('[App.tsx] Filtered playgrounds data:', playgroundsData);
      // console.log('[App.tsx] Playgrounds count:', playgroundsData.features.length);
    }
    if (districtsData) {
      console.log('[App.tsx] Filtered districts data:', districtsData);
      // console.log('[App.tsx] Districts count:', districtsData.features.length);
    }
  }, [cityData, playgroundsData, districtsData, cityDataLoading, cityDataError]);

  const [selectedDistrict, setSelectedDistrict] = useState<SelectedDistrictData | null>(null);

  const handleDistrictSelect = (
    districtFeature: CityGeoJsonFeature | null,
    playgroundsInDistrict: CityGeoJsonFeature[]
  ) => {
    if (!districtFeature) {
      setSelectedDistrict(null);
      return;
    }

    const newSelectedDistrictData: SelectedDistrictData = {
      properties: districtFeature.properties as DistrictProperties, // Cast properties
      playgroundInfo: {
        count: playgroundsInDistrict.length,
        // Ensure properties are cast to PlaygroundFeatureProperties
        featurePropertiesList: playgroundsInDistrict.map(pg => pg.properties as PlaygroundFeatureProperties),
      },
    };
    setSelectedDistrict(newSelectedDistrictData);
  };
  const [focusedPlaygroundId, setFocusedPlaygroundId] = useState<string | null>(null);

  return (
    <div className="app-container">
      <div className="map-panel"> {/* Corrected class name */}
        <MapComponent
            playgroundsData={playgroundsData}
            districtsData={districtsData}
            loading={cityDataLoading}
            error={cityDataError}
            onDistrictSelect={handleDistrictSelect}
            selectedDistrictFeature={districtsData?.features.find(f => f.properties?.name === selectedDistrict?.properties?.name && f.id === (selectedDistrict?.properties as any)?.id) || null}
            focusedPlaygroundId={focusedPlaygroundId}
          />
      </div>
      <div className="info-panel"> {/* Corrected class name */}
        <InfoPanel 
          selectedDistrict={selectedDistrict} 
          onPlaygroundSelect={setFocusedPlaygroundId} 
        />
      </div>
    </div>
  );
}

export default App;
