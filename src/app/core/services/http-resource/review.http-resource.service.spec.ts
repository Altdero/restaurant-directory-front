import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { environment } from '@environments/environment';
import { provideRouter } from '@angular/router';

import { ReviewHttpResourceService } from './review.http-resource.service';

describe('ReviewHttpResourceService', () => {
  let service: ReviewHttpResourceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        ReviewHttpResourceService,
      ],
    });

    service = TestBed.inject(ReviewHttpResourceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

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
    await TestBed.inject(ApplicationRef).whenStable();

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

  it('creates a review via a plain mutation', async () => {
    const mutation = service.create();

    const promise = mutation.mutate({ restaurant: 'r-1', rating: 5, comment: 'Great!' });

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
