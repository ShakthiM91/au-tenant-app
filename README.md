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

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API origin (dev server proxies `/api` when unset) |
| `VITE_APP_TOKEN` | Tenant app token from **primary-admin → Tenant → App Management**; sent as `appToken` on register/Google and `X-App-Token` on unauthenticated API calls |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth **Web** client ID |
| `VITE_GOOGLE_IOS_CLIENT_ID` | Google OAuth **iOS** client ID (native) |
| `VITE_GOOGLE_ANDROID_CLIENT_ID` | Optional Android client ID |

### Self-registration & Google sign-in

Users can sign up via **Continue with Google** or email (`/register` → `/register-email`). The tenant is resolved from `VITE_APP_TOKEN`. Enable **Self register** on the app record in primary-admin and set a default member role.

1. Create OAuth clients in Google Cloud Console (Web origins: `http://localhost:8083`, production URL; iOS bundle `com.autenant.app`).
2. Set `GOOGLE_CLIENT_ID` on **auth-service** (`services/auth-service/.env`) to a **comma-separated list of every OAuth client ID** this app uses (at minimum `VITE_GOOGLE_CLIENT_ID`, plus `VITE_GOOGLE_IOS_CLIENT_ID` / `VITE_GOOGLE_ANDROID_CLIENT_ID` if set). AU Tenant and Budget Buddy use **different** client IDs — include both if you run both apps against the same auth-service.
3. Run migration `database/migrations/005_auth_google_oauth.sql` if not already applied.
4. For native iOS: after `npm run cap:sync`, add the iOS reversed client ID to `Info.plist` URL schemes (see budget-buddy-app README).

## Scripts

| Command              | Description                        |
|----------------------|------------------------------------|
| `npm run dev`        | Start dev server (port 8083)       |
| `npm run build`      | Production build                   |
| `npm run preview`    | Preview production build           |
| `npm run cap:sync`   | Sync `dist` to native projects     |
| `npm run cap:ios`    | Build, sync, and open Xcode        |
| `npm run cap:android`| Build, sync, and open Android Studio |

## PWA (install & offline shell)

Production builds register a service worker (`vite-plugin-pwa` + Workbox):

| Feature | Behavior |
|---------|----------|
| **Install** | On mobile browsers (not installed), a bottom banner prompts install. Android uses `beforeinstallprompt` when available; iOS shows Share → Add to Home Screen. Dismissed for 7 days (`localStorage`). |
| **Updates** | `registerType: 'prompt'` — when a new build is deployed, an update banner offers **Update now** or **Later**. |
| **Offline shell** | App JS/CSS/HTML and icons are precached; API calls still need network (writes queue via Dexie when offline). |
| **Resume sync** | On tab focus / Capacitor resume, pending writes sync and bootstrap cache refreshes (`main.js`). |

**Test install/update locally**

```bash
npm run build
npm run preview
```

Open DevTools → Application → Manifest / Service Workers. Service worker is **disabled in `npm run dev`** (`dev: false` in PWA config).

Deploy `dist/` with cache headers for `sw.js` and `workbox-*.js` (see `public/_headers`). PWA icons: `public/icon-192.png`, `icon-512.png`, maskable variants.

**iOS tab bar gap (PWA + native)** — `src/utils/iosViewportFix.js` sets `--au-app-height: 100vh` on iOS standalone / Capacitor iOS. Reinstall the PWA after changes if a white strip remains under the tab bar.

## Workspaces (Islands)

Accounting **workspaces** are exposed in the UI as **Islands** on the Accounts screen. Workspace APIs are served by **member-service**:

- Client: `src/api/workspace.js` → `/api/members/workspaces/*`
- Permissions: `member.workspaces.*` (legacy alias: `accounting.workspaces.*`)

In **private** workspace mode, each island maps to a workspace; shared islands and pending invitations come from `GET /api/members/workspaces/shared`. Accounts, transactions, categories, and budgets remain on `/api/accounting/*` with optional `workspace_id`.

See [`docs/workspaces.md`](../../docs/workspaces.md) for full architecture.

## Development

Pages are developed one-by-one from the Figma design (I-E-Tracker). Add new routes to `src/router/index.js` and corresponding view components under `src/views/` as each screen is implemented.
