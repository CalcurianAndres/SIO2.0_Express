# SIOB — Express + Mongoose backend for SIO (ERP/MES)

## Commands

```bash
npm install         # install deps
npm run dev         # dev with babel-node at http://localhost:3000
```

## Architecture

- **Express** on port 3000, **Socket.io** for real-time events.
- **MongoDB** via Mongoose, auto-increment counters.
- SSL certs optional (`c:/certificado/server/`) — falls back to HTTP.

## Session Log — 2026-05-25

- Fixed `upset` → `upsert` typo in `orden-poligrafica.js`.
- Gracefully handle missing `@thiagoelg/node-printer` in `etiquetas.routes.js` (try/catch fallback).
