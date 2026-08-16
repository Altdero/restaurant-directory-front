import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { RestaurantDataService, RestaurantQuery } from '@core/interfaces/restaurant-data.service';
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
import { map } from 'rxjs';

import { createMutation, toAsyncResource } from './http-resource.adapter';

const EMPTY_PAGE: CountedPage<Restaurant> = { count: 0, next: null, previous: null, results: [] };

/**
 * Provided explicitly via `RESTAURANT_DATA` in `provideHttpResourceDataLayer()`
 * rather than `@Service()`/`providedIn: 'root'` — components never inject
 * this class directly, only the token, so an implicit root registration
 * would be a redundant second provider path.
 */
@Injectable()
export class RestaurantHttpResourceService implements RestaurantDataService {
  private readonly http = inject(HttpClient);

  list(query: Signal<RestaurantQuery>): AsyncResource<CountedPage<Restaurant>> {
    const resource = httpResource(
      () => buildUrl(environment.apiBaseUrl, '/restaurants/', toRestaurantParams(query())),
      { defaultValue: EMPTY_PAGE, parse: mapCountedPage(toRestaurant) },
    );
    return toAsyncResource(resource);
  }

  byId(id: Signal<string | undefined>): AsyncResource<Restaurant> {
    const resource = httpResource(
      () => (id() ? buildUrl(environment.apiBaseUrl, `/restaurants/${id()}/`) : undefined),
      { parse: (raw) => toRestaurant(raw as RestaurantDto) },
    );
    return toAsyncResource(resource);
  }

  mine(query: Signal<RestaurantQuery>): AsyncResource<CountedPage<Restaurant>> {
    const resource = httpResource(
      () => buildUrl(environment.apiBaseUrl, '/restaurants/my/', toRestaurantParams(query())),
      { defaultValue: EMPTY_PAGE, parse: mapCountedPage(toRestaurant) },
    );
    return toAsyncResource(resource);
  }

  create(): AsyncMutation<RestaurantWrite, Restaurant> {
    return createMutation((body) =>
      this.http
        .post<RestaurantDto>(buildUrl(environment.apiBaseUrl, '/restaurants/'), body)
        .pipe(map(toRestaurant)),
    );
  }

  update(): AsyncMutation<{ id: string; body: Partial<RestaurantWrite> }, Restaurant> {
    return createMutation(({ id, body }) =>
      this.http
        .patch<RestaurantDto>(buildUrl(environment.apiBaseUrl, `/restaurants/${id}/`), body)
        .pipe(map(toRestaurant)),
    );
  }

  remove(): AsyncMutation<string, void> {
    return createMutation((id) =>
      this.http.delete<void>(buildUrl(environment.apiBaseUrl, `/restaurants/${id}/`)),
    );
  }
}
