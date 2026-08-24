import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import {
  LoginRequest,
  LoginResponseDto,
  RegisterRequest,
  RegisterResponseDto,
  RegisterResult,
  toRegisterResult,
} from '@core/models/auth.model';
import {
  UserProfile,
  UserProfileDto,
  UserProfileUpdate,
  toUserProfile,
} from '@core/models/user-profile.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { environment } from '@environments/environment';
import { Observable, map } from 'rxjs';

/**
 * Thin `HttpClient` wrapper for the auth/user endpoints, deliberately
 * excluding `auth/refresh/` — that call stays exclusively
 * `TokenRefreshCoordinator`'s responsibility (single source of truth,
 * dedupes concurrent 401s), so `AuthStore` composes both rather than this
 * service duplicating refresh logic.
 */
@Service()
export class AuthApi {
  private readonly http = inject(HttpClient);

  register(body: RegisterRequest): Observable<RegisterResult> {
    return this.http
      .post<RegisterResponseDto>(buildUrl(environment.apiBaseUrl, '/auth/register/'), body)
      .pipe(map(toRegisterResult));
  }

  login(body: LoginRequest): Observable<string> {
    return this.http
      .post<LoginResponseDto>(buildUrl(environment.apiBaseUrl, '/auth/login/'), body)
      .pipe(map((response) => response.access));
  }

  logout(): Observable<void> {
    return this.http.post<void>(buildUrl(environment.apiBaseUrl, '/auth/logout/'), {});
  }

  me(): Observable<UserProfile> {
    return this.http
      .get<UserProfileDto>(buildUrl(environment.apiBaseUrl, '/users/me/'))
      .pipe(map(toUserProfile));
  }

  updateMe(body: UserProfileUpdate): Observable<UserProfile> {
    return this.http
      .patch<UserProfileDto>(buildUrl(environment.apiBaseUrl, '/users/me/'), body)
      .pipe(map(toUserProfile));
  }
}
