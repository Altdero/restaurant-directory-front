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

import { ownerGuard } from './owner.guard';

describe('ownerGuard', () => {
  let isAuthenticated: WritableSignal<boolean>;
  let isOwner: WritableSignal<boolean>;
  let router: Router;

  beforeEach(() => {
    isAuthenticated = signal(false);
    isOwner = signal(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { initialized: signal(true), isAuthenticated, isOwner },
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  function run(): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () =>
        ownerGuard(
          {} as ActivatedRouteSnapshot,
          { url: '/my/restaurants' } as RouterStateSnapshot,
        ) as Observable<boolean | UrlTree>,
    );
  }

  it('allows an authenticated owner through', async () => {
    isAuthenticated.set(true);
    isOwner.set(true);

    expect(await firstValueFrom(run())).toBe(true);
  });

  it('redirects an unauthenticated user to /login with a returnUrl', async () => {
    isAuthenticated.set(false);

    const result = await firstValueFrom(run());
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fmy%2Frestaurants');
  });

  it('redirects an authenticated non-owner to /', async () => {
    isAuthenticated.set(true);
    isOwner.set(false);

    const result = await firstValueFrom(run());
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
