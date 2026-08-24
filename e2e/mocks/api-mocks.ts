import type { Page, Route } from '@playwright/test';

/** Matches `environment.ts`'s dev `apiBaseUrl` — see docs/API.md. */
export const API_BASE = 'http://localhost:8000/api';

export const EMPTY_PAGE = { count: 0, next: null, previous: null, results: [] };
export const EMPTY_CURSOR_PAGE = { next: null, previous: null, results: [] };

function apiPathname(path: string): string {
  return new URL(`${API_BASE}${path}`).pathname;
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

/**
 * Matches by pathname only (never by query string) — Playwright's `url`
 * glob treats `?` as a single-character wildcard, not a literal query
 * separator, so pathname-only predicates are the unambiguous way to target
 * one REST resource regardless of which filters/pagination params a given
 * request happens to carry.
 */
function byPath(path: string) {
  const pathname = apiPathname(path);
  return (url: URL) => url.pathname === pathname;
}

/**
 * One-shot GET mock: the same body every time this pathname is hit.
 * Register it again later in a test (same path) to change the response for
 * subsequent requests — Playwright routes are LIFO, so the newest
 * registration wins without needing `page.unroute()` first.
 */
export async function mockGet(
  page: Page,
  path: string,
  body: unknown,
  status = 200,
): Promise<void> {
  await page.route(byPath(path), (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    return fulfillJson(route, body, status);
  });
}

export async function mockMethod(
  page: Page,
  path: string,
  method: string,
  body: unknown,
  status = 200,
): Promise<void> {
  await page.route(byPath(path), (route) => {
    if (route.request().method() !== method) {
      return route.fallback();
    }
    return fulfillJson(route, body, status);
  });
}

/**
 * `/favorites/` is fetched with two distinct query shapes concurrently
 * whenever `FavoritesPage` is open — `FavoritesStore`'s app-wide seed
 * (`page_size=100`, no `page`) and the page's own paginated list
 * (`page=N&page_size=10`) — both in flight at once, so one route has to
 * branch on the live query string rather than being replaced mid-test.
 */
export async function mockFavoritesList(
  page: Page,
  options: { seed?: unknown; paginated?: unknown } = {},
): Promise<void> {
  await page.route(byPath('/favorites/'), (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    const params = new URL(route.request().url()).searchParams;
    const isSeed = params.get('page_size') === '100' && !params.has('page');
    return fulfillJson(
      route,
      isSeed ? (options.seed ?? EMPTY_PAGE) : (options.paginated ?? EMPTY_PAGE),
    );
  });
}

/**
 * `/reviews/` shares one pathname for both the initial page (query:
 * `restaurant_id`) and every "load more" follow-up (query: `cursor`, the
 * API's own opaque `next` URL — never reconstructed, per docs/API.md), so
 * the branch is on whether `cursor` is present.
 */
export async function mockReviews(
  page: Page,
  options: { initial: unknown; next?: unknown },
): Promise<void> {
  await page.route(byPath('/reviews/'), (route) => {
    if (route.request().method() !== 'GET') {
      return route.fallback();
    }
    const params = new URL(route.request().url()).searchParams;
    const isLoadMore = params.has('cursor');
    return fulfillJson(route, isLoadMore ? (options.next ?? EMPTY_CURSOR_PAGE) : options.initial);
  });
}
