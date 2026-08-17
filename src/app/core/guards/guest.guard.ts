import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@core/services/auth/auth.store';
import { filter, map, take } from 'rxjs';

/** Keeps already-authenticated users off `/login` and `/register`. */
export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return toObservable(authStore.initialized).pipe(
    filter(Boolean),
    take(1),
    map(() => (authStore.isAuthenticated() ? router.createUrlTree(['/']) : true)),
  );
};
