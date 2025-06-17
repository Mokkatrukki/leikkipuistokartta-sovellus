import L from 'leaflet';

/**
 * Gets a representative point (LatLng) from a GeoJSON feature.
 * For Point features, it's the point itself.
 * For LineString/Polygon/MultiPolygon, it's a simplified first coordinate.
 * A proper centroid calculation would be more accurate for complex shapes.
 */
export const getPointFromGeoJsonFeature = (feature: any): L.LatLng | null => {
  if (!feature?.geometry?.coordinates) return null;

  if (feature.geometry.type === 'Point') {
    return L.GeoJSON.coordsToLatLng(feature.geometry.coordinates as [number, number]);
  }

  // For LineString, Polygon, MultiPolygon, take the first coordinate of the first part.
  let firstCoord = feature.geometry.coordinates[0];
  // Descend for MultiPolygon, MultiLineString, etc.
  while (Array.isArray(firstCoord) && Array.isArray(firstCoord[0]) && typeof firstCoord[0][0] === 'number') {
    firstCoord = firstCoord[0];
  }

  if (Array.isArray(firstCoord) && firstCoord.length >= 2 && typeof firstCoord[0] === 'number' && typeof firstCoord[1] === 'number') {
    return L.GeoJSON.coordsToLatLng(firstCoord as [number, number]);
  }

  return null;
};
