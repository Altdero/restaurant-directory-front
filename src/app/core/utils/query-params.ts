import { CategoryQuery } from '@core/interfaces/category-data.service';
import { FavoriteQuery } from '@core/interfaces/favorite-data.service';
import { MenuItemQuery } from '@core/interfaces/menu-item-data.service';
import { RestaurantQuery } from '@core/interfaces/restaurant-data.service';
import { ReviewQuery } from '@core/interfaces/review-data.service';
import { QueryParams } from '@core/utils/api-url.builder';

/**
 * Maps each resource's camelCased app-facing query to the API's snake_case
 * query params. Shared by both data-layer implementations (see
 * docs/ARCHITECTURE.md) since the wire format is identical regardless of
 * fetching mechanism.
 */
export function toRestaurantParams(query: RestaurantQuery): QueryParams {
  return {
    category: query.category,
    city: query.city,
    price_range: query.priceRange,
    min_rating: query.minRating,
    search: query.search,
    page: query.page,
    page_size: query.pageSize,
  };
}

export function toCategoryParams(query: CategoryQuery): QueryParams {
  return { page: query.page, page_size: query.pageSize };
}

export function toMenuItemParams(query: MenuItemQuery): QueryParams {
  return {
    restaurant_id: query.restaurantId,
    category: query.category,
    is_available: query.isAvailable,
    limit: query.limit,
    offset: query.offset,
  };
}

export function toReviewParams(query: ReviewQuery): QueryParams {
  return { restaurant_id: query.restaurantId };
}

export function toFavoriteParams(query: FavoriteQuery): QueryParams {
  return { page: query.page, page_size: query.pageSize };
}
