import { Signal } from '@angular/core';
import { AsyncResource } from '@core/interfaces/async-resource';
import { Category } from '@core/models/category.model';
import { CountedPage } from '@core/models/pagination.model';

export interface CategoryQuery {
  readonly page?: number;
  readonly pageSize?: number;
}

/** Read-only: category admin CRUD is out of scope for this app's UI. */
export interface CategoryDataService {
  list(query: Signal<CategoryQuery>): AsyncResource<CountedPage<Category>>;
  byId(id: Signal<string | undefined>): AsyncResource<Category>;
}
