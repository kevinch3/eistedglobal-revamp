# Eistedglobal Revamp

Monorepo with:
- `api/`: Express + TypeScript + SQLite (better-sqlite3)
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

Terminal 1 — API:
```bash
npm run api
```

Terminal 2 — Angular app:
```bash
npm run app
```

Default URLs:
- App: `http://localhost:4200`
- API: `http://localhost:3000`

## Data setup

### Minimal seed (admin user + base catalogs)
```bash
npm run seed
```
Creates the default admin account and category list. Safe to run on an existing DB — skips already-present rows.

### Demo dataset
```bash
npm run seed:demo
```
**Wipes** the database and fills it with realistic mock data — 4 editions, 15 competitions, 36 participants, ~400 registrations, and works for past years.

Demo credentials:
- Username: `admin`
- Password: `admin1234`

### Real-data migration (legacy MySQL → SQLite)
```bash
npm run migrate
```
Imports legacy data from the SQL dump configured in `api/src/config/migrate.ts`.
If the imported data has no current-year registrations, the migration backfills them from the most recent available year.

## API configuration (`api/.env`)

Create `api/.env` with:
```
PORT=3000
JWT_SECRET=change_me_in_production
```

`PORT` defaults to `3000` if omitted. `JWT_SECRET` must be set to a strong random value in production.

## Build

```bash
cd api && npm run build
cd ../app && npm run build
```

The Angular production build output is at `app/dist/app/browser/`.

## GitHub Pages deployment

The included workflow (`.github/workflows/deploy.yml`) automatically builds and deploys the Angular frontend to GitHub Pages on every push to `main`.

**Before deploying:**
1. Edit `app/src/environments/environment.prod.ts` and replace `https://YOUR_API_HOST/api` with the URL of your hosted API.
2. Enable GitHub Pages in your repository: **Settings → Pages → Source: GitHub Actions**.
3. Push to `main` — the workflow runs automatically.

The deployed app URL will be `https://<your-username>.github.io/<repo-name>/`.

## Development tips

- Restart `ng serve` after changing `app/angular.json` (styles and themes are not always hot-reloaded).
- Keep `api/data/*.db` out of git — add it to `.gitignore`. Use the seed/migrate scripts to reproduce local data.
- Use `seed:demo` for UI demos and QA; use `migrate` only when validating legacy data import.
- If Material styling looks inconsistent, verify the prebuilt theme is loaded first in `app/angular.json` (under `styles`).
- The API uses `better-sqlite3` (synchronous). All queries are blocking — keep individual queries fast and avoid N+1 patterns in routes.
- Angular standalone components — no `NgModule` needed. Add new imports directly to the component's `imports` array.
- JWT tokens are stored in `localStorage` under the key `eistedglobal_token`. They expire based on the `JWT_SECRET` and signing options in `api/src/routes/auth.ts`.
