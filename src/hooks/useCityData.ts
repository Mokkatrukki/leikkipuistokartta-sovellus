import { useState, useEffect, useMemo } from 'react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

// Use standard GeoJSON types
export type CityGeoJsonData = FeatureCollection<Geometry, { [name: string]: any }>;
export type CityGeoJsonFeature = Feature<Geometry, { [name: string]: any }>;

export function useCityData(cityName: string) {
  const [cityData, setCityData] = useState<CityGeoJsonData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!cityName) {
      setLoading(false);
      setError(new Error('City name is required to fetch data.'));
      return;
    }

    setLoading(true);
    // import.meta.env.BASE_URL includes the trailing slash if not root (e.g., /repo/)
// Ensure the relative path part does not start with a slash to avoid double slashes.
const relativePath = `data/${cityName.toLowerCase()}.geojson`;
const filePath = `${import.meta.env.BASE_URL}${relativePath}`;

    console.log(`[useCityData] Fetching data for ${cityName} from ${filePath}`);

    fetch(filePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} while fetching ${filePath}`,
          );
        }
        return response.json() as Promise<CityGeoJsonData>; // Ensure response is cast
      })
      .then((data: CityGeoJsonData) => {
        console.log('[useCityData] Successfully fetched data:', data);
        if (data && data.features && data.features.length > 0) {
          console.log(
            '[useCityData] First feature properties:',
            data.features[0].properties,
          );
          console.log(
            '[useCityData] First feature geometry type:',
            data.features[0].geometry.type,
          );
        }
        setCityData(data);
        setError(null);
      })
      .catch((fetchError: Error) => {
        console.error(
          `[useCityData] Could not fetch or process data from ${filePath}:`,
          fetchError,
        );
        setError(fetchError);
        setCityData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cityName]);

  const playgroundsData = useMemo<CityGeoJsonData | null>(() => {
    if (!cityData || !cityData.features) return null;
    const features = cityData.features.filter(
      (feature: CityGeoJsonFeature) =>
        feature.properties?.leisure === 'playground' &&
        feature.properties?.access !== 'private',
    );
    return {
      type: 'FeatureCollection',
      features: features,
      // You might want to copy other top-level properties from cityData if they exist and are relevant
      // e.g., crs: cityData.crs (if cityData.crs exists)
    } as CityGeoJsonData;
  }, [cityData]);

  const districtsData = useMemo<CityGeoJsonData | null>(() => {
    if (!cityData || !cityData.features) return null;
    const features = cityData.features.filter(
      (feature: CityGeoJsonFeature) =>
        feature.properties?.boundary === 'administrative' &&
        feature.properties?.admin_level === '10',
    );
    return {
      type: 'FeatureCollection',
      features: features,
    } as CityGeoJsonData;
  }, [cityData]);

  return { cityData, playgroundsData, districtsData, loading, error };
}
