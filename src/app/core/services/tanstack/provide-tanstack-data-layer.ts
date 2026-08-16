import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import {
  CATEGORY_DATA,
  FAVORITE_DATA,
  MENU_ITEM_DATA,
  RESTAURANT_DATA,
  REVIEW_DATA,
} from '@core/interfaces/tokens';

import { CategoryTanStackService } from './category.tanstack.service';
import { FavoriteTanStackService } from './favorite.tanstack.service';
import { MenuItemTanStackService } from './menu-item.tanstack.service';
import { RestaurantTanStackService } from './restaurant.tanstack.service';
import { ReviewTanStackService } from './review.tanstack.service';

/**
 * Binds all five data-layer tokens to the TanStack Query family.
 *
 * `retry: false` on both queries and mutations: TanStack's default (3
 * retries with exponential backoff) would silently re-run requests whose
 * failures this app already treats as final — a 400 field-validation error
 * or a 404 aren't transient, and the one genuinely retryable case (an
 * expired access token) is already handled once, synchronously, by
 * `error.interceptor.ts`'s refresh-and-retry — before TanStack ever sees a
 * failure. A second, independent retry layer on top of that would only add
 * unpredictable delay with no corresponding benefit.
 */
export function provideTanStackDataLayer(): EnvironmentProviders {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return makeEnvironmentProviders([
    provideTanStackQuery(queryClient),
    { provide: RESTAURANT_DATA, useClass: RestaurantTanStackService },
    { provide: CATEGORY_DATA, useClass: CategoryTanStackService },
    { provide: MENU_ITEM_DATA, useClass: MenuItemTanStackService },
    { provide: REVIEW_DATA, useClass: ReviewTanStackService },
    { provide: FAVORITE_DATA, useClass: FavoriteTanStackService },
  ]);
}
