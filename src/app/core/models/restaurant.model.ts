import { parseDecimal } from '@core/utils/decimal';
import { parseApiDate } from '@core/utils/date';

import { Category, CategoryDto, toCategory } from './category.model';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';
export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type OpeningHours = Partial<
  Record<WeekDay, { readonly open: string; readonly close: string }>
>;

/** Raw shape as returned by the API. */
export interface RestaurantDto {
  readonly id: string;
  readonly owner: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly categories: readonly CategoryDto[];
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly postal_code: string;
  readonly latitude: string | null;
  readonly longitude: string | null;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly price_range: PriceRange;
  readonly cover_image: string;
  readonly average_rating: string;
  readonly total_reviews: number;
  readonly opening_hours: OpeningHours;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * App-facing shape: camelCased, decimal strings parsed to `number`,
 * timestamps parsed to `Date`, nested `categories` fully resolved (the API
 * returns full Category objects here, not a trimmed summary).
 */
export interface Restaurant {
  readonly id: string;
  readonly owner: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly categories: readonly Category[];
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly postalCode: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly priceRange: PriceRange;
  readonly coverImage: string;
  readonly averageRating: number;
  readonly totalReviews: number;
  readonly openingHours: OpeningHours;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * POST/PUT/PATCH restaurants/ body. `category_ids` replaces the read-only
 * nested `categories`; `average_rating`/`total_reviews`/`slug`/`owner` are
 * server-computed or server-assigned and never sent.
 */
export interface RestaurantWrite {
  readonly name: string;
  readonly description: string;
  readonly category_ids: readonly string[];
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly postal_code: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly price_range: PriceRange;
  readonly cover_image: string;
  readonly opening_hours: OpeningHours;
  readonly is_active: boolean;
}

export function toRestaurant(dto: RestaurantDto): Restaurant {
  return {
    id: dto.id,
    owner: dto.owner,
    name: dto.name,
    slug: dto.slug,
    description: dto.description,
    categories: dto.categories.map(toCategory),
    address: dto.address,
    city: dto.city,
    state: dto.state,
    country: dto.country,
    postalCode: dto.postal_code,
    latitude: dto.latitude === null ? null : parseDecimal(dto.latitude),
    longitude: dto.longitude === null ? null : parseDecimal(dto.longitude),
    phone: dto.phone,
    email: dto.email,
    website: dto.website,
    priceRange: dto.price_range,
    coverImage: dto.cover_image,
    averageRating: parseDecimal(dto.average_rating),
    totalReviews: dto.total_reviews,
    openingHours: dto.opening_hours,
    isActive: dto.is_active,
    createdAt: parseApiDate(dto.created_at),
    updatedAt: parseApiDate(dto.updated_at),
  };
}
