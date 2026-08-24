import { TestBed } from '@angular/core/testing';

import { JsonLdService } from './json-ld.service';

describe('JsonLdService', () => {
  afterEach(() => {
    document.head.querySelectorAll('script[data-seo="seo-jsonld"]').forEach((el) => el.remove());
  });

  it('creates a single application/ld+json script tag with the serialized schema', () => {
    const service = TestBed.inject(JsonLdService);
    service.set({ '@type': 'Restaurant', name: 'La Trattoria' });

    const script = document.head.querySelector('script[data-seo="seo-jsonld"]');
    expect(script?.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(script!.textContent!)).toEqual({
      '@type': 'Restaurant',
      name: 'La Trattoria',
    });
  });

  it('replaces the existing tag rather than duplicating it on a second call', () => {
    const service = TestBed.inject(JsonLdService);
    service.set({ '@type': 'Restaurant', name: 'La Trattoria' });
    service.set({ '@type': 'Restaurant', name: 'Guadalajara' });

    const scripts = document.head.querySelectorAll('script[data-seo="seo-jsonld"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent!)).toEqual({
      '@type': 'Restaurant',
      name: 'Guadalajara',
    });
  });

  it('removes the tag on clear', () => {
    const service = TestBed.inject(JsonLdService);
    service.set({ '@type': 'Restaurant', name: 'La Trattoria' });
    service.clear();

    expect(document.head.querySelector('script[data-seo="seo-jsonld"]')).toBeNull();
  });
});
