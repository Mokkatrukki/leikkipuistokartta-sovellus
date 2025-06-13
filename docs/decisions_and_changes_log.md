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

## YYYY-MM-DD

- **Decision/Change:** 
- **Reason:** 
- **Impact:** 
