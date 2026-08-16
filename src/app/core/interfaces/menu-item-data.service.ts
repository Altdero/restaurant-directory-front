import { Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { MenuItem, MenuItemCategory, MenuItemWrite } from '@core/models/menu-item.model';
import { CountedPage } from '@core/models/pagination.model';

export interface MenuItemQuery {
  readonly restaurantId?: string;
  readonly category?: MenuItemCategory;
  readonly isAvailable?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

export interface MenuItemDataService {
  list(query: Signal<MenuItemQuery>): AsyncResource<CountedPage<MenuItem>>;
  byId(id: Signal<string | undefined>): AsyncResource<MenuItem>;
  create(): AsyncMutation<MenuItemWrite, MenuItem>;
  update(): AsyncMutation<{ id: string; body: Partial<MenuItemWrite> }, MenuItem>;
  remove(): AsyncMutation<string, void>;
}
