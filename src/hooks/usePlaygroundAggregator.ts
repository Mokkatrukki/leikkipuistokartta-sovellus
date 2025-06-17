import { useState, useEffect } from 'react';
import L from 'leaflet'; // For L.geoJSON and L.LatLng, if needed for pointInLayer or bounds
import type { DistrictData } from './useDistrictData';
import type { PlaygroundGeoJsonData } from './usePlaygroundOsmData';
import type { PlaygroundInfo, PlaygroundFeatureProperties } from '../App'; // Assuming types are exported from App.tsx

// Helper function (can be moved to utils if used elsewhere)
const getPointFromGeoJsonFeature = (feature: any): L.LatLng | null => {
  if (!feature?.geometry?.coordinates) return null;
  if (feature.geometry.type === 'Point') {
    return L.GeoJSON.coordsToLatLng(feature.geometry.coordinates as [number, number]);
  }
  let firstCoord = feature.geometry.coordinates[0];
  while (Array.isArray(firstCoord) && Array.isArray(firstCoord[0]) && typeof firstCoord[0][0] === 'number') {
    firstCoord = firstCoord[0];
  }
  if (Array.isArray(firstCoord) && firstCoord.length >= 2 && typeof firstCoord[0] === 'number' && typeof firstCoord[1] === 'number') {
    return L.GeoJSON.coordsToLatLng(firstCoord as [number, number]);
  }
  return null;
};

export function usePlaygroundAggregator(
  districtData: DistrictData | null,
  playgroundOsmData: PlaygroundGeoJsonData | null
) {
  const [districtPlaygroundInfo, setDistrictPlaygroundInfo] = useState<Record<string, PlaygroundInfo>>({}); // For tooltips
  const [districtDetailedPlaygroundInfo, setDistrictDetailedPlaygroundInfo] = useState<Record<string, PlaygroundInfo>>({}); // For InfoPanel
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (districtData?.features && playgroundOsmData?.features) {
      setProcessing(true);
      const newTooltipData: Record<string, PlaygroundInfo> = {};
      const newDetailedData: Record<string, PlaygroundInfo> = {};

      districtData.features.forEach((districtFeature: any) => {
        const districtNameKey = districtFeature.properties?.Aj_kaupu_1 || districtFeature.properties?.NIMI || districtFeature.properties?.name || 'Unknown District';
        
        if (!newTooltipData[districtNameKey]) {
          newTooltipData[districtNameKey] = { count: 0, featurePropertiesList: [] };
        }
        if (!newDetailedData[districtNameKey]) {
          newDetailedData[districtNameKey] = { count: 0, featurePropertiesList: [] };
        }

        const districtGeoJsonLayer = L.geoJSON(districtFeature as any); // Cast to any if L.geoJSON type is too strict
        const districtBounds = districtGeoJsonLayer.getBounds();

        playgroundOsmData.features.forEach((playgroundFeature: any) => {
          const playgroundPoint = getPointFromGeoJsonFeature(playgroundFeature);
          if (playgroundPoint && districtBounds.contains(playgroundPoint)) {
            newTooltipData[districtNameKey].count++;
            newDetailedData[districtNameKey].count++;
            
            const currentPlaygroundProperties = playgroundFeature.properties as PlaygroundFeatureProperties;

            // For Tooltip: Add properties of up to 3 unique named playgrounds
            if (newTooltipData[districtNameKey].featurePropertiesList.length < 3) {
              const name = currentPlaygroundProperties.tags?.name || currentPlaygroundProperties.name;
              if (name && !newTooltipData[districtNameKey].featurePropertiesList.some(p => (p.tags?.name || p.name) === name)) {
                 newTooltipData[districtNameKey].featurePropertiesList.push(currentPlaygroundProperties);
              }
            }
            // For Detailed InfoPanel: Add all playground properties
            newDetailedData[districtNameKey].featurePropertiesList.push(currentPlaygroundProperties);
          }
        });
      });
      setDistrictPlaygroundInfo(newTooltipData);
      setDistrictDetailedPlaygroundInfo(newDetailedData);
      setProcessing(false);
    } else {
      // Reset if data is not available
      setDistrictPlaygroundInfo({});
      setDistrictDetailedPlaygroundInfo({});
      setProcessing(false);
    }
  }, [districtData, playgroundOsmData]);

  return { districtPlaygroundInfo, districtDetailedPlaygroundInfo, processing };
}
