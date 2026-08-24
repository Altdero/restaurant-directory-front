import { stripLocalePrefix } from './locale-path';

describe('stripLocalePrefix', () => {
  it('strips a leading /es segment', () => {
    expect(stripLocalePrefix('/es/restaurants')).toBe('/restaurants');
  });

  it('strips a leading /en segment', () => {
    expect(stripLocalePrefix('/en/categories/tacos')).toBe('/categories/tacos');
  });

  it('normalizes a bare locale root to /', () => {
    expect(stripLocalePrefix('/es')).toBe('/');
  });

  it('leaves a path with no locale segment untouched', () => {
    expect(stripLocalePrefix('/restaurants')).toBe('/restaurants');
  });
});
