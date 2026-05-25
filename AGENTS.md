# SIOB — Express + Mongoose backend for SIO (ERP/MES)

## Commands

```bash
npm install         # install deps
npm run dev         # dev with babel-node at http://localhost:3000
npm run build       # transpile with Babel to dist/
```

## Architecture

- **Express** on port 3000 (default), **Socket.io** for real-time events.
- **MongoDB** via Mongoose, auto-increment counters.
- SSL certs optional (`c:/certificado/server/`) — falls back to HTTP.

## Critical: .env file

`.env` is in `.gitignore` — **not tracked by git**. If missing or incomplete, the app may fail silently.

### Quick setup (first time or after clone)

```bash
cp .env.example .env
# Then edit SEED and VAPID keys as needed
```

All config vars have sensible defaults in `src/config.js`:
- `MONGODB_URI` → `'mongodb://127.0.0.1:27017/SIO'`
- `PORT_URI` → `3000`
- `SEED` → `'Viva-Dios-la-Libertad-y-los-pueblos-libres'`
- `EXP` → `'2d'`

## Frontend serving

SIOB serves the compiled Angular app from `src/public/` via `express.static`.
The catch-all route `app.get('*')` returns `index.html` for SPA routing.

To update after frontend changes:
```bash
cd ../SIOF && npm run build && cp -r dist/sio-fe/* ../SIOB/src/public/
```

## Session Log — 2026-05-25

- Fixed `upset` → `upsert` typo in `orden-poligrafica.js`.
- Gracefully handle missing `@thiagoelg/node-printer` in `etiquetas.routes.js` (try/catch fallback).
- Added defaults to `config.js` exports so `.env` is optional.
- Added `.env.example` with required variables.
