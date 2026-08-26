/**
 * Builds a `sitemap.xml` document covering both locale trees for the three
 * real public/server-rendered pages this app has: the home page, the
 * restaurant listing, and each restaurant's detail page. Deliberately a
 * flat `<url>` list, no
 * `xhtml:link` hreflang annotations — valid either way per the sitemap
 * protocol, and each page already emits its own `<link rel="alternate">`
 * hreflang tags (`SeoService`), so the annotated form would only duplicate
 * that for a real XML-namespace cost. Pure and synchronous — the actual
 * restaurant-id fetch lives in `server.ts`, which calls this with the data
 * already in hand, so this stays unit-testable without Express or `fetch`.
 */
export function buildSitemapXml(options: {
  readonly siteUrl: string;
  readonly restaurantIds: readonly string[];
  readonly locales: readonly string[];
}): string {
  const { siteUrl, restaurantIds, locales } = options;

  const urls = locales.flatMap((locale) => [
    `${siteUrl}/${locale}`,
    `${siteUrl}/${locale}/restaurants`,
    ...restaurantIds.map((id) => `${siteUrl}/${locale}/restaurants/${id}`),
  ]);

  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${entries}\n` +
    '</urlset>\n'
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
