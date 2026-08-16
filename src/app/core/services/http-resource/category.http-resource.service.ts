import { httpResource } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';
import { CategoryDataService, CategoryQuery } from '@core/interfaces/category-data.service';
import { AsyncResource } from '@core/interfaces/async-resource';
import { Category, CategoryDto, toCategory } from '@core/models/category.model';
import { CountedPage } from '@core/models/pagination.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { mapCountedPage } from '@core/utils/pagination-mapper';
import { toCategoryParams } from '@core/utils/query-params';
import { environment } from '@environments/environment';

import { toAsyncResource } from './http-resource.adapter';

const EMPTY_PAGE: CountedPage<Category> = { count: 0, next: null, previous: null, results: [] };

/** See `RestaurantHttpResourceService` for why `@Injectable()` with no `providedIn`. */
@Injectable()
export class CategoryHttpResourceService implements CategoryDataService {
  list(query: Signal<CategoryQuery>): AsyncResource<CountedPage<Category>> {
    const resource = httpResource(
      () => buildUrl(environment.apiBaseUrl, '/categories/', toCategoryParams(query())),
      { defaultValue: EMPTY_PAGE, parse: mapCountedPage(toCategory) },
    );
    return toAsyncResource(resource);
  }

  byId(id: Signal<string | undefined>): AsyncResource<Category> {
    const resource = httpResource(
      () => (id() ? buildUrl(environment.apiBaseUrl, `/categories/${id()}/`) : undefined),
      { parse: (raw) => toCategory(raw as CategoryDto) },
    );
    return toAsyncResource(resource);
  }
}
