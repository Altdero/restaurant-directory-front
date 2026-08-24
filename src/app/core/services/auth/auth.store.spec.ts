import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@environments/environment';

import { AccessTokenStore } from './access-token.store';
import { AuthStore } from './auth.store';

const USER_DTO = {
  id: 'u-1',
  username: 'ana',
  email: 'ana@example.com',
  first_name: 'Ana',
  last_name: 'Ruiz',
  role: 'customer' as const,
  phone: '',
  avatar: '',
  date_joined: '2026-08-07T21:30:32.680664-06:00',
};

describe('AuthStore', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Every test constructs `AuthStore`, which immediately fires the silent rehydration attempt. */
  function flushRehydration(outcome: 'valid-session' | 'no-session'): AuthStore {
    const store = TestBed.inject(AuthStore);
    TestBed.tick();

    const refreshReq = httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh/`);
    if (outcome === 'no-session') {
      refreshReq.flush({ detail: 'no cookie' }, { status: 401, statusText: 'Unauthorized' });
      return store;
    }

    refreshReq.flush({ access: 'rehydrated-token' });
    httpMock.expectOne(`${environment.apiBaseUrl}/users/me/`).flush(USER_DTO);
    return store;
  }

  it('rehydrates the session and marks initialized when the refresh cookie is valid', () => {
    const store = flushRehydration('valid-session');
    TestBed.tick();

    expect(store.initialized()).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()).toEqual(expect.objectContaining({ username: 'ana' }));
  });

  it('marks initialized with no user when there is no valid refresh cookie', () => {
    const store = flushRehydration('no-session');
    TestBed.tick();

    expect(store.initialized()).toBe(true);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
  });

  it('isOwner reflects the rehydrated user role', () => {
    const store = TestBed.inject(AuthStore);
    TestBed.tick();
    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/refresh/`)
      .flush({ access: 'rehydrated-token' });
    httpMock.expectOne(`${environment.apiBaseUrl}/users/me/`).flush({ ...USER_DTO, role: 'owner' });
    TestBed.tick();

    expect(store.isOwner()).toBe(true);
  });

  it('clears the user when the access token is cleared externally (interceptor forced logout)', () => {
    const store = flushRehydration('valid-session');
    TestBed.tick();
    expect(store.user()).not.toBeNull();

    TestBed.inject(AccessTokenStore).set(null);
    TestBed.tick();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('login sets the token and fetches the profile', async () => {
    const store = flushRehydration('no-session');
    TestBed.tick();

    const loginPromise = store.login({ username: 'ana', password: 'secret' });
    httpMock.expectOne(`${environment.apiBaseUrl}/auth/login/`).flush({ access: 'login-token' });
    // `login()` chains two `await firstValueFrom(...)` calls — unlike the
    // constructor's plain RxJS `.subscribe()` chain, each `await` is a real
    // microtask boundary, so the `users/me/` request isn't issued until the
    // event loop yields once here.
    await Promise.resolve();
    httpMock.expectOne(`${environment.apiBaseUrl}/users/me/`).flush(USER_DTO);
    await loginPromise;

    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()).toEqual(expect.objectContaining({ username: 'ana' }));
  });

  it('register sets the token and user directly from the response', async () => {
    const store = flushRehydration('no-session');

    const registerPromise = store.register({
      username: 'ana',
      email: 'ana@example.com',
      password: 'secret',
      password_confirm: 'secret',
    });
    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/register/`)
      .flush({ user: USER_DTO, access: 'register-token' });
    await registerPromise;

    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()).toEqual(expect.objectContaining({ username: 'ana' }));
  });

  it('updateProfile patches the API and replaces the user with the response', async () => {
    const store = flushRehydration('valid-session');
    TestBed.tick();

    const updatePromise = store.updateProfile({ first_name: 'Nueva' });
    httpMock
      .expectOne(`${environment.apiBaseUrl}/users/me/`)
      .flush({ ...USER_DTO, first_name: 'Nueva' });
    await updatePromise;

    expect(store.user()).toEqual(expect.objectContaining({ firstName: 'Nueva' }));
  });

  it('logout clears local state even if the API call fails', async () => {
    const store = flushRehydration('valid-session');
    TestBed.tick();

    const logoutPromise = store.logout();
    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/logout/`)
      .flush({ detail: 'error' }, { status: 500, statusText: 'Server Error' });
    await logoutPromise;

    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
  });
});
