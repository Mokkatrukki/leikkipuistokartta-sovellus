# Playground Conquest App

An interactive, family-friendly web app that encourages kids and parents to visit local playgrounds by "conquering" map areas. Designed as a Progressive Web App (PWA), with real-time Firebase backend, map-based exploration using Leaflet, and support for future mobile packaging via Capacitor.

## ✨ Features

- Explore playgrounds via a map
- Track which areas (e.g. postal codes) have been visited
- Mark conquered playgrounds with fun icons
- View achievements (e.g. all bird towers visited)
- Simple voting: like / dislike
- Works offline as a PWA
- User login via Firebase (anonymous or optional OAuth)
- Two-panel development view with map and detailed data inspector for debugging

## 🌍 Target Users

- Parents with children
- Schools or daycares
- Anyone gamifying exploration of public outdoor areas

## 🧱 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Map:** Leaflet + react-leaflet + OSM tiles + Turf.js (for geospatial analysis)
- **Auth & Backend:** Firebase (Auth + Firestore)
- **Hosting:** Firebase Hosting
- **Offline support:** PWA via vite-plugin-pwa
- **Optional mobile packaging:** Capacitor.js
- **Data Management:** Utilizes a consolidated GeoJSON file per city (e.g., `public/data/oulu.geojson`) containing both district and playground data. A custom React Hook (`useCityData.ts`) fetches and processes this file.

## 🚀 Deployment

- Hosted on Firebase Hosting (default: `your-project.web.app`)
- Optional custom domain

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
