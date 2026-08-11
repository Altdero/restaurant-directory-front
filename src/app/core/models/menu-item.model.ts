import { parseDecimal } from '@core/utils/decimal';
import { parseApiDate } from '@core/utils/date';

export type MenuItemCategory = 'appetizer' | 'main_course' | 'dessert' | 'beverage' | 'other';

/** Raw shape as returned by the API. */
export interface MenuItemDto {
  readonly id: string;
  readonly restaurant: string;
  readonly restaurant_name: string;
  readonly name: string;
  readonly description: string;
  readonly price: string;
  readonly category: MenuItemCategory;
  readonly image: string;
  readonly is_available: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

/** App-facing shape: camelCased, `price` parsed to `number`. */
export interface MenuItem {
  readonly id: string;
  readonly restaurantId: string;
  readonly restaurantName: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: MenuItemCategory;
  readonly image: string;
  readonly isAvailable: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** POST/PUT/PATCH menu-items/ body. `restaurant_name` is read-only-derived. */
export interface MenuItemWrite {
  readonly restaurant: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: MenuItemCategory;
  readonly image: string;
  readonly is_available: boolean;
}

export function toMenuItem(dto: MenuItemDto): MenuItem {
  return {
    id: dto.id,
    restaurantId: dto.restaurant,
    restaurantName: dto.restaurant_name,
    name: dto.name,
    description: dto.description,
    price: parseDecimal(dto.price),
    category: dto.category,
    image: dto.image,
    isAvailable: dto.is_available,
    createdAt: parseApiDate(dto.created_at),
    updatedAt: parseApiDate(dto.updated_at),
  };
}
