import {
  toCategoryParams,
  toFavoriteParams,
  toMenuItemParams,
  toRestaurantParams,
  toReviewParams,
} from './query-params';

describe('toRestaurantParams', () => {
  it('maps camelCase query fields to the API snake_case params', () => {
    expect(
      toRestaurantParams({
        category: 'cat-1',
        city: 'Mexico City',
        priceRange: '$$',
        minRating: 4,
        search: 'tacos',
        page: 2,
        pageSize: 12,
      }),
    ).toEqual({
      category: 'cat-1',
      city: 'Mexico City',
      price_range: '$$',
      min_rating: 4,
      search: 'tacos',
      page: 2,
      page_size: 12,
    });
  });
});

describe('toCategoryParams', () => {
  it('maps page and pageSize', () => {
    expect(toCategoryParams({ page: 1, pageSize: 10 })).toEqual({ page: 1, page_size: 10 });
  });
});

describe('toMenuItemParams', () => {
  it('maps camelCase query fields to the API snake_case params', () => {
    expect(
      toMenuItemParams({
        restaurantId: 'r-1',
        category: 'dessert',
        isAvailable: true,
        limit: 20,
        offset: 40,
      }),
    ).toEqual({
      restaurant_id: 'r-1',
      category: 'dessert',
      is_available: true,
      limit: 20,
      offset: 40,
    });
  });
});

describe('toReviewParams', () => {
  it('maps restaurantId only — cursor is never sent as a query filter', () => {
    expect(toReviewParams({ restaurantId: 'r-1' })).toEqual({ restaurant_id: 'r-1' });
  });
});

describe('toFavoriteParams', () => {
  it('maps page and pageSize', () => {
    expect(toFavoriteParams({ page: 1, pageSize: 10 })).toEqual({ page: 1, page_size: 10 });
  });
});
