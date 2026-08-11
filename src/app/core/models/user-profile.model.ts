import { parseApiDate } from '@core/utils/date';

export type UserRole = 'customer' | 'owner' | 'admin';

/** Raw shape as returned by the API. */
export interface UserProfileDto {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly role: UserRole;
  readonly phone: string;
  readonly avatar: string;
  readonly date_joined: string;
}

/** App-facing shape: camelCased, `date_joined` parsed to `Date`. */
export interface UserProfile {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly phone: string;
  readonly avatar: string;
  readonly dateJoined: Date;
}

/**
 * PATCH users/me/ body. `username`, `role` and `date_joined` are read-only on
 * this endpoint — deliberately excluded here rather than typed optional.
 */
export interface UserProfileUpdate {
  readonly email?: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly phone?: string;
  readonly avatar?: string;
}

export function toUserProfile(dto: UserProfileDto): UserProfile {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    role: dto.role,
    phone: dto.phone,
    avatar: dto.avatar,
    dateJoined: parseApiDate(dto.date_joined),
  };
}
