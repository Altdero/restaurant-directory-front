import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { MenuItemDataService, MenuItemQuery } from '@core/interfaces/menu-item-data.service';
import { MenuItem, MenuItemDto, MenuItemWrite, toMenuItem } from '@core/models/menu-item.model';
import { CountedPage } from '@core/models/pagination.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { mapCountedPage } from '@core/utils/pagination-mapper';
import { toMenuItemParams } from '@core/utils/query-params';
import { environment } from '@environments/environment';
import { map } from 'rxjs';

import { createMutation, toAsyncResource } from './http-resource.adapter';

const EMPTY_PAGE: CountedPage<MenuItem> = { count: 0, next: null, previous: null, results: [] };

/** See `RestaurantHttpResourceService` for why `@Injectable()` with no `providedIn`. */
@Injectable()
export class MenuItemHttpResourceService implements MenuItemDataService {
  private readonly http = inject(HttpClient);

  list(query: Signal<MenuItemQuery>): AsyncResource<CountedPage<MenuItem>> {
    const resource = httpResource(
      () => buildUrl(environment.apiBaseUrl, '/menu-items/', toMenuItemParams(query())),
      { defaultValue: EMPTY_PAGE, parse: mapCountedPage(toMenuItem) },
    );
    return toAsyncResource(resource);
  }

  byId(id: Signal<string | undefined>): AsyncResource<MenuItem> {
    const resource = httpResource(
      () => (id() ? buildUrl(environment.apiBaseUrl, `/menu-items/${id()}/`) : undefined),
      { parse: (raw) => toMenuItem(raw as MenuItemDto) },
    );
    return toAsyncResource(resource);
  }

  create(): AsyncMutation<MenuItemWrite, MenuItem> {
    return createMutation((body) =>
      this.http
        .post<MenuItemDto>(buildUrl(environment.apiBaseUrl, '/menu-items/'), body)
        .pipe(map(toMenuItem)),
    );
  }

  update(): AsyncMutation<{ id: string; body: Partial<MenuItemWrite> }, MenuItem> {
    return createMutation(({ id, body }) =>
      this.http
        .patch<MenuItemDto>(buildUrl(environment.apiBaseUrl, `/menu-items/${id}/`), body)
        .pipe(map(toMenuItem)),
    );
  }

  remove(): AsyncMutation<string, void> {
    return createMutation((id) =>
      this.http.delete<void>(buildUrl(environment.apiBaseUrl, `/menu-items/${id}/`)),
    );
  }
}
