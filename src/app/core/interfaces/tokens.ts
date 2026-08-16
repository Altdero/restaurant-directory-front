import { InjectionToken } from '@angular/core';
import { CategoryDataService } from '@core/interfaces/category-data.service';
import { FavoriteDataService } from '@core/interfaces/favorite-data.service';
import { MenuItemDataService } from '@core/interfaces/menu-item-data.service';
import { RestaurantDataService } from '@core/interfaces/restaurant-data.service';
import { ReviewDataService } from '@core/interfaces/review-data.service';

export const RESTAURANT_DATA = new InjectionToken<RestaurantDataService>('RESTAURANT_DATA');
export const CATEGORY_DATA = new InjectionToken<CategoryDataService>('CATEGORY_DATA');
export const MENU_ITEM_DATA = new InjectionToken<MenuItemDataService>('MENU_ITEM_DATA');
export const REVIEW_DATA = new InjectionToken<ReviewDataService>('REVIEW_DATA');
export const FAVORITE_DATA = new InjectionToken<FavoriteDataService>('FAVORITE_DATA');
