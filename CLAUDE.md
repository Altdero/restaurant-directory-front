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
- Whether a new HTTP call needs `withCredentials: true` — every request does; a missed one silently breaks the refresh-cookie flow only for that call, which is easy to miss in testing.
- Whether new template text has a corresponding `messages.es.xlf` entry — a missing translation fails the production build, not silently falls back to English.
- Whether a new import crossing into another top-level directory uses the path alias (`@core/*`, `@shared/*`, `@features/*`, `@layout/*`, `@environments/*`) rather than a relative path — see AGENTS.md §3.
- Whether code that ends up in the browser bundle ever references `process.env.*` directly — it will type-check (via `@types/node`) but throws at runtime, since `process` doesn't exist client-side. Only `scripts/build.mjs`'s `--define` substitution (via the `NG_APP_API_BASE_URL` identifier) makes this safe, and only in `environment.prod.ts`.
