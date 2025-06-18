# Design Decisions and Changes Log

## 2025-06-12

- **Decision/Change:** Integrated dynamic fetching and display of playground data from OpenStreetMap via the Overpass API, and enhanced city district labels to show playground counts and names.
- **Reason:** To provide users with detailed information about playgrounds within specific city districts, making the map more interactive and informative for discovering play areas.
- **Impact:**
    - Added `osmtogeojson` dependency to convert Overpass API's OSM XML/JSON data to GeoJSON format suitable for Leaflet.
    - Implemented logic in `Map.tsx` to:
        - Fetch playground data for Oulu using a specific Overpass query.
        - Render playgrounds as orange circle markers (for points) or polygons on the map, with popups showing their names.
        - Calculate which playgrounds fall within each city district's boundaries client-side after both datasets are loaded.
        - Update district tooltips to display the count of playgrounds and a list of up to three playground names (e.g., "🏞️ 5 playgrounds: Park A, Funland, Green Spot...").
    - Refactored tooltip update mechanism to use `mapRef` and a `useEffect` hook that triggers after `districtPlaygroundInfo` state is populated, ensuring data availability for rich tooltips.
    - Created `docs/technical-debt.md` to log potential future improvements, such as performance optimization for client-side spatial analysis and Overpass API usage (caching).
    - The `Map.tsx` component now manages state for district data, playground data, and the derived `districtPlaygroundInfo`.
    - User experience is improved by providing richer, context-aware information directly on the map labels.

This document logs significant design decisions, architectural changes, and reasons behind them throughout the project lifecycle.

## 2025-06-17

- **Decision/Change:** Implemented a two-panel user interface for development/debugging purposes. The left panel displays the interactive map (`MapComponent`), and the right panel (`InfoPanel.tsx`) displays detailed information about a selected map district, including raw properties and a categorized list of its playgrounds.
- **Reason:** To provide a dedicated and clear space for inspecting detailed map data (district properties, playground counts, individual playground properties) without cluttering the main map view. This aids in debugging data fetching, processing, and display logic.
- **Impact:**
    - Created `src/components/InfoPanel.tsx` to render details of a selected district.
    - Modified `src/App.tsx` to manage the state of the selected district and arrange `MapComponent` and `InfoPanel` in a two-column flex layout (styled via `App.css`).
    - Updated `MapComponent.tsx`:
        - To accept an `onDistrictSelect` callback and a `selectedDistrict` prop from `App.tsx`.
        - To call `onDistrictSelect` when a district is clicked on the map, passing its properties and detailed playground information.
        - Added a `useEffect` hook to refresh the `InfoPanel` if playground data for the selected district is updated asynchronously after the initial click.
        - Separated internal state for playground information: `districtPlaygroundInfo` (for concise map tooltips) and `districtDetailedPlaygroundInfo` (providing full feature properties for all playgrounds in a district to the `InfoPanel`).
    - Updated `InfoPanel.tsx` to:
        - Receive selected district data (including the comprehensive `featurePropertiesList` for playgrounds).
        - Categorize and display playgrounds as "Named Playgrounds" or "Unnamed Playgrounds / No Name Tag".
        - Display the full raw properties object for each playground for detailed inspection.
        - Adjusted name detection to check both `feature.properties.name` and `feature.properties.tags.name` based on observed OSM data patterns.
    - Created `docs/osm_playground_data_structure.md` to document findings about the structure of playground data from Overpass API for Oulu.
    - The developer experience is improved by having a clear, structured way to inspect underlying map data during development.
- **Decision/Change (Refactor):** Refactored `Map.tsx` to delegate data fetching and processing logic to custom React hooks.
- **Reason:** To improve separation of concerns, reduce the complexity of `Map.tsx`, enhance readability, and make data handling logic more modular and testable. This aligns with the goal of keeping view components lean and data logic centralized.
- **Impact:**
    - Created `src/hooks/` directory.
    - Implemented `useDistrictData.ts` to fetch city district GeoJSON.
    - Implemented `usePlaygroundOsmData.ts` to fetch and convert playground data from Overpass API to GeoJSON.
    - Implemented `usePlaygroundAggregator.ts` to process district and playground data, calculating playground counts and properties per district for both tooltips and the detailed InfoPanel.
    - `Map.tsx` now consumes these hooks, significantly reducing its internal state management and effect logic related to data acquisition and processing.
    - Added basic loading indicators to `Map.tsx` based on state from the new hooks.
- **Decision/Change (Feature Enhancement):** Implemented interactivity between `InfoPanel` and `MapComponent`. Clicking a playground in the `InfoPanel` now causes the map to `flyTo` and center on that playground's location.
- **Reason:** To improve the utility of the debug panel by allowing easier visual correlation between listed playground data and its geographical location on the map.
- **Impact:**
    - Created `src/utils/geoUtils.ts` and moved `getPointFromGeoJsonFeature` helper into it.
    - Updated `App.tsx` to manage `focusedPlaygroundId` state, passing it to `MapComponent` and a setter to `InfoPanel`.
    - `InfoPanel.tsx` now calls `onPlaygroundSelect(playgroundId)` when a playground item is clicked.
    - `Map.tsx` uses a `useEffect` hook to observe `focusedPlaygroundId`. When it changes, the map finds the playground feature and uses `map.flyTo()` to navigate. The zoom level for this action (`FOCUSED_PLAYGROUND_ZOOM`) was adjusted from 18 to 16 for a better overview.

## 2025-06-18

- **Decision/Change (Refactor):** Major refactoring of data fetching and management. Consolidated all city-level geographic data (districts and playgrounds) into a single GeoJSON file per city (e.g., `public/data/oulu.geojson`). Introduced a new generic hook `useCityData.ts` to fetch and process this file, providing filtered `playgroundsData` and `districtsData`.
- **Reason:** To simplify data sources, reduce API calls (previously fetching districts and playgrounds separately, with playgrounds from Overpass API), improve performance by using static GeoJSON, and streamline the data flow within the application. This also makes it easier to support multiple cities in the future by just adding new GeoJSON files.
- **Impact:**
    - Created `src/hooks/useCityData.ts` which now handles fetching a city-specific GeoJSON file (e.g., `oulu.geojson`) and provides memoized `playgroundsData` and `districtsData` using standard GeoJSON types.
    - Removed old data hooks: `useDistrictData.ts`, `usePlaygroundOsmData.ts`, and `usePlaygroundAggregator.ts`.
    - `App.tsx` now uses `useCityData` as the primary source for map data. It manages `selectedDistrict` state and passes necessary data and callbacks to `MapComponent` and `InfoPanel`.
    - `MapComponent.tsx` was refactored to accept all data via props. It handles district click events by passing the clicked district feature and a pre-filtered list of playgrounds within it to `App.tsx`. The logic for displaying playground counts in district tooltips was moved into this component.
    - `InfoPanel.tsx`'s core functionality remained compatible, with minor updates to ensure it uses the correct feature IDs (e.g., `properties['@id']`) for interactions like `flyTo`.
    - The `flyTo` functionality was updated in both `InfoPanel.tsx` (to send the correct ID) and `MapComponent.tsx` (to find features by `properties['@id']`).
    - Overall application structure is cleaner, with a more centralized and predictable data flow.
    - Dependency on `osmtogeojson` is effectively removed as direct Overpass API conversion is no longer performed client-side for primary data loading.

## YYYY-MM-DD

- **Decision/Change:** 
- **Reason:** 
- **Impact:** 
