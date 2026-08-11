import { buildQueryParams, buildUrl } from './api-url.builder';

describe('buildQueryParams', () => {
  it('serializes primitive values', () => {
    expect(buildQueryParams({ page: 2, search: 'tacos', is_available: true })).toBe(
      '?page=2&search=tacos&is_available=true',
    );
  });

  it('omits undefined, null and empty-string values', () => {
    expect(buildQueryParams({ city: undefined, category: null, search: '' })).toBe('');
  });

  it('returns an empty string when every value is skippable', () => {
    expect(buildQueryParams({ a: undefined })).toBe('');
  });

  it('keeps falsy-but-meaningful values like 0 and false', () => {
    expect(buildQueryParams({ min_rating: 0, is_active: false })).toBe(
      '?min_rating=0&is_active=false',
    );
  });
});

describe('buildUrl', () => {
  it('joins a base URL without a trailing slash and a path with a leading slash', () => {
    expect(buildUrl('http://localhost:8000/api', '/restaurants/')).toBe(
      'http://localhost:8000/api/restaurants/',
    );
  });

  it('joins a base URL with a trailing slash and a path without a leading slash', () => {
    expect(buildUrl('http://localhost:8000/api/', 'restaurants/')).toBe(
      'http://localhost:8000/api/restaurants/',
    );
  });

  it('appends query params when provided', () => {
    expect(buildUrl('http://localhost:8000/api', '/restaurants/', { page: 2 })).toBe(
      'http://localhost:8000/api/restaurants/?page=2',
    );
  });

  it('omits the query string entirely when no params are given', () => {
    expect(buildUrl('http://localhost:8000/api', '/categories/')).toBe(
      'http://localhost:8000/api/categories/',
    );
  });
});
