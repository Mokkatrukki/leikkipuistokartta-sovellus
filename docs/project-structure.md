# Project Structure Overview

This document outlines the main directories and file organization of the Playground Conquest App.

- `/public` - Static assets that are directly served.
- `/src` - Main application source code.
  - `/src/assets` - Static assets like images (e.g., `react.svg`).
  - `/src/components` - Reusable UI components (presentational logic).
    - `Map.tsx` - The main Leaflet map component.
    - `InfoPanel.tsx` - Component to display detailed debug information for selected map features.
  - `/src/hooks` - Custom React hooks for encapsulating reusable stateful logic, especially data fetching and processing.
    - `useDistrictData.ts` - Hook to fetch city district GeoJSON data.
    - `usePlaygroundOsmData.ts` - Hook to fetch and process playground data from Overpass API.
    - `usePlaygroundAggregator.ts` - Hook to aggregate and combine district and playground data.
  - `App.css` - Basic styles for App component (may be removed or refactored).
  - `App.tsx` - Main application component.
  - `index.css` - Global styles and Tailwind CSS import.
  - `main.tsx` - Entry point of the React application.
  - `vite-env.d.ts` - TypeScript definitions for Vite environment variables.
- `/docs` - Project documentation files.
- `.gitignore` - Specifies intentionally untracked files that Git should ignore.
- `index.html` - Main HTML entry point for Vite.
- `package.json` - Project metadata, dependencies, and scripts.
- `README.md` - General project overview and setup instructions.
- `stack.md` - Overview of the technology stack.
- `milestones.md` - Project milestones and progress.
- `tailwind.config.js` - Tailwind CSS configuration.
- `postcss.config.js` - PostCSS configuration (used by Tailwind).
- `vite.config.ts` - Vite build tool configuration.
- `tsconfig.json` - TypeScript compiler options for the project.
- `tsconfig.node.json` - TypeScript compiler options for Node.js specific files (like `vite.config.ts`).
