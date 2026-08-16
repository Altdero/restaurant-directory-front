import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  QueryClient,
  notifyManager,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { environment } from '@environments/environment';

import { CategoryTanStackService } from './category.tanstack.service';

describe('CategoryTanStackService', () => {
  let service: CategoryTanStackService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTanStackQuery(
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          }),
        ),
        CategoryTanStackService,
      ],
    });

    service = TestBed.inject(CategoryTanStackService);
    httpMock = TestBed.inject(HttpTestingController);
    // See RestaurantTanStackService's spec for why this is needed.
    notifyManager.setScheduler((callback) => callback());
  });

  afterEach(() => {
    httpMock.verify();
    notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  });

  it('lists categories', async () => {
    const resource = TestBed.runInInjectionContext(() => service.list(signal({})));
    TestBed.tick();

    httpMock.expectOne(`${environment.apiBaseUrl}/categories/`).flush({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 'c-1',
          name: 'Tacos',
          slug: 'tacos',
          description: '',
          icon: '',
          is_active: true,
          created_at: '2026-08-07T21:30:32.680664-06:00',
          updated_at: '2026-08-07T21:30:32.680664-06:00',
        },
      ],
    });
    await vi.waitFor(() => {
      TestBed.tick();
      if (resource.isLoading()) {
        throw new Error('resource still loading');
      }
    });

    expect(resource.value()?.results[0]).toMatchObject({ id: 'c-1', name: 'Tacos', slug: 'tacos' });
  });

  it('does not issue a request when byId is given an undefined id', () => {
    const resource = TestBed.runInInjectionContext(() =>
      service.byId(signal<string | undefined>(undefined)),
    );
    TestBed.tick();

    httpMock.expectNone(() => true);
    expect(resource.value()).toBeUndefined();
  });
});
