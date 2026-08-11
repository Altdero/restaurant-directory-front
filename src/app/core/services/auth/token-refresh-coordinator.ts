import { HttpBackend, HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { buildUrl } from '@core/utils/api-url.builder';
import { environment } from '@environments/environment';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';

import { AccessTokenStore } from './access-token.store';

interface RefreshResponseDto {
  readonly access: string;
}

/**
 * Coordinates concurrent 401s so at most one `auth/refresh/` call is ever in
 * flight. Without this, several requests failing near-simultaneously (a
 * mainline case — a page firing a few parallel API calls right as the
 * access token expires) would each start their own refresh, and since the
 * backend rotates and blacklists the previous refresh token on every use,
 * all but the first would fail.
 *
 * Uses a raw `HttpClient` built directly on `HttpBackend` rather than the
 * injected `HttpClient`: going through the normal one would re-enter
 * `error.interceptor.ts`, which is what calls this in the first place.
 */
@Service()
export class TokenRefreshCoordinator {
  private readonly rawHttp = new HttpClient(inject(HttpBackend));
  private readonly tokenStore = inject(AccessTokenStore);
  private inFlight: Observable<string> | null = null;

  refresh(): Observable<string> {
    this.inFlight ??= this.rawHttp
      .post<RefreshResponseDto>(
        buildUrl(environment.apiBaseUrl, '/auth/refresh/'),
        {},
        { withCredentials: true },
      )
      .pipe(
        map((response) => response.access),
        tap((access) => this.tokenStore.set(access)),
        shareReplay(1),
        finalize(() => {
          this.inFlight = null;
        }),
      );

    return this.inFlight;
  }
}
