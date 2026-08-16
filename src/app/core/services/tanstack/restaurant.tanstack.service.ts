import { HttpClient } from '@angular/common/http';
import { Injectable, inject, Signal } from '@angular/core';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { RestaurantDataService, RestaurantQuery } from '@core/interfaces/restaurant-data.service';
import { ApiError } from '@core/models/api-error.model';
import { CountedPage } from '@core/models/pagination.model';
import {
  Restaurant,
  RestaurantDto,
  RestaurantWrite,
  toRestaurant,
} from '@core/models/restaurant.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { mapCountedPage } from '@core/utils/pagination-mapper';
import { toRestaurantParams } from '@core/utils/query-params';
import { environment } from '@environments/environment';
import { firstValueFrom, map } from 'rxjs';

import { toAsyncMutation, toAsyncResource } from './tanstack.adapter';

/** See `RestaurantHttpResourceService` for why `@Injectable()` with no `providedIn`. */
@Injectable()
export class RestaurantTanStackService implements RestaurantDataService {
  private readonly http = inject(HttpClient);

  list(query: Signal<RestaurantQuery>): AsyncResource<CountedPage<Restaurant>> {
    const result = injectQuery<CountedPage<Restaurant>, ApiError>(() => {
      const q = query();
      return {
        queryKey: ['restaurants', 'list', q],
        queryFn: () =>
          firstValueFrom(
            this.http
              .get<unknown>(
                buildUrl(environment.apiBaseUrl, '/restaurants/', toRestaurantParams(q)),
              )
              .pipe(map(mapCountedPage(toRestaurant))),
          ),
      };
    });
    return toAsyncResource(result);
  }

  byId(id: Signal<string | undefined>): AsyncResource<Restaurant> {
    const result = injectQuery<Restaurant, ApiError>(() => ({
      queryKey: ['restaurants', 'detail', id()],
      enabled: id() !== undefined,
      // `enabled` guarantees this only runs once `id()` is defined.
      queryFn: () =>
        firstValueFrom(
          this.http
            .get<RestaurantDto>(buildUrl(environment.apiBaseUrl, `/restaurants/${id()}/`))
            .pipe(map(toRestaurant)),
        ),
    }));
    return toAsyncResource(result);
  }

  mine(query: Signal<RestaurantQuery>): AsyncResource<CountedPage<Restaurant>> {
    const result = injectQuery<CountedPage<Restaurant>, ApiError>(() => {
      const q = query();
      return {
        queryKey: ['restaurants', 'mine', q],
        queryFn: () =>
          firstValueFrom(
            this.http
              .get<unknown>(
                buildUrl(environment.apiBaseUrl, '/restaurants/my/', toRestaurantParams(q)),
              )
              .pipe(map(mapCountedPage(toRestaurant))),
          ),
      };
    });
    return toAsyncResource(result);
  }

  create(): AsyncMutation<RestaurantWrite, Restaurant> {
    const mutation = injectMutation<Restaurant, ApiError, RestaurantWrite>(() => ({
      mutationFn: (body) =>
        firstValueFrom(
          this.http
            .post<RestaurantDto>(buildUrl(environment.apiBaseUrl, '/restaurants/'), body)
            .pipe(map(toRestaurant)),
        ),
    }));
    return toAsyncMutation(mutation);
  }

  update(): AsyncMutation<{ id: string; body: Partial<RestaurantWrite> }, Restaurant> {
    const mutation = injectMutation<
      Restaurant,
      ApiError,
      { id: string; body: Partial<RestaurantWrite> }
    >(() => ({
      mutationFn: ({ id, body }) =>
        firstValueFrom(
          this.http
            .patch<RestaurantDto>(buildUrl(environment.apiBaseUrl, `/restaurants/${id}/`), body)
            .pipe(map(toRestaurant)),
        ),
    }));
    return toAsyncMutation(mutation);
  }

  remove(): AsyncMutation<string, void> {
    const mutation = injectMutation<void, ApiError, string>(() => ({
      mutationFn: (id) =>
        firstValueFrom(
          this.http.delete<void>(buildUrl(environment.apiBaseUrl, `/restaurants/${id}/`)),
        ),
    }));
    return toAsyncMutation(mutation);
  }
}
