import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { FavoriteDataService, FavoriteQuery } from '@core/interfaces/favorite-data.service';
import { Favorite, toFavorite } from '@core/models/favorite.model';
import { CountedPage } from '@core/models/pagination.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { mapCountedPage } from '@core/utils/pagination-mapper';
import { toFavoriteParams } from '@core/utils/query-params';
import { environment } from '@environments/environment';

import { createMutation, toAsyncResource } from './http-resource.adapter';

const EMPTY_PAGE: CountedPage<Favorite> = { count: 0, next: null, previous: null, results: [] };

/** See `RestaurantHttpResourceService` for why `@Injectable()` with no `providedIn`. */
@Injectable()
export class FavoriteHttpResourceService implements FavoriteDataService {
  private readonly http = inject(HttpClient);

  list(query: Signal<FavoriteQuery | undefined>): AsyncResource<CountedPage<Favorite>> {
    const resource = httpResource(
      () => {
        const value = query();
        return value
          ? buildUrl(environment.apiBaseUrl, '/favorites/', toFavoriteParams(value))
          : undefined;
      },
      { defaultValue: EMPTY_PAGE, parse: mapCountedPage(toFavorite) },
    );
    return toAsyncResource(resource);
  }

  toggle(): AsyncMutation<string, { readonly favorited: boolean }> {
    return createMutation((restaurantId) =>
      this.http.post<{ readonly favorited: boolean }>(
        buildUrl(environment.apiBaseUrl, '/favorites/toggle/'),
        { restaurant_id: restaurantId },
      ),
    );
  }
}
