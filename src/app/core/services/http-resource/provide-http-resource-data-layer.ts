import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  CATEGORY_DATA,
  FAVORITE_DATA,
  MENU_ITEM_DATA,
  RESTAURANT_DATA,
  REVIEW_DATA,
} from '@core/interfaces/tokens';

import { CategoryHttpResourceService } from './category.http-resource.service';
import { FavoriteHttpResourceService } from './favorite.http-resource.service';
import { MenuItemHttpResourceService } from './menu-item.http-resource.service';
import { RestaurantHttpResourceService } from './restaurant.http-resource.service';
import { ReviewHttpResourceService } from './review.http-resource.service';

/** Binds all five data-layer tokens to the `httpResource()` family. */
export function provideHttpResourceDataLayer(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: RESTAURANT_DATA, useClass: RestaurantHttpResourceService },
    { provide: CATEGORY_DATA, useClass: CategoryHttpResourceService },
    { provide: MENU_ITEM_DATA, useClass: MenuItemHttpResourceService },
    { provide: REVIEW_DATA, useClass: ReviewHttpResourceService },
    { provide: FAVORITE_DATA, useClass: FavoriteHttpResourceService },
  ]);
}
