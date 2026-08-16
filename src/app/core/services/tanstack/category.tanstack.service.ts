import { HttpClient } from '@angular/common/http';
import { Injectable, inject, Signal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { AsyncResource } from '@core/interfaces/async-resource';
import { CategoryDataService, CategoryQuery } from '@core/interfaces/category-data.service';
import { ApiError } from '@core/models/api-error.model';
import { Category, CategoryDto, toCategory } from '@core/models/category.model';
import { CountedPage } from '@core/models/pagination.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { mapCountedPage } from '@core/utils/pagination-mapper';
import { toCategoryParams } from '@core/utils/query-params';
import { environment } from '@environments/environment';
import { firstValueFrom, map } from 'rxjs';

import { toAsyncResource } from './tanstack.adapter';

/** See `RestaurantHttpResourceService` for why `@Injectable()` with no `providedIn`. */
@Injectable()
export class CategoryTanStackService implements CategoryDataService {
  private readonly http = inject(HttpClient);

  list(query: Signal<CategoryQuery>): AsyncResource<CountedPage<Category>> {
    const result = injectQuery<CountedPage<Category>, ApiError>(() => {
      const q = query();
      return {
        queryKey: ['categories', 'list', q],
        queryFn: () =>
          firstValueFrom(
            this.http
              .get<unknown>(buildUrl(environment.apiBaseUrl, '/categories/', toCategoryParams(q)))
              .pipe(map(mapCountedPage(toCategory))),
          ),
      };
    });
    return toAsyncResource(result);
  }

  byId(id: Signal<string | undefined>): AsyncResource<Category> {
    const result = injectQuery<Category, ApiError>(() => ({
      queryKey: ['categories', 'detail', id()],
      enabled: id() !== undefined,
      queryFn: () =>
        firstValueFrom(
          this.http
            .get<CategoryDto>(buildUrl(environment.apiBaseUrl, `/categories/${id()}/`))
            .pipe(map(toCategory)),
        ),
    }));
    return toAsyncResource(result);
  }
}
