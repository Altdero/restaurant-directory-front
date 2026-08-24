import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CATEGORY_DATA, RESTAURANT_DATA } from '@core/interfaces/tokens';
import { RestaurantQuery } from '@core/interfaces/restaurant-data.service';
import { CountedPage } from '@core/models/pagination.model';
import { AuthStore } from '@core/services/auth/auth.store';
import { FavoritesStore } from '@core/services/favorites/favorites-store';

import { RestaurantListPage } from './restaurant-list-page';

const EMPTY_PAGE: CountedPage<never> = { count: 0, next: null, previous: null, results: [] };

function fakeResource() {
  return {
    value: signal(EMPTY_PAGE),
    isLoading: signal(false),
    error: signal(undefined),
    reload: vi.fn(),
  };
}

describe('RestaurantListPage', () => {
  let capturedQuery: Signal<RestaurantQuery> | undefined;
  let navigate: ReturnType<typeof vi.fn>;
  let toggleFavorite: ReturnType<typeof vi.fn>;

  function createFixture() {
    capturedQuery = undefined;
    toggleFavorite = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: RESTAURANT_DATA,
          useValue: {
            list: (query: Signal<RestaurantQuery>) => {
              capturedQuery = query;
              return fakeResource();
            },
          },
        },
        { provide: CATEGORY_DATA, useValue: { list: () => fakeResource() } },
        { provide: AuthStore, useValue: { isAuthenticated: signal(false) } },
        {
          provide: FavoritesStore,
          useValue: { favoritedIds: signal(new Set<string>()), toggle: toggleFavorite },
        },
      ],
    });

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    return TestBed.createComponent(RestaurantListPage);
  }

  it('coerces string query-param inputs into a typed RestaurantQuery', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('category', 'c-1');
    fixture.componentRef.setInput('minRating', '4');
    fixture.componentRef.setInput('page', '2');
    fixture.detectChanges();

    expect(capturedQuery?.()).toEqual({
      category: 'c-1',
      city: undefined,
      priceRange: undefined,
      minRating: 4,
      search: undefined,
      page: 2,
    });
  });

  it('defaults to page 1 when no page query param is present', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(capturedQuery?.().page).toBe(1);
  });

  it('navigates with merged filters and resets the page on a filters change', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    fixture.componentInstance['onFiltersChange']({ city: 'Guadalajara', search: 'tacos' });

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { city: 'Guadalajara', search: 'tacos', page: null },
        queryParamsHandling: 'merge',
      }),
    );
  });

  it('navigates with just the new page on a page change', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    fixture.componentInstance['onPageChange'](3);

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { page: 3 },
        queryParamsHandling: 'merge',
      }),
    );
  });

  it('delegates favorite toggling to FavoritesStore', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    fixture.componentInstance['toggleFavorite']('r-1');

    expect(toggleFavorite).toHaveBeenCalledWith('r-1');
  });
});
