import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@environments/environment';

import { AccessTokenStore } from './access-token.store';
import { TokenRefreshCoordinator } from './token-refresh-coordinator';

describe('TokenRefreshCoordinator', () => {
  let coordinator: TokenRefreshCoordinator;
  let httpMock: HttpTestingController;
  let tokenStore: AccessTokenStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    coordinator = TestBed.inject(TokenRefreshCoordinator);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStore = TestBed.inject(AccessTokenStore);
  });

  afterEach(() => httpMock.verify());

  it('calls auth/refresh/ with credentials and updates the token store', () => {
    let result: string | undefined;
    coordinator.refresh().subscribe((access) => (result = access));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ access: 'new-token' });

    expect(result).toBe('new-token');
    expect(tokenStore.value()).toBe('new-token');
  });

  it('shares a single in-flight refresh across concurrent callers', () => {
    const results: string[] = [];
    coordinator.refresh().subscribe((access) => results.push(access));
    coordinator.refresh().subscribe((access) => results.push(access));

    httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh/`).flush({ access: 'shared-token' });

    expect(results).toEqual(['shared-token', 'shared-token']);
  });

  it('starts a fresh refresh after the previous one has completed', () => {
    coordinator.refresh().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh/`).flush({ access: 'first' });

    coordinator.refresh().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/auth/refresh/`).flush({ access: 'second' });

    expect(tokenStore.value()).toBe('second');
  });
});
