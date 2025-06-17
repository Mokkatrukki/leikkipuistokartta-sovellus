import { useState, useEffect } from 'react';
import osmtogeojson from 'osmtogeojson';

// Define a more specific type for your GeoJSON playground data if possible
// For now, using 'any' for simplicity.
export interface PlaygroundGeoJsonData {
  type: string;
  features: Array<{[key: string]: any}>; // Array of GeoJSON features
  [key: string]: any;
}

// Define a type for the raw OSM data from Overpass if you want to be more specific
// interface OsmData { /* ... */ }

export function usePlaygroundOsmData(areaName: string = 'Oulu') {
  const [playgroundData, setPlaygroundData] = useState<PlaygroundGeoJsonData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!areaName) return; // Don't fetch if no areaName is provided

    setLoading(true);
    const overpassQuery = `
      [out:json][timeout:25];
      area["name"="${areaName}"]->.a;
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
        if (!response.ok) {
          throw new Error(`Overpass API HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((osmData: any /* Consider using OsmData type */) => {
        try {
          const geojsonData = osmtogeojson(osmData) as PlaygroundGeoJsonData;
          setPlaygroundData(geojsonData);
          setError(null);
        } catch (conversionError: any) {
          console.error("Error converting OSM data to GeoJSON:", conversionError);
          setError(new Error('Failed to convert OSM data to GeoJSON: ' + conversionError.message));
          setPlaygroundData(null);
        }
      })
      .catch((fetchError: Error) => {
        console.error("Could not fetch or process playground data:", fetchError);
        setError(fetchError);
        setPlaygroundData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [areaName]); // Re-run effect if areaName changes

  return { playgroundData, loading, error };
}
