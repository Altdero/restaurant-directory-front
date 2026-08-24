import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FAVORITE_DATA } from '@core/interfaces/tokens';
import { Restaurant } from '@core/models/restaurant.model';
import { FavoritesStore } from '@core/services/favorites/favorites-store';

import { FavoritesPage } from './favorites-page';

const RESTAURANT_A = { id: 'r-1', name: 'La Trattoria' } as Restaurant;
const RESTAURANT_B = { id: 'r-2', name: 'Cantina Azul' } as Restaurant;

function fakeResource(value: unknown) {
  return {
    value: signal(value),
    isLoading: signal(false),
    error: signal(undefined),
    reload: vi.fn(),
  };
}

describe('FavoritesPage', () => {
  let list: ReturnType<typeof vi.fn>;
  let toggle: ReturnType<typeof vi.fn>;

  function createFixture(page: { count: number; results: readonly { restaurant: Restaurant }[] }) {
    toggle = vi.fn();
    const resource = fakeResource({
      count: page.count,
      next: null,
      previous: null,
      results: page.results,
    });
    list = vi.fn().mockReturnValue(resource);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FAVORITE_DATA, useValue: { list } },
        {
          provide: FavoritesStore,
          useValue: { favoritedIds: signal(new Set([RESTAURANT_A.id, RESTAURANT_B.id])), toggle },
        },
      ],
    });

    return TestBed.createComponent(FavoritesPage);
  }

  it('maps the favorites page to its nested restaurants', () => {
    const fixture = createFixture({
      count: 2,
      results: [{ restaurant: RESTAURANT_A }, { restaurant: RESTAURANT_B }],
    });
    fixture.detectChanges();

    expect(fixture.componentInstance['restaurants']()).toEqual([RESTAURANT_A, RESTAURANT_B]);
  });
});
