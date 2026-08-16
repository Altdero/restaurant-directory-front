import { Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { CountedPage } from '@core/models/pagination.model';
import { PriceRange, Restaurant, RestaurantWrite } from '@core/models/restaurant.model';

export interface RestaurantQuery {
  readonly category?: string;
  readonly city?: string;
  readonly priceRange?: PriceRange;
  readonly minRating?: number;
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface RestaurantDataService {
  list(query: Signal<RestaurantQuery>): AsyncResource<CountedPage<Restaurant>>;
  byId(id: Signal<string | undefined>): AsyncResource<Restaurant>;
  /** `restaurants/my/` — restaurants owned by the caller. */
  mine(query: Signal<RestaurantQuery>): AsyncResource<CountedPage<Restaurant>>;
  create(): AsyncMutation<RestaurantWrite, Restaurant>;
  update(): AsyncMutation<{ id: string; body: Partial<RestaurantWrite> }, Restaurant>;
  remove(): AsyncMutation<string, void>;
}
