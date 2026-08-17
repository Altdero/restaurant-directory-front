import { UserProfile, UserProfileDto, toUserProfile } from './user-profile.model';

/** POST auth/register/ body. */
export interface RegisterRequest {
  readonly username: string;
  readonly email: string;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly password: string;
  readonly password_confirm: string;
}

/** POST auth/login/ body. */
export interface LoginRequest {
  readonly username: string;
  readonly password: string;
}

/** Raw shape as returned by POST auth/register/. */
export interface RegisterResponseDto {
  readonly user: UserProfileDto;
  readonly access: string;
}

/** App-facing shape for a successful registration. */
export interface RegisterResult {
  readonly user: UserProfile;
  readonly access: string;
}

/** Raw shape as returned by POST auth/login/ — no user profile, `users/me/` must be fetched separately. */
export interface LoginResponseDto {
  readonly access: string;
}

export function toRegisterResult(dto: RegisterResponseDto): RegisterResult {
  return { user: toUserProfile(dto.user), access: dto.access };
}
