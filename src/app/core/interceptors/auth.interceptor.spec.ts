import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccessTokenStore } from '@core/services/auth/access-token.store';
import { environment } from '@environments/environment';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStore: AccessTokenStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStore = TestBed.inject(AccessTokenStore);
  });

  afterEach(() => httpMock.verify());

  it('sets withCredentials and omits Authorization when there is no token', () => {
    http.get(`${environment.apiBaseUrl}/restaurants/`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/restaurants/`);
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('attaches Authorization: Bearer <token> when a token is set', () => {
    tokenStore.set('abc123');

    http.get(`${environment.apiBaseUrl}/restaurants/`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/restaurants/`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('leaves third-party requests untouched, never leaking the token', () => {
    tokenStore.set('abc123');

    http.post('https://api.cloudinary.com/v1_1/demo/image/upload', {}).subscribe();

    const req = httpMock.expectOne('https://api.cloudinary.com/v1_1/demo/image/upload');
    expect(req.request.withCredentials).toBe(false);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
