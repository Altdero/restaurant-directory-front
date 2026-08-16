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
import { ApiError } from '@core/models/api-error.model';
import { environment } from '@environments/environment';

import { RestaurantTanStackService } from './restaurant.tanstack.service';

describe('RestaurantTanStackService', () => {
  let service: RestaurantTanStackService;
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
        RestaurantTanStackService,
      ],
    });

    service = TestBed.inject(RestaurantTanStackService);
    httpMock = TestBed.inject(HttpTestingController);

    // notifyManager (@tanstack/query-core) dispatches state-change
    // notifications via a real `setTimeout(0)` macrotask by default, and
    // @tanstack/angular-query-experimental only registers the Angular
    // `PendingTasks` entry inside that scheduled callback
    // (create-base-query.mjs) — so without this, a synchronous
    // `HttpTestingController.flush()` leaves the query's resolved state
    // stuck behind a real timer tick that nothing in a plain `TestBed.tick()`
    // flushes. Forcing the scheduler to run synchronously makes the whole
    // chain (HTTP response -> observer state -> signal write) settle within
    // `flush()` itself, so no macrotask wait is needed anywhere below.
    notifyManager.setScheduler((callback) => callback());
  });

  afterEach(() => {
    httpMock.verify();
    notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  });

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
    // The queryFn's resolution chain (firstValueFrom -> createRetryer's
    // internal Promise handling, @tanstack/query-core) crosses more than one
    // microtask boundary before the signal updates, and hardcoding an exact
    // tick count would couple this test to TanStack's internal
    // implementation depth. Polling until the state settles is the robust
    // alternative — no real setTimeout(0) wait needed since the scheduler
    // override above already made notification dispatch synchronous.
    await vi.waitFor(() => {
      TestBed.tick();
      if (resource.isLoading()) {
        throw new Error('resource still loading');
      }
    });

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

  it('surfaces the exact ApiError error.interceptor.ts threw, unwrapped', async () => {
    const resource = TestBed.runInInjectionContext(() => service.byId(signal('missing-id')));
    TestBed.tick();

    httpMock
      .expectOne(`${environment.apiBaseUrl}/restaurants/missing-id/`)
      .flush(
        { detail: 'No Restaurant matches the given query.' },
        { status: 404, statusText: 'Not Found' },
      );
    // See the polling comment in the "lists restaurants" test above.
    await vi.waitFor(() => {
      TestBed.tick();
      if (resource.error() === undefined) {
        throw new Error('resource error not yet set');
      }
    });

    const error: ApiError | undefined = resource.error();
    expect(error).toEqual({
      type: 'detail',
      status: 404,
      message: 'No Restaurant matches the given query.',
      code: undefined,
    });
  });

  it('creates a restaurant via a mutation', async () => {
    const mutation = TestBed.runInInjectionContext(() => service.create());
    TestBed.tick();

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
    // Mutation#execute (@tanstack/query-core) is itself an `async` method —
    // the actual mutationFn call (and thus the HTTP request) doesn't happen
    // synchronously inside mutate(), same microtask reasoning as the query
    // tests above.
    await Promise.resolve();

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
  });
});
