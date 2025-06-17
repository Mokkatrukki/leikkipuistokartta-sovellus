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

## YYYY-MM-DD

- **Decision/Change:** 
- **Reason:** 
- **Impact:** 
