import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SeoService } from './seo.service';

function createService(locale: string, pathname: string, search = ''): SeoService {
  window.history.pushState({}, '', pathname + search);
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  return TestBed.inject(SeoService);
}

function linkHref(marker: string): string | null {
  return document.head.querySelector(`link[data-seo="${marker}"]`)?.getAttribute('href') ?? null;
}

describe('SeoService', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[data-seo]').forEach((el) => el.remove());
  });

  it('sets the title and meta description', () => {
    const service = createService('es', '/es/restaurants');
    service.updatePage({ title: 'Restaurantes', description: 'Encuentra restaurantes.' });

    expect(document.title).toBe('Restaurantes');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Encuentra restaurantes.',
    );
  });

  it('builds the canonical URL and hreflang alternates from the current locale-prefixed path', () => {
    const service = createService('en', '/en/restaurants/abc-123');
    service.updatePage({ title: 'Restaurant', description: 'A great spot.' });

    expect(linkHref('canonical')).toBe('http://localhost:4200/en/restaurants/abc-123');
    expect(linkHref('alternate-es')).toBe('http://localhost:4200/es/restaurants/abc-123');
    expect(linkHref('alternate-en')).toBe('http://localhost:4200/en/restaurants/abc-123');
    expect(linkHref('alternate-x-default')).toBe('http://localhost:4200/en/restaurants/abc-123');
  });

  it('self-references the current query string when no canonicalQueryParams override is given', () => {
    const service = createService('es', '/es/restaurants', '?city=Austin&page=2');
    service.updatePage({ title: 'Restaurantes', description: 'x' });

    expect(linkHref('canonical')).toBe('http://localhost:4200/es/restaurants?city=Austin&page=2');
  });

  it('rebuilds the query string from canonicalQueryParams, dropping undefined/empty entries and sorting keys', () => {
    const service = createService('es', '/es/restaurants', '?page=1');
    service.updatePage({
      title: 'Restaurantes',
      description: 'x',
      canonicalQueryParams: { page: undefined, city: 'Austin', search: '' },
    });

    expect(linkHref('canonical')).toBe('http://localhost:4200/es/restaurants?city=Austin');
  });

  it('upserts link tags rather than duplicating them on repeated calls', () => {
    const service = createService('es', '/es/restaurants');
    service.updatePage({ title: 'A', description: 'a' });
    service.updatePage({ title: 'B', description: 'b' });

    expect(document.head.querySelectorAll('link[data-seo="canonical"]')).toHaveLength(1);
    expect(document.title).toBe('B');
  });
});
