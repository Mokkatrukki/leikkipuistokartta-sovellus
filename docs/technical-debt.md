# Technical Debt & Future Improvements

This document lists areas of the codebase or features that could be improved, refactored, or optimized in the future. It helps us track known "sins" or technical debt so we can address them systematically.

## Overpass API Playground Data

- **API Usage & Caching (Current: Direct Fetch)**:
  - The Overpass API is a shared resource. For production, repeated direct fetching on every load for every user is not ideal.
  - *Future Improvements:*
    - Implement client-side caching (e.g., `localStorage` with expiration) to reduce redundant API calls.
    - Consider fetching data during the build process and saving it as a static `.geojson` file if playground data doesn't change frequently.
    - For more robust control, a backend proxy/cache could fetch, cache, and serve this data.

- **Loading States & Error Handling:**
  - *Future Improvements:*
    - Implement a visual loading indicator while playground data is being fetched and processed.
    - Provide clearer user feedback if data fails to load (e.g., network error, API down).

- **Performance for Large Datasets:**
  - `osmtogeojson` conversion and rendering many GeoJSON features can impact performance, especially for larger areas than Oulu.
  - *Future Improvements:*
    - Investigate performance bottlenecks if they arise.
    - Explore options like map feature simplification or clustering for very dense data.

- **Dynamic Query Scope in `usePlaygroundOsmData.ts`:**
  - The Overpass query is currently hardcoded for "Oulu" (though the hook accepts an `areaName` parameter, it's not dynamically used yet beyond that initial parameter).
  - *Future Improvements:*
    - Allow the `areaName` or other query parameters (like bounding box) to be dynamically changed, causing the hook to re-fetch data.
    - This could enable features like searching playgrounds in different cities or the currently viewed map area.

- **TypeScript Types for OSM/GeoJSON Data:**
  - Currently, `feature.properties.tags` and the overall GeoJSON structures (e.g., `DistrictData`, `PlaygroundGeoJsonData` in hooks) are typed loosely (often using `any` or broad `string` for `type`).
  - *Future Improvements:*
    - Define more specific TypeScript types for OSM feature properties, tags, and the expected GeoJSON structures (e.g., using `GeoJSON.FeatureCollection`, `GeoJSON.Feature` from `@types/geojson` or custom, more precise interfaces) for better type safety throughout the data lifecycle.
    - This would reduce the need for `as any` casts in components like `Map.tsx` when passing data to `<GeoJSON>`.

## Client-Side Spatial Analysis (Playgrounds in Districts)

- **Performance of Point-in-Polygon Checks (Current: Client-Side)**:
  - Calculating which playgrounds fall within which districts is currently done client-side after fetching both datasets.
  - This involves iterating through all playgrounds for each district and performing a spatial check.
  - While likely acceptable for Oulu-sized data, this could become a performance bottleneck with significantly more districts or playgrounds (e.g., nationwide data).
  - *Future Improvements:*
    - Optimize client-side calculations (e.g., using spatial indexing if many features).
    - Explore using more specialized client-side spatial libraries like `turf.js` for potentially faster point-in-polygon tests.
    - For very large datasets, consider pre-processing this relationship server-side or during a build step, so the client receives data with pre-calculated counts/associations.

## Map Interaction & Visualization

- **Header Playground Icon Tooltips:**
  - The header displays icons for playgrounds in the current viewport district. These icons are clickable to `flyTo` the playground.
  - *Future Improvements:* Add tooltips to these icons to show the playground's name on hover, improving usability.

- **Centroid Calculation for Polygons (`getPointFromGeoJsonFeature`):**
  - The `getPointFromGeoJsonFeature` utility currently takes a simplified approach for non-Point geometries (e.g., first coordinate of a polygon).
  - *Future Improvements:*
    - Implement or use a library function (e.g., from `turf.js`) to calculate a proper centroid for polygons and multi-polygons. This would provide a more accurate center point for `flyTo` operations or placing markers.

- **Focused Playground Highlighting & Popup:**
  - When a playground is selected from the `InfoPanel`, the map currently only uses `flyTo`.
  - *Future Improvements:*
    - Visually highlight the focused playground on the map (e.g., change its style temporarily, add a special marker).
    - Automatically open the popup for the focused playground.
    - Implement a mechanism to clear the focus (e.g., clicking the map elsewhere).

## General

- *(Add other items as they come up)*
