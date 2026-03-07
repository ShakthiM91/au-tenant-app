# AU Tenant Mobile App

Vue 3 + Vite mobile app for the AU tenant, built with Ionic Vue, Pinia, Vue Router, Axios, Dexie, and Capacitor.

## Tech Stack

- **Framework:** Vue 3 + Vite
- **UI:** Ionic Vue 8
- **State:** Pinia
- **Router:** Vue Router 4 (Ionic)
- **HTTP:** Axios (with offline write queue)
- **Offline DB:** Dexie (IndexedDB)
- **Native:** Capacitor

## Setup

```bash
npm install
```

Copy `env.example` to `.env.development` or `.env.production` and set:

```
VITE_API_BASE_URL=http://localhost:3000
```

## Scripts

| Command              | Description                        |
|----------------------|------------------------------------|
| `npm run dev`        | Start dev server (port 8083)       |
| `npm run build`      | Production build                   |
| `npm run preview`    | Preview production build           |
| `npm run cap:sync`   | Sync `dist` to native projects     |
| `npm run cap:ios`    | Build, sync, and open Xcode        |
| `npm run cap:android`| Build, sync, and open Android Studio |

## Development

Pages are developed one-by-one from the Figma design (I-E-Tracker). Add new routes to `src/router/index.js` and corresponding view components under `src/views/` as each screen is implemented.
