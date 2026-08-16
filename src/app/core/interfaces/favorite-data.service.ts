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
  list(query: Signal<FavoriteQuery>): AsyncResource<CountedPage<Favorite>>;
  toggle(): AsyncMutation<string, { readonly favorited: boolean }>;
}
