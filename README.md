# Eistedglobal Revamp

Monorepo with:
- `api/`: Express + TypeScript + SQLite
- `app/`: Angular 19 + Angular Material

## Requirements
- Node.js 20+
- npm 10+

## Install
```bash
npm run install:all
```

## Run (development)
Use two terminals:

Terminal 1:
```bash
npm run api
```

Terminal 2:
```bash
npm run app
```

Default URLs:
- App: `http://localhost:4200`
- API: `http://localhost:3000`

## Data setup

### Real-data migration (legacy SQL -> SQLite)
```bash
npm run migrate
```
Notes:
- Imports legacy data from `api/src/config/migrate.ts` configured SQL path.
- If the imported data has no current-year registrations, migration now backfills current-year `inscriptos` from the latest existing year.

### Demo dataset
```bash
cd api
npm run seed:demo
```
Notes:
- Demo seed wipes current DB and generates realistic mock data.
- Demo now always includes `inscriptos` for the current year.

### Minimal seed (admin + base catalogs)
```bash
cd api
npm run seed
```

## Build
```bash
cd api && npm run build
cd ../app && npm run build
```

## Useful tips
- Restart `ng serve` after changing `app/angular.json` (styles/themes in this file are not always hot-reloaded).
- Keep `api/data/*.db` out of git; use migration/seed scripts to reproduce local data.
- Use `seed:demo` for UI demos and QA, and `migrate` only when validating legacy data import behavior.
- If Material styling changes look inconsistent, verify the prebuilt theme is loaded first in `app/angular.json`.
