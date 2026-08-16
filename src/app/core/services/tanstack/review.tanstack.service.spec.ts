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

import { ReviewTanStackService } from './review.tanstack.service';

describe('ReviewTanStackService', () => {
  let service: ReviewTanStackService;
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
        ReviewTanStackService,
      ],
    });

    service = TestBed.inject(ReviewTanStackService);
    httpMock = TestBed.inject(HttpTestingController);
    // See RestaurantTanStackService's spec for why this is needed.
    notifyManager.setScheduler((callback) => callback());
  });

  afterEach(() => {
    httpMock.verify();
    notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  });

  it('lists the first page of reviews with no count field', async () => {
    const resource = TestBed.runInInjectionContext(() =>
      service.list(signal({ restaurantId: 'r-1' })),
    );
    TestBed.tick();

    httpMock.expectOne(`${environment.apiBaseUrl}/reviews/?restaurant_id=r-1`).flush({
      next: 'https://api/reviews/?cursor=abc',
      previous: null,
      results: [
        {
          id: 'rv-1',
          restaurant: 'r-1',
          user: 'u-1',
          username: 'alice',
          rating: 5,
          comment: 'Great!',
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

    expect(resource.value()).toMatchObject({
      next: 'https://api/reviews/?cursor=abc',
      results: [{ id: 'rv-1', rating: 5 }],
    });
    expect(resource.value()).not.toHaveProperty('count');
  });

  it('loadMore fetches the opaque next URL verbatim', async () => {
    const promise = service.loadMore('https://api/reviews/?cursor=abc');

    httpMock.expectOne('https://api/reviews/?cursor=abc').flush({
      next: null,
      previous: 'https://api/reviews/?cursor=xyz',
      results: [
        {
          id: 'rv-2',
          restaurant: 'r-1',
          user: 'u-2',
          username: 'bob',
          rating: 4,
          comment: 'Good',
          created_at: '2026-08-07T21:30:32.680664-06:00',
          updated_at: '2026-08-07T21:30:32.680664-06:00',
        },
      ],
    });

    const page = await promise;

    expect(page.results).toEqual([expect.objectContaining({ id: 'rv-2', rating: 4 })]);
  });

  it('creates a review via a mutation', async () => {
    const mutation = TestBed.runInInjectionContext(() => service.create());
    TestBed.tick();

    const promise = mutation.mutate({ restaurant: 'r-1', rating: 5, comment: 'Great!' });
    await Promise.resolve();

    httpMock.expectOne(`${environment.apiBaseUrl}/reviews/`).flush({
      id: 'rv-3',
      restaurant: 'r-1',
      user: 'u-1',
      username: 'alice',
      rating: 5,
      comment: 'Great!',
      created_at: '2026-08-07T21:30:32.680664-06:00',
      updated_at: '2026-08-07T21:30:32.680664-06:00',
    });

    const result = await promise;

    expect(result).toMatchObject({ id: 'rv-3', rating: 5 });
  });
});
