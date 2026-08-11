import { parseApiDate } from '@core/utils/date';

/** Raw shape as returned by the API. */
export interface ReviewDto {
  readonly id: string;
  readonly restaurant: string;
  readonly user: string;
  readonly username: string;
  readonly rating: number;
  readonly comment: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/** App-facing shape: camelCased, timestamps parsed to `Date`. */
export interface Review {
  readonly id: string;
  readonly restaurantId: string;
  readonly userId: string;
  readonly username: string;
  readonly rating: number;
  readonly comment: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** POST reviews/ body — one per user per restaurant, enforced server-side. */
export interface ReviewCreate {
  readonly restaurant: string;
  readonly rating: number;
  readonly comment: string;
}

/** PATCH reviews/{id}/ body — author-only, partial update, no PUT. */
export interface ReviewUpdate {
  readonly rating?: number;
  readonly comment?: string;
}

export function toReview(dto: ReviewDto): Review {
  return {
    id: dto.id,
    restaurantId: dto.restaurant,
    userId: dto.user,
    username: dto.username,
    rating: dto.rating,
    comment: dto.comment,
    createdAt: parseApiDate(dto.created_at),
    updatedAt: parseApiDate(dto.updated_at),
  };
}
