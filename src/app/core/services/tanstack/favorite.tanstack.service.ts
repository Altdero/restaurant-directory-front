import { HttpClient } from '@angular/common/http';
import { Injectable, inject, Signal } from '@angular/core';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { FavoriteDataService, FavoriteQuery } from '@core/interfaces/favorite-data.service';
import { ApiError } from '@core/models/api-error.model';
import { Favorite, toFavorite } from '@core/models/favorite.model';
import { CountedPage } from '@core/models/pagination.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { mapCountedPage } from '@core/utils/pagination-mapper';
import { toFavoriteParams } from '@core/utils/query-params';
import { environment } from '@environments/environment';
import { firstValueFrom, map } from 'rxjs';

import { toAsyncMutation, toAsyncResource } from './tanstack.adapter';

/** See `RestaurantHttpResourceService` for why `@Injectable()` with no `providedIn`. */
@Injectable()
export class FavoriteTanStackService implements FavoriteDataService {
  private readonly http = inject(HttpClient);

  list(query: Signal<FavoriteQuery>): AsyncResource<CountedPage<Favorite>> {
    const result = injectQuery<CountedPage<Favorite>, ApiError>(() => {
      const q = query();
      return {
        queryKey: ['favorites', 'list', q],
        queryFn: () =>
          firstValueFrom(
            this.http
              .get<unknown>(buildUrl(environment.apiBaseUrl, '/favorites/', toFavoriteParams(q)))
              .pipe(map(mapCountedPage(toFavorite))),
          ),
      };
    });
    return toAsyncResource(result);
  }

  toggle(): AsyncMutation<string, { readonly favorited: boolean }> {
    const mutation = injectMutation<{ readonly favorited: boolean }, ApiError, string>(() => ({
      mutationFn: (restaurantId) =>
        firstValueFrom(
          this.http.post<{ readonly favorited: boolean }>(
            buildUrl(environment.apiBaseUrl, '/favorites/toggle/'),
            { restaurant_id: restaurantId },
          ),
        ),
    }));
    return toAsyncMutation(mutation);
  }
}
