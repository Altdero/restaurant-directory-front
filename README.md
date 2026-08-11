# Restaurant Directory

A bilingual, server-rendered restaurant directory. Browse, search and filter restaurants by category, city, price range and rating; view menus and reviews; save favorites; and, for restaurant owners, manage listings, menus and photos.

## Stack

- **Angular 22** with SSR (`@angular/ssr`), Angular Material 22, TypeScript strict mode
- **`@angular/localize`** — native, compile-time i18n with URL-prefixed locales (`/es`, `/en`); Spanish is the default, English is the source locale
- **`httpResource()`** and **TanStack Query** — two interchangeable data-layer implementations behind one shared interface, switchable via `environment.dataLayer`
- **Reactive Forms**, Vitest (unit), Playwright (E2E), ESLint, Prettier, Husky + lint-staged, Conventional Commits
- Backend: a Django REST Framework API (JWT auth via `httpOnly` refresh cookie, Cloudinary direct uploads) — see [`docs/API.md`](./docs/API.md)

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the data-layer design, rendering strategy and i18n mechanics, and [`AGENTS.md`](./AGENTS.md) for coding conventions.

## Prerequisites

- Node.js (see `.nvmrc` / `package.json engines` if present) and npm
- A running instance of the backend API (local: `http://localhost:8000/api`)

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` — see [Environment variables](#environment-variables) below.

## Development server

```bash
npm start
```

Serves the source locale unprefixed at `http://localhost:4200` for fast rebuilds and HMR. The dev server serves one locale at a time; to preview the Spanish build locally, use the `development-es` configuration:

```bash
ng serve --configuration development-es
```

## Building

```bash
npm run build
```

Production builds compile once and inline translations per locale (`"localize": true`), emitting separate browser/server bundles for `es` and `en` under `dist/`. `@angular/ssr`'s `AngularAppEngine` serves both locales from a single Node process — see [Deployment](#deployment).

## Testing

```bash
npm test              # Vitest unit tests
npm run e2e            # Playwright, mocked API fixtures — no backend required
npm run e2e:live       # Playwright, @live-tagged smoke suite against a running backend
```

`npm run e2e:live` expects the backend at `http://localhost:8000` and a seeded test user; see `e2e/README.md` for fixture and seed-data details.

## Internationalization

Translatable content is marked with the `i18n` template attribute and `$localize` tagged strings, extracted with:

```bash
ng extract-i18n --format xlf2 --out-file src/locale/messages.xlf
```

Translations live in `src/locale/messages.es.xlf` and are committed alongside the source strings they translate — a feature is not complete until its translations exist. The production build fails if any string is missing a translation (`i18nMissingTranslation: "error"`), so this is enforced by the build, not just convention.

## Environment variables

| Variable        | Description                                                                                                      | Example                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `API_BASE_URL`  | Base URL of the Django REST API, no trailing slash                                                               | `http://localhost:8000/api` |
| `PORT`          | Port the Node SSR server binds to. Render sets this automatically in production                                  | `4200`                      |
| `ALLOWED_HOSTS` | Comma-separated hostnames the SSR server accepts. Requests for any other `Host`/`X-Forwarded-Host` receive `400` | `localhost`                 |

See [`.env.example`](./.env.example) for the template. No Cloudinary credentials are needed on the frontend — the upload signature (including `cloud_name`) is issued by the backend at request time.

## Deployment

Deployed on [Render](https://render.com) as a Node.js web service. The backend API is a separate Render service; the database is hosted on Supabase.

**One web service serves both locales.** The production build produces per-locale browser and server bundles plus a single Node entry point; `AngularAppEngine` reads the locale from the first path segment of each incoming request and dispatches to the matching bundle. Do not deploy one service per language and do not put a locale-splitting reverse proxy in front of it — a single `node` process is sufficient and correct.

Render configuration:

- **Build command**: `npm ci && npm run build`
- **Start command**: the generated SSR server entry (`node dist/restaurant-directory/server/server.mjs` — confirm the exact path against your build output, since it is derived from the project name in `angular.json`)
- **Environment**: set `API_BASE_URL`, `ALLOWED_HOSTS` (the Render-assigned or custom domain), and any Cloudinary-adjacent variables the backend itself requires. `PORT` is provided by Render automatically.

Two things that will produce a `400` or a broken refresh flow if skipped:

- The production hostname must be present in `ALLOWED_HOSTS` / the builder's `security.allowedHosts` — `@angular/ssr` rejects requests for unlisted hosts.
- Render terminates TLS and proxies the request — the server must trust forwarded proxy headers for correct protocol/host resolution.
