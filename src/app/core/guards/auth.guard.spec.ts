import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthStore } from '@core/services/auth/auth.store';
import { Observable, firstValueFrom } from 'rxjs';

import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let initialized: WritableSignal<boolean>;
  let isAuthenticated: WritableSignal<boolean>;
  let router: Router;

  beforeEach(() => {
    initialized = signal(false);
    isAuthenticated = signal(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { initialized, isAuthenticated } },
      ],
    });
    router = TestBed.inject(Router);
  });

  function run(url: string): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () =>
        authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot) as Observable<
          boolean | UrlTree
        >,
    );
  }

  it('waits for AuthStore.initialized before deciding', async () => {
    const result$ = run('/favorites');
    const resultPromise = firstValueFrom(result$);

    initialized.set(true);
    isAuthenticated.set(true);

    expect(await resultPromise).toBe(true);
  });

  it('allows an authenticated user through', async () => {
    initialized.set(true);
    isAuthenticated.set(true);

    expect(await firstValueFrom(run('/favorites'))).toBe(true);
  });

  it('redirects an unauthenticated user to /login with a returnUrl', async () => {
    initialized.set(true);
    isAuthenticated.set(false);

    const result = await firstValueFrom(run('/favorites'));
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Ffavorites');
  });
});
