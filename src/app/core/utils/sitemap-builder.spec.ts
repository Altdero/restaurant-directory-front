import { buildSitemapXml } from './sitemap-builder';

describe('buildSitemapXml', () => {
  it('includes the restaurant listing and each restaurant detail page, once per locale', () => {
    const xml = buildSitemapXml({
      siteUrl: 'https://example.com',
      restaurantIds: ['r-1', 'r-2'],
      locales: ['es', 'en'],
    });

    expect(xml).toContain('<loc>https://example.com/es/restaurants</loc>');
    expect(xml).toContain('<loc>https://example.com/en/restaurants</loc>');
    expect(xml).toContain('<loc>https://example.com/es/restaurants/r-1</loc>');
    expect(xml).toContain('<loc>https://example.com/en/restaurants/r-1</loc>');
    expect(xml).toContain('<loc>https://example.com/es/restaurants/r-2</loc>');
    expect(xml).toContain('<loc>https://example.com/en/restaurants/r-2</loc>');
  });

  it('produces a valid urlset with no entries beyond the listing page when there are no restaurants', () => {
    const xml = buildSitemapXml({
      siteUrl: 'https://example.com',
      restaurantIds: [],
      locales: ['es'],
    });

    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://example.com/es/restaurants</loc>');
    expect(xml).not.toContain('restaurants/');
  });

  it('escapes XML-significant characters in a URL', () => {
    const xml = buildSitemapXml({
      siteUrl: 'https://example.com',
      restaurantIds: ['r&1'],
      locales: ['es'],
    });

    expect(xml).toContain('<loc>https://example.com/es/restaurants/r&amp;1</loc>');
  });
});
