import { parseApiDate } from '@core/utils/date';

/** Raw shape as returned by the API. */
export interface CategoryDto {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly icon: string;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

/** App-facing shape: camelCased, timestamps parsed to `Date`. */
export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly icon: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    description: dto.description,
    icon: dto.icon,
    isActive: dto.is_active,
    createdAt: parseApiDate(dto.created_at),
    updatedAt: parseApiDate(dto.updated_at),
  };
}
