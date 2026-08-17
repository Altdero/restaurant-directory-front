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

import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  let isAuthenticated: WritableSignal<boolean>;
  let router: Router;

  beforeEach(() => {
    isAuthenticated = signal(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { initialized: signal(true), isAuthenticated } },
      ],
    });
    router = TestBed.inject(Router);
  });

  function run(): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () =>
        guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<
          boolean | UrlTree
        >,
    );
  }

  it('allows an unauthenticated visitor through', async () => {
    isAuthenticated.set(false);

    expect(await firstValueFrom(run())).toBe(true);
  });

  it('redirects an already-authenticated user to /', async () => {
    isAuthenticated.set(true);

    const result = await firstValueFrom(run());
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
