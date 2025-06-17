import { useState, useEffect } from 'react';

// Define a more specific type for your GeoJSON district data if possible
// For now, using 'any' for simplicity, but consider refining it.
export interface DistrictData {
  type: string;
  features: Array<{[key: string]: any}>; // Array of GeoJSON features
  // Add other top-level GeoJSON properties if they exist
  [key: string]: any;
}

export function useDistrictData() {
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch('/data/city-districts.geojson')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: DistrictData) => {
        setDistrictData(data);
        setError(null);
      })
      .catch((fetchError: Error) => {
        console.error("Could not fetch city-districts.geojson data:", fetchError);
        setError(fetchError);
        setDistrictData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // Empty dependency array means this effect runs once on mount

  return { districtData, loading, error };
}
