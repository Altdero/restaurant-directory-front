import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApplicationRef, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { ApiError } from '@core/models/api-error.model';
import { environment } from '@environments/environment';

import { RestaurantHttpResourceService } from './restaurant.http-resource.service';

describe('RestaurantHttpResourceService', () => {
  let service: RestaurantHttpResourceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        RestaurantHttpResourceService,
      ],
    });

    service = TestBed.inject(RestaurantHttpResourceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists restaurants, mapping decimals, nested categories and pagination', async () => {
    const resource = TestBed.runInInjectionContext(() =>
      service.list(signal({ city: 'Mexico City' })),
    );
    TestBed.tick();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/restaurants/?city=Mexico+City`);
    req.flush({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 'r-1',
          owner: 'alice',
          name: 'Tacos El Sol',
          slug: 'tacos-el-sol',
          description: '',
          categories: [],
          address: '',
          city: 'Mexico City',
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
        },
      ],
    });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(resource.isLoading()).toBe(false);
    expect(resource.value()?.count).toBe(1);
    expect(resource.value()?.results[0]).toMatchObject({
      id: 'r-1',
      averageRating: 4.5,
      priceRange: '$$',
    });
  });

  it('does not issue a request when byId is given an undefined id', () => {
    const id = signal<string | undefined>(undefined);
    const resource = TestBed.runInInjectionContext(() => service.byId(id));
    TestBed.tick();

    httpMock.expectNone(() => true);
    expect(resource.value()).toBeUndefined();
  });

  it('unwraps the real ApiError from the ResourceWrappedError httpResource produces', async () => {
    const resource = TestBed.runInInjectionContext(() => service.byId(signal('missing-id')));
    TestBed.tick();

    httpMock
      .expectOne(`${environment.apiBaseUrl}/restaurants/missing-id/`)
      .flush(
        { detail: 'No Restaurant matches the given query.' },
        { status: 404, statusText: 'Not Found' },
      );
    await TestBed.inject(ApplicationRef).whenStable();

    const error: ApiError | undefined = resource.error();
    expect(error).toEqual({
      type: 'detail',
      status: 404,
      message: 'No Restaurant matches the given query.',
      code: undefined,
    });
  });

  it('creates a restaurant via a plain mutation, unaffected by the resource-wrapping behavior', async () => {
    const mutation = service.create();

    const promise = mutation.mutate({
      name: 'New Place',
      description: '',
      category_ids: [],
      address: '',
      city: 'Mexico City',
      state: '',
      country: '',
      postal_code: '',
      latitude: null,
      longitude: null,
      phone: '',
      email: '',
      website: '',
      price_range: '$',
      cover_image: '',
      opening_hours: {},
      is_active: true,
    });

    expect(mutation.isPending()).toBe(true);

    httpMock.expectOne(`${environment.apiBaseUrl}/restaurants/`).flush({
      id: 'r-2',
      owner: 'alice',
      name: 'New Place',
      slug: 'new-place',
      description: '',
      categories: [],
      address: '',
      city: 'Mexico City',
      state: '',
      country: '',
      postal_code: '',
      latitude: null,
      longitude: null,
      phone: '',
      email: '',
      website: '',
      price_range: '$',
      cover_image: '',
      average_rating: '0.00',
      total_reviews: 0,
      opening_hours: {},
      is_active: true,
      created_at: '2026-08-07T21:30:32.680664-06:00',
      updated_at: '2026-08-07T21:30:32.680664-06:00',
    });

    const result = await promise;

    expect(result.id).toBe('r-2');
    expect(mutation.isPending()).toBe(false);
  });
});
