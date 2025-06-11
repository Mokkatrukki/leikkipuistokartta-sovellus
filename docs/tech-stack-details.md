# Technology Stack Details

This document provides more detailed information about the technologies used and how they are integrated.

## Frontend

- **React (v18.x.x)**: Used for building the component-based user interface. Leveraging functional components and hooks.
- **TypeScript**: For static typing, improving code quality and maintainability.
- **Vite**: Build tool for fast development and optimized production builds. Manages module bundling, HMR (Hot Module Replacement), and serving.
- **Tailwind CSS (v4.x.x via @tailwindcss/vite)**: Utility-first CSS framework for rapid UI development. Configured via `tailwind.config.js` and integrated into Vite via `@tailwindcss/vite` plugin.
- **Leaflet & react-leaflet**: (To be integrated) For interactive maps.
- **vite-plugin-pwa**: (To be integrated) For Progressive Web App features.
- **clsx**: (To be integrated, if needed) For conditionally joining class names.
- **uuid**: (To be integrated, if needed) For generating unique identifiers.

## Backend (Firebase)

- **Firebase Authentication**: (To be integrated) For user sign-up and sign-in. Starting with anonymous auth.
- **Firebase Firestore**: (To be integrated) NoSQL document database for storing user data, conquered playgrounds, etc.
- **Firebase Hosting**: (To be integrated) For deploying the static PWA.

## Development & Tooling

- **Node.js & npm**: JavaScript runtime and package manager.
- **ESLint**: For linting TypeScript/JavaScript code (configured in `eslint.config.js`).
- **Git**: Version control system.

## UI Style

- As defined in `stack.md`, aiming for a family-friendly, high-contrast UI suitable for outdoor use.
