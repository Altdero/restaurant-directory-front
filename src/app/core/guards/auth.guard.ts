import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '@core/services/auth/auth.store';
import { filter, map, take } from 'rxjs';

/**
 * Protects routes that require any authenticated user (`/favorites`,
 * `/profile`). Waits for `AuthStore.initialized` before deciding — without
 * this, a page reload would redirect to `/login` before the silent
 * `auth/refresh/` rehydration attempt (see `auth.store.ts`) has had a
 * chance to resolve.
 */
export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return toObservable(authStore.initialized).pipe(
    filter(Boolean),
    take(1),
    map(() =>
      authStore.isAuthenticated()
        ? true
        : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
    ),
  );
};
