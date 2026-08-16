import { HttpClient } from '@angular/common/http';
import { Injectable, inject, Signal } from '@angular/core';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { MenuItemDataService, MenuItemQuery } from '@core/interfaces/menu-item-data.service';
import { ApiError } from '@core/models/api-error.model';
import { MenuItem, MenuItemDto, MenuItemWrite, toMenuItem } from '@core/models/menu-item.model';
import { CountedPage } from '@core/models/pagination.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { mapCountedPage } from '@core/utils/pagination-mapper';
import { toMenuItemParams } from '@core/utils/query-params';
import { environment } from '@environments/environment';
import { firstValueFrom, map } from 'rxjs';

import { toAsyncMutation, toAsyncResource } from './tanstack.adapter';

/** See `RestaurantHttpResourceService` for why `@Injectable()` with no `providedIn`. */
@Injectable()
export class MenuItemTanStackService implements MenuItemDataService {
  private readonly http = inject(HttpClient);

  list(query: Signal<MenuItemQuery>): AsyncResource<CountedPage<MenuItem>> {
    const result = injectQuery<CountedPage<MenuItem>, ApiError>(() => {
      const q = query();
      return {
        queryKey: ['menu-items', 'list', q],
        queryFn: () =>
          firstValueFrom(
            this.http
              .get<unknown>(buildUrl(environment.apiBaseUrl, '/menu-items/', toMenuItemParams(q)))
              .pipe(map(mapCountedPage(toMenuItem))),
          ),
      };
    });
    return toAsyncResource(result);
  }

  byId(id: Signal<string | undefined>): AsyncResource<MenuItem> {
    const result = injectQuery<MenuItem, ApiError>(() => ({
      queryKey: ['menu-items', 'detail', id()],
      enabled: id() !== undefined,
      queryFn: () =>
        firstValueFrom(
          this.http
            .get<MenuItemDto>(buildUrl(environment.apiBaseUrl, `/menu-items/${id()}/`))
            .pipe(map(toMenuItem)),
        ),
    }));
    return toAsyncResource(result);
  }

  create(): AsyncMutation<MenuItemWrite, MenuItem> {
    const mutation = injectMutation<MenuItem, ApiError, MenuItemWrite>(() => ({
      mutationFn: (body) =>
        firstValueFrom(
          this.http
            .post<MenuItemDto>(buildUrl(environment.apiBaseUrl, '/menu-items/'), body)
            .pipe(map(toMenuItem)),
        ),
    }));
    return toAsyncMutation(mutation);
  }

  update(): AsyncMutation<{ id: string; body: Partial<MenuItemWrite> }, MenuItem> {
    const mutation = injectMutation<
      MenuItem,
      ApiError,
      { id: string; body: Partial<MenuItemWrite> }
    >(() => ({
      mutationFn: ({ id, body }) =>
        firstValueFrom(
          this.http
            .patch<MenuItemDto>(buildUrl(environment.apiBaseUrl, `/menu-items/${id}/`), body)
            .pipe(map(toMenuItem)),
        ),
    }));
    return toAsyncMutation(mutation);
  }

  remove(): AsyncMutation<string, void> {
    const mutation = injectMutation<void, ApiError, string>(() => ({
      mutationFn: (id) =>
        firstValueFrom(
          this.http.delete<void>(buildUrl(environment.apiBaseUrl, `/menu-items/${id}/`)),
        ),
    }));
    return toAsyncMutation(mutation);
  }
}
