# Full Stack Overview

## ⚛️ Frontend

- **React**: Component-based UI
- **TypeScript**: Safer and more robust code
- **Vite**: Ultra-fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **Leaflet**: Interactive map display
- **react-leaflet**: Leaflet bindings for React
- **vite-plugin-pwa**: Adds PWA features like service worker + manifest
- **clsx**: Utility for dynamic CSS class names
- **uuid**: Used to generate IDs (e.g., user events)

## ☁️ Firebase Backend

- **Firestore**: Real-time document database
  - `users/{userId}/conquests/{playgroundId}`
  - or `conquests/{userId}_{playgroundId}`
- **Auth**: Anonymous login (can extend to Google or others)
- **Hosting**: Static site hosting with HTTPS
- **Optional**:
  - Firebase Storage for files (e.g. playground images)
  - Firestore rules for access control

## 📱 Mobile Support

- **Capacitor.js**: Wraps the PWA into a native shell
- **Geolocation plugin** (optional): Detect nearby playgrounds
- Can be published to Play Store or App Store

## 🌈 UI Style

- Family-friendly color scheme:
  - Pastel green, soft blue, sunny yellow, orange highlights
  - High contrast for visibility outdoors
- Custom map layers (optionally MapTiler or Mapbox Studio)
  - Minimalist or sepia-style OSM for readability