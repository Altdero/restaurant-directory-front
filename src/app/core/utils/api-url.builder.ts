export type QueryParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Serializes filter/pagination params into a query string, skipping
 * `undefined`, `null` and empty-string values so unset filters never appear
 * as literal `"undefined"` in the request. Works for both page-number
 * (`page`, `page_size`) and limit/offset (`limit`, `offset`) pagination —
 * both are plain key/value pairs. Cursor pagination is deliberately not
 * supported here: `cursor` is an opaque value that must only ever come from
 * a `next`/`previous` URL the API already returned, never be constructed.
 */
export function buildQueryParams(params: QueryParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** Joins an API base URL, a resource path and optional query params. */
export function buildUrl(baseUrl: string, path: string, params?: QueryParams): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}${params ? buildQueryParams(params) : ''}`;
}
