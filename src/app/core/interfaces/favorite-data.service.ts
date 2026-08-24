import { Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { Favorite } from '@core/models/favorite.model';
import { CountedPage } from '@core/models/pagination.model';

export interface FavoriteQuery {
  readonly page?: number;
  readonly pageSize?: number;
}

/**
 * `toggle()` is the only write operation exposed: `favorites/toggle/` is
 * what the heart-icon UI actually uses (see docs/API.md); a raw
 * create/delete pair would need the favorite's own id, not the restaurant
 * id, which the toggle-by-restaurant-id flow never has to look up.
 */
export interface FavoriteDataService {
  /**
   * `undefined` skips the fetch entirely — the same convention as
   * `RestaurantDataService.byId`'s `Signal<string | undefined>`. Needed by
   * `FavoritesStore`, which must never fire `GET favorites/` for an
   * anonymous visitor: that endpoint requires auth, and firing it anyway
   * would trip `error.interceptor.ts`'s 401-retry-then-forced-logout path
   * for someone who was just browsing a public page.
   */
  list(query: Signal<FavoriteQuery | undefined>): AsyncResource<CountedPage<Favorite>>;
  toggle(): AsyncMutation<string, { readonly favorited: boolean }>;
}
