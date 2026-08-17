import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '@core/services/auth/auth.store';
import { filter, map, take } from 'rxjs';

/**
 * Protects the owner dashboard (`/my/**`). Unauthenticated users are sent to
 * `/login` with a `returnUrl`; authenticated non-owners are sent to `/` —
 * `role` is UX convenience only (see AGENTS.md), the backend enforces the
 * same restriction independently, so this guard exists to avoid rendering a
 * dashboard shell the API would reject, not as the actual security boundary.
 */
export const ownerGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return toObservable(authStore.initialized).pipe(
    filter(Boolean),
    take(1),
    map(() => {
      if (!authStore.isAuthenticated()) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }
      return authStore.isOwner() ? true : router.createUrlTree(['/']);
    }),
  );
};
