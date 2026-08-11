import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AccessTokenStore } from '@core/services/auth/access-token.store';
import { TokenRefreshCoordinator } from '@core/services/auth/token-refresh-coordinator';
import { NotificationService } from '@core/services/notification/notification.service';
import { mapApiError } from '@core/utils/error-mapper';
import { environment } from '@environments/environment';
import { catchError, switchMap, throwError } from 'rxjs';

/**
 * A 401 from any of these must never trigger a refresh attempt: a failed
 * login/register is a normal credential error (this API returns 401, not
 * 400, for bad credentials — see docs/API.md), and the refresh endpoint's
 * own 401 means the refresh token itself is invalid, so retrying it would
 * loop. In practice the refresh call bypasses this interceptor entirely
 * (see TokenRefreshCoordinator), but the check stays as defense in depth.
 */
const RETRY_EXCLUDED_PATHS = ['/auth/login/', '/auth/register/', '/auth/refresh/'];

function isExcludedFromRetry(url: string): boolean {
  return RETRY_EXCLUDED_PATHS.some((path) => url.includes(path));
}

/**
 * Global HTTP error handling: normalizes every failure into an `ApiError`
 * (see core/utils/error-mapper.ts), implements the 401-refresh-retry-once
 * pattern, and shows a toast for 429s. Only ever acts on responses from our
 * own API — third-party calls (e.g. the direct-to-Cloudinary upload) pass
 * through untouched.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notifications = inject(NotificationService);
  const tokenStore = inject(AccessTokenStore);
  const refreshCoordinator = inject(TokenRefreshCoordinator);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (!req.url.startsWith(environment.apiBaseUrl)) {
        return throwError(() => error);
      }

      if (error.status === 401 && !isExcludedFromRetry(req.url)) {
        return refreshCoordinator.refresh().pipe(
          switchMap((access) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${access}` } })),
          ),
          catchError(() => {
            tokenStore.set(null);
            void router.navigateByUrl('/login');
            return throwError(() => mapApiError(error.status, error.error));
          }),
        );
      }

      const mapped = mapApiError(error.status, error.error);

      if (mapped.type === 'throttled') {
        notifications.error(
          $localize`:@@error.throttled:Too many requests. Please try again in a moment.`,
        );
      }

      return throwError(() => mapped);
    }),
  );
};
