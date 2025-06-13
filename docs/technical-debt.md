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

- **Dynamic Query Scope:**
  - The Overpass query is currently hardcoded for "Oulu".
  - *Future Improvements:*
    - Make the query dynamic based on the current map view (bounding box) or user's location (adds complexity).

- **TypeScript Types for OSM Data:**
  - Currently, `feature.properties.tags` might be typed loosely.
  - *Future Improvements:*
    - Define more specific TypeScript types for OSM feature properties and tags for better type safety.

## Client-Side Spatial Analysis (Playgrounds in Districts)

- **Performance of Point-in-Polygon Checks (Current: Client-Side)**:
  - Calculating which playgrounds fall within which districts is currently done client-side after fetching both datasets.
  - This involves iterating through all playgrounds for each district and performing a spatial check.
  - While likely acceptable for Oulu-sized data, this could become a performance bottleneck with significantly more districts or playgrounds (e.g., nationwide data).
  - *Future Improvements:*
    - Optimize client-side calculations (e.g., using spatial indexing if many features).
    - Explore using more specialized client-side spatial libraries like `turf.js` for potentially faster point-in-polygon tests.
    - For very large datasets, consider pre-processing this relationship server-side or during a build step, so the client receives data with pre-calculated counts/associations.

## General

- *(Add other items as they come up)*
