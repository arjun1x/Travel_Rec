# Travel Rec frontend

Travel Rec is an editorial travel discovery interface for finding places, saving a shortlist, planning trips, and exploring stays. The frontend is a React 19 + TypeScript + Vite app with a responsive visual system, curated local photography, a copper compass mark, and an optional 3D compass sculpture.

## Run the frontend

From this directory:

```bash
npm install
npm run demo
```

The demo mode opens at <http://localhost:5173> with a local sample destination catalog and no backend dependency. Demo mode is designed for reviewing the interface; accounts, live weather, stays, assistant chat, and itinerary generation require the API.

For the full application, start the backend described in the repository root README, then run:

```bash
npm run dev
```

The Vite development server proxies `/api` to `http://localhost:8000` by default. Set `API_PROXY_TARGET` when the API runs elsewhere.

## Useful commands

```bash
npm run build       # production build (live API mode)
npm run build:demo  # production build with the local catalog
npm run test        # discovery and SSE parser tests
npm run lint        # Oxlint
```

`VITE_DEMO_MODE=true` enables the preview catalog. Public variables are safe to ship to the browser; keep server secrets such as JWT and Anthropic keys in the backend environment.

## Frontend structure

- `src/pages` contains landing, explore, collections, destination, saved, trips, profile, and auth screens.
- `src/components` contains the navigation shell, destination and stay cards, filters, map/globe views, modals, and streaming assistant/itinerary UI.
- `src/lib` contains API/auth clients, demo data, shortlist persistence, discovery filters, photography mapping, and SSE parsing.
- `public/images` contains the small set of locally bundled editorial destination photos used by the cards and hero.

The frontend is intentionally usable without image hosts or a running API in demo mode, while live mode keeps the existing backend contracts intact.
