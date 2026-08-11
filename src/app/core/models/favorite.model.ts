import { parseApiDate } from '@core/utils/date';

import { Restaurant, RestaurantDto, toRestaurant } from './restaurant.model';

/** Raw shape as returned by the API. */
export interface FavoriteDto {
  readonly id: string;
  readonly restaurant: RestaurantDto;
  readonly created_at: string;
}

/** App-facing shape: camelCased, nested restaurant fully parsed. */
export interface Favorite {
  readonly id: string;
  readonly restaurant: Restaurant;
  readonly createdAt: Date;
}

/** POST favorites/ body. Prefer `favorites/toggle/` for a heart-icon toggle. */
export interface FavoriteCreate {
  readonly restaurant_id: string;
}

export function toFavorite(dto: FavoriteDto): Favorite {
  return {
    id: dto.id,
    restaurant: toRestaurant(dto.restaurant),
    createdAt: parseApiDate(dto.created_at),
  };
}
