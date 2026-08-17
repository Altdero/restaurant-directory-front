# CLAUDE.md

Claude Code-specific notes that complement [AGENTS.md](./AGENTS.md). Read `AGENTS.md` first — it is the authoritative source for project context, conventions, and workflow rules, and applies to every AI assistant, not only Claude Code.

## Session start checklist

1. Read `AGENTS.md` in full before writing or editing any file.
2. Read `docs/API.md` before touching `core/models/`, `core/interfaces/`, or any data-layer service (`core/services/http-resource/`, `core/services/tanstack/`).
3. Check `docs/ARCHITECTURE.md` before adding a new resource or changing the data-layer switch in `app.config.ts`.

## Commands this project relies on

- `ng lint && ng build` — what `pre-push` runs; run it yourself before proposing a commit is ready, not only when the hook blocks you.
- `ng extract-i18n --format xlf2 --out-file src/locale/messages.xlf` — regenerate source messages after adding or changing `i18n`-marked template text, then update `src/locale/messages.es.xlf` in the same commit.
- `npm run e2e` — mocked Playwright suite, no backend required.
- `npm run e2e:live` — `@live`-tagged smoke suite against a running backend at `localhost:8000`.

## Things worth double-checking before large changes here

- Whether a route needs to be public/server-rendered vs. protected/client-rendered — get this wrong and either SSR renders a logged-out shell for an authenticated page, or a public SEO page loses its server-rendered HTML.
- Whether a new HTTP call to _our own API_ needs `withCredentials: true` — `auth.interceptor.ts` already adds it automatically for any request to `environment.apiBaseUrl`, but a call built with a raw `HttpClient`/`HttpBackend` (bypassing the interceptor chain, as `TokenRefreshCoordinator` deliberately does) needs it set explicitly. Never add it to a third-party request (e.g. Cloudinary) — that's a different origin and doesn't expect it.
- Whether new template text (or a `$localize` tagged string in a `.ts` file — see `error.interceptor.ts`'s 429 toast for a working example) has a corresponding `messages.es.xlf` entry — a missing translation fails the production build, not silently falls back to English.
- Whether a new import crossing into another top-level directory uses the path alias (`@core/*`, `@shared/*`, `@features/*`, `@layout/*`, `@environments/*`) rather than a relative path — see AGENTS.md §3.
- Whether code that ends up in the browser bundle ever references `process.env.*` directly — it will type-check (via `@types/node`) but throws at runtime, since `process` doesn't exist client-side. Only `scripts/build.mjs`'s `--define` substitution (via the `NG_APP_API_BASE_URL` identifier) makes this safe, and only in `environment.prod.ts`.
- Whether a newly-added Angular Material component (`MatDialog`, etc.) actually needs `provideAnimationsAsync()`/`provideNoopAnimations()` before adding one — verify with a real build first. `MatSnackBar` needed neither; see AGENTS.md §3 and PLAN.md's "Interceptors" section for the full story of getting this wrong the first time.
- Whether a third-party CSS-only package (a self-hosted font, an icon set) belongs in `angular.json`'s `styles` array — it doesn't, on this Angular version: `@angular/build:application`'s schema rejects bare package specifiers there (requires an actual file path ending in a recognized extension), the opposite of most such packages' own documented "add it to your bundler's styles array" instructions. Import it via a Sass `@use` of the package's `.css` entry point inside `styles.scss` instead (see `docs/ARCHITECTURE.md`'s "UI theme, shell & dark mode" section for the real error and fix).
- Whether a custom Angular Material color needs `mat.theme()` to accept a raw hex — it never does; `primary`/`tertiary` must be a precomputed M3 tonal palette map. Generate one with `ng generate @angular/material:m3-theme --primary-color=... --tertiary-color=... --directory=... --defaults` (the `--defaults` flag is required for it to actually run non-interactively — `--interactive=false` alone silently no-ops) and commit the output; don't hand-roll a palette or assume a bare hex works.
- Whether `/` (home) actually resolves on a real build — it doesn't yet, and won't until `features/home/` adds a real `path: ''` route. `app.routes.server.ts`'s `**` → `Prerender` catch-all only prerenders routes the extractor discovers by walking `app.routes.ts`; with no `path: ''` entry there, `/` isn't one of them, and the built SSR server 404s on it (verified with a real `curl`) even though a stray no-routes-at-all build earlier in the project happened to still emit a static `index.html` for it by accident. Don't take that earlier "Prerendered N static routes" build log as proof `/` is routed — check `app.routes.ts` directly.
- Whether a new component pulls in Angular Material modules with real weight (`card`/`form-field`/`input`/`button`/`menu`/`progress-spinner`, etc.) — `angular.json`'s bundle budget (`budgets[0].maximumWarning`) may need raising, same as it did for TanStack in commit 8. Check the real `npm run build` output before assuming the existing budget still fits; don't tune it preemptively.
