import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AccessTokenStore } from '@core/services/auth/access-token.store';
import { environment } from '@environments/environment';

/**
 * Attaches the in-memory access token and `withCredentials: true` to every
 * request targeting our own API. Scoped to `environment.apiBaseUrl`
 * deliberately: this must never apply to third-party requests (e.g. the
 * direct-to-Cloudinary upload in the owner dashboard) — that would leak the
 * bearer token to a third party and `withCredentials` on a cross-origin
 * request Cloudinary doesn't expect would likely just break the upload.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const token = inject(AccessTokenStore).value();

  const authorizedReq = req.clone({
    withCredentials: true,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return next(authorizedReq);
};
