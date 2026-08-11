import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AccessTokenStore } from '@core/services/auth/access-token.store';
import { NotificationService } from '@core/services/notification/notification.service';
import { ApiError } from '@core/models/api-error.model';
import { environment } from '@environments/environment';

import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStore: AccessTokenStore;
  let router: Router;
  let notificationError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    notificationError = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotificationService, useValue: { error: notificationError } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStore = TestBed.inject(AccessTokenStore);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  it('maps a field validation error (400) and rethrows it as an ApiError', () => {
    let captured: ApiError | undefined;

    http.post(`${environment.apiBaseUrl}/restaurants/`, {}).subscribe({
      error: (error: ApiError) => (captured = error),
    });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/restaurants/`)
      .flush({ name: ['This field is required.'] }, { status: 400, statusText: 'Bad Request' });

    expect(captured).toEqual({ type: 'field', errors: { name: ['This field is required.'] } });
  });

  it('does not retry a 401 from the login endpoint', () => {
    let captured: ApiError | undefined;

    http.post(`${environment.apiBaseUrl}/auth/login/`, {}).subscribe({
      error: (error: ApiError) => (captured = error),
    });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/login/`)
      .flush(
        { detail: 'No active account found with the given credentials' },
        { status: 401, statusText: 'Unauthorized' },
      );

    httpMock.verify();
    expect(captured).toEqual({
      type: 'detail',
      status: 401,
      message: 'No active account found with the given credentials',
      code: undefined,
    });
  });

  it('refreshes the token on a 401 and retries the original request', () => {
    let result: unknown;

    http.get(`${environment.apiBaseUrl}/favorites/`).subscribe({
      next: (value) => (result = value),
    });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/favorites/`)
      .flush(
        { detail: 'Token is invalid or expired', code: 'token_not_valid' },
        { status: 401, statusText: 'Unauthorized' },
      );

    httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh/`).flush({ access: 'new-token' });

    const retried = httpMock.expectOne(`${environment.apiBaseUrl}/favorites/`);
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-token');
    retried.flush({ results: [] });

    expect(result).toEqual({ results: [] });
    expect(tokenStore.value()).toBe('new-token');
  });

  it('clears the token and redirects to login when refresh itself fails', () => {
    let captured: ApiError | undefined;

    http.get(`${environment.apiBaseUrl}/favorites/`).subscribe({
      error: (error: ApiError) => (captured = error),
    });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/favorites/`)
      .flush(
        { detail: 'Token is invalid or expired' },
        { status: 401, statusText: 'Unauthorized' },
      );

    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/refresh/`)
      .flush({ detail: 'Refresh token is invalid' }, { status: 401, statusText: 'Unauthorized' });

    expect(tokenStore.value()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(captured).toMatchObject({ type: 'detail', status: 401 });
  });

  it('shows a toast on a throttled (429) response and still rethrows the error', () => {
    let captured: ApiError | undefined;

    http.get(`${environment.apiBaseUrl}/restaurants/`).subscribe({
      error: (error: ApiError) => (captured = error),
    });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/restaurants/`)
      .flush(
        { detail: 'Request was throttled. Expected available in 30 seconds.' },
        { status: 429, statusText: 'Too Many Requests' },
      );

    expect(notificationError).toHaveBeenCalledTimes(1);
    expect(captured).toEqual({
      type: 'throttled',
      message: 'Request was throttled. Expected available in 30 seconds.',
      retryAfterSeconds: 30,
    });
  });

  it('leaves third-party errors (e.g. Cloudinary) as a raw HttpErrorResponse, unmapped', () => {
    let captured: unknown;

    http.post('https://api.cloudinary.com/v1_1/demo/image/upload', {}).subscribe({
      error: (error: unknown) => (captured = error),
    });

    httpMock
      .expectOne('https://api.cloudinary.com/v1_1/demo/image/upload')
      .flush(
        { error: { message: 'Invalid signature' } },
        { status: 401, statusText: 'Unauthorized' },
      );

    httpMock.verify();
    expect(tokenStore.value()).toBeNull();
    expect(captured).toBeInstanceOf(HttpErrorResponse);
    expect((captured as HttpErrorResponse).error).toEqual({
      error: { message: 'Invalid signature' },
    });
  });
});
