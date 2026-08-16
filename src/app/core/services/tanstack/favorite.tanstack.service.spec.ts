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

import { FavoriteTanStackService } from './favorite.tanstack.service';

const RESTAURANT_DTO = {
  id: 'r-1',
  owner: 'alice',
  name: 'Tacos El Sol',
  slug: 'tacos-el-sol',
  description: '',
  categories: [],
  address: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  latitude: null,
  longitude: null,
  phone: '',
  email: '',
  website: '',
  price_range: '$$',
  cover_image: '',
  average_rating: '4.50',
  total_reviews: 3,
  opening_hours: {},
  is_active: true,
  created_at: '2026-08-07T21:30:32.680664-06:00',
  updated_at: '2026-08-07T21:30:32.680664-06:00',
};

describe('FavoriteTanStackService', () => {
  let service: FavoriteTanStackService;
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
        FavoriteTanStackService,
      ],
    });

    service = TestBed.inject(FavoriteTanStackService);
    httpMock = TestBed.inject(HttpTestingController);
    // See RestaurantTanStackService's spec for why this is needed.
    notifyManager.setScheduler((callback) => callback());
  });

  afterEach(() => {
    httpMock.verify();
    notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  });

  it('lists favorites with the nested restaurant fully mapped', async () => {
    const resource = TestBed.runInInjectionContext(() => service.list(signal({})));
    TestBed.tick();

    httpMock.expectOne(`${environment.apiBaseUrl}/favorites/`).flush({
      count: 1,
      next: null,
      previous: null,
      results: [
        { id: 'f-1', restaurant: RESTAURANT_DTO, created_at: '2026-08-07T21:30:32.680664-06:00' },
      ],
    });
    await vi.waitFor(() => {
      TestBed.tick();
      if (resource.isLoading()) {
        throw new Error('resource still loading');
      }
    });

    expect(resource.value()?.results[0]).toMatchObject({
      id: 'f-1',
      restaurant: { id: 'r-1', averageRating: 4.5 },
    });
  });

  it('toggles a favorite by restaurant id', async () => {
    const mutation = TestBed.runInInjectionContext(() => service.toggle());
    TestBed.tick();

    const promise = mutation.mutate('r-1');
    await Promise.resolve();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/favorites/toggle/`);
    expect(req.request.body).toEqual({ restaurant_id: 'r-1' });
    req.flush({ favorited: true });

    expect(await promise).toEqual({ favorited: true });
  });
});
