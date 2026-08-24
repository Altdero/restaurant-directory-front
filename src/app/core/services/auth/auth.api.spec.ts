import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@environments/environment';

import { AuthApi } from './auth.api';

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

describe('AuthApi', () => {
  let api: AuthApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AuthApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('registers and maps the nested user DTO to a UserProfile', () => {
    let result: { user: { username: string }; access: string } | undefined;
    api
      .register({
        username: 'ana',
        email: 'ana@example.com',
        password: 'x',
        password_confirm: 'x',
      })
      .subscribe((response) => (result = response));

    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/register/`)
      .flush({ user: USER_DTO, access: 'token-1' });

    expect(result).toEqual({
      user: expect.objectContaining({ username: 'ana' }),
      access: 'token-1',
    });
  });

  it('logs in and returns just the access token', () => {
    let result: string | undefined;
    api.login({ username: 'ana', password: 'x' }).subscribe((access) => (result = access));

    httpMock.expectOne(`${environment.apiBaseUrl}/auth/login/`).flush({ access: 'token-2' });

    expect(result).toBe('token-2');
  });

  it('fetches and maps the current user profile', () => {
    let result: { role: string } | undefined;
    api.me().subscribe((user) => (result = user));

    httpMock.expectOne(`${environment.apiBaseUrl}/users/me/`).flush(USER_DTO);

    expect(result).toEqual(expect.objectContaining({ role: 'customer' }));
  });

  it('patches users/me/ and maps the response to a UserProfile', () => {
    let result: { email: string } | undefined;
    api.updateMe({ email: 'new@example.com' }).subscribe((user) => (result = user));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/me/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ email: 'new@example.com' });
    req.flush({ ...USER_DTO, email: 'new@example.com' });

    expect(result).toEqual(expect.objectContaining({ email: 'new@example.com' }));
  });

  it('posts to auth/logout/', () => {
    api.logout().subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/logout/`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
