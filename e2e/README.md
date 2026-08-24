# E2E tests

Mocked default suite (`npm run e2e`) — Playwright drives a real Chromium against `ng serve` (`npm start`), with every backend call intercepted via `page.route()`. No backend required to run this suite.

The `@live` smoke suite (`npm run e2e:live`, run against a real backend at `localhost:8000`) is a later addition — see `PLAN.md`'s commit 19.

## Layout

- `e2e/fixtures/*.json` — response bodies used by the mocks.
- `e2e/mocks/session.ts` — `mockAnonymousSession(page)` / `mockAuthenticatedSession(page, opts)`. Call one of these first in every test: `AuthStore`'s constructor always attempts a silent `POST /auth/refresh/` before setting `initialized`, and every guard/toolbar waits on that signal.
- `e2e/mocks/api-mocks.ts` — small `page.route()` helpers (`mockGet`, `mockMethod`, `mockFavoritesList`, `mockReviews`) that match by **pathname only**, never by query string — Playwright's glob syntax treats `?` as a single-character wildcard, not a literal query separator, so pathname-only predicates are the unambiguous way to target one REST resource regardless of which query params a given request happens to carry. `mockFavoritesList`/`mockReviews` branch internally on the query string for the two endpoints that get hit with genuinely different, concurrently in-flight shapes (`/favorites/`'s app-wide seed vs. a page's own paginated list; `/reviews/`'s first page vs. a cursor "load more").
- `e2e/specs/*.spec.ts` — one file per feature area (auth, restaurant listing, restaurant detail, reviews, favorites, error handling), mirroring PLAN.md's commits 10-14.

## Fixtures: real vs. hand-authored

Most fixtures are **real responses recorded from a live local backend** (`http://localhost:8000/api/`, seeded with a `La Trattoria` restaurant, two categories, three menu items, and one review) via `curl`, then saved as-is. A few are hand-authored against `docs/API.md`'s documented shapes, because generating them for real wasn't worth the side effects:

- `error-429.json` — provoking a real 429 needs 30+ rapid anonymous requests inside a minute; not worth it against a shared local dev server. The exact `detail` text doesn't matter anyway — `error.interceptor.ts` always shows a hardcoded toast string regardless of the response body; only the `429` status and a `detail` field (any string) are needed for `mapApiError` to classify it as `'throttled'`.
- `register-response.json` — creating a second permanent throwaway account just to record this felt like more footprint than the well-documented, simple shape warranted.
- `reviews-page-1-with-next.json` / `reviews-page-2.json` — the real seeded data only has one review total, so there's no real second cursor page to record. These are synthetic: `reviews-page-1-with-next.json` is the real first-page review with a fabricated `next` URL attached, and `reviews-page-2.json` is a fully invented second review, used only by the "load more" test in `restaurant-detail.spec.ts`.

Every recorded fixture had its access token replaced with the placeholder `"mock-access-token"` before being committed — never commit a real JWT, even a short-lived one.

## Refreshing fixtures

Point a running backend at `http://localhost:8000/api/`, then re-run the same `curl` calls (see the recording commands in this project's history, or just hit each documented endpoint in `docs/API.md`) and re-sanitize any token before overwriting the fixture file.
