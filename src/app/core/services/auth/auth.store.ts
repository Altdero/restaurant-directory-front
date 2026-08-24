import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Service, computed, effect, inject, signal } from '@angular/core';
import { LoginRequest, RegisterRequest } from '@core/models/auth.model';
import { UserProfile, UserProfileUpdate } from '@core/models/user-profile.model';
import { catchError, finalize, firstValueFrom, of, switchMap, tap } from 'rxjs';

import { AuthApi } from './auth.api';
import { AccessTokenStore } from './access-token.store';
import { TokenRefreshCoordinator } from './token-refresh-coordinator';

/**
 * Composes `AccessTokenStore` (existing, memory-only token holder) with the
 * user profile and login/register/logout orchestration. Kept separate from
 * `AccessTokenStore` deliberately — see that file's doc comment — the
 * interceptors only ever need the token, not this.
 *
 * On the browser, attempts one silent `auth/refresh/` on construction (via
 * the existing `TokenRefreshCoordinator`, reused rather than duplicated) to
 * restore a session from the httpOnly refresh cookie across a page reload —
 * the access token itself never survives a reload, being memory-only. On
 * the server there is no browser cookie jar to rehydrate from (protected
 * routes render client-side only, per PLAN.md's route table), so
 * `initialized` is set immediately instead. Guards must wait for
 * `initialized` before redirecting, or a reload would flash a spurious
 * redirect to `/login` before rehydration has had a chance to resolve.
 *
 * A standing `effect()` clears `user` whenever the access token goes back to
 * `null` — this is what makes `error.interceptor.ts`'s forced-logout on a
 * failed refresh (`tokenStore.set(null)`) also clear the profile, with no
 * direct coupling between the interceptor and this store.
 */
@Service()
export class AuthStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly accessTokenStore = inject(AccessTokenStore);
  private readonly refreshCoordinator = inject(TokenRefreshCoordinator);
  private readonly authApi = inject(AuthApi);

  private readonly userSignal = signal<UserProfile | null>(null);
  private readonly initializedSignal = signal(false);

  readonly user = this.userSignal.asReadonly();
  readonly initialized = this.initializedSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenStore.value() !== null);
  readonly isOwner = computed(() => ['owner', 'admin'].includes(this.userSignal()?.role ?? ''));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshCoordinator
        .refresh()
        .pipe(
          switchMap(() => this.authApi.me()),
          tap((user) => this.userSignal.set(user)),
          catchError(() => of(null)),
          finalize(() => this.initializedSignal.set(true)),
        )
        .subscribe();
    } else {
      this.initializedSignal.set(true);
    }

    effect(() => {
      if (this.accessTokenStore.value() === null) {
        this.userSignal.set(null);
      }
    });
  }

  async login(credentials: LoginRequest): Promise<void> {
    const access = await firstValueFrom(this.authApi.login(credentials));
    this.accessTokenStore.set(access);
    const user = await firstValueFrom(this.authApi.me());
    this.userSignal.set(user);
  }

  async register(payload: RegisterRequest): Promise<void> {
    const result = await firstValueFrom(this.authApi.register(payload));
    this.accessTokenStore.set(result.access);
    this.userSignal.set(result.user);
  }

  async updateProfile(body: UserProfileUpdate): Promise<void> {
    const user = await firstValueFrom(this.authApi.updateMe(body));
    this.userSignal.set(user);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.authApi.logout());
    } catch {
      // Best-effort — local state is cleared below regardless of outcome.
    } finally {
      this.accessTokenStore.set(null);
      this.userSignal.set(null);
    }
  }
}
