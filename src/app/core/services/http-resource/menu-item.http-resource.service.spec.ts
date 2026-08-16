import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { environment } from '@environments/environment';
import { provideRouter } from '@angular/router';

import { MenuItemHttpResourceService } from './menu-item.http-resource.service';

describe('MenuItemHttpResourceService', () => {
  let service: MenuItemHttpResourceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        MenuItemHttpResourceService,
      ],
    });

    service = TestBed.inject(MenuItemHttpResourceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists menu items for a restaurant, parsing the decimal price', async () => {
    const resource = TestBed.runInInjectionContext(() =>
      service.list(signal({ restaurantId: 'r-1' })),
    );
    TestBed.tick();

    httpMock.expectOne(`${environment.apiBaseUrl}/menu-items/?restaurant_id=r-1`).flush({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 'm-1',
          restaurant: 'r-1',
          restaurant_name: 'Tacos El Sol',
          name: 'Al Pastor',
          description: '',
          price: '12.50',
          category: 'main_course',
          image: '',
          is_available: true,
          created_at: '2026-08-07T21:30:32.680664-06:00',
          updated_at: '2026-08-07T21:30:32.680664-06:00',
        },
      ],
    });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(resource.value()?.results[0]).toMatchObject({ id: 'm-1', price: 12.5 });
  });

  it('creates a menu item via a plain mutation', async () => {
    const mutation = service.create();

    const promise = mutation.mutate({
      restaurant: 'r-1',
      name: 'Quesadilla',
      description: '',
      price: 8,
      category: 'main_course',
      image: '',
      is_available: true,
    });

    httpMock.expectOne(`${environment.apiBaseUrl}/menu-items/`).flush({
      id: 'm-2',
      restaurant: 'r-1',
      restaurant_name: 'Tacos El Sol',
      name: 'Quesadilla',
      description: '',
      price: '8.00',
      category: 'main_course',
      image: '',
      is_available: true,
      created_at: '2026-08-07T21:30:32.680664-06:00',
      updated_at: '2026-08-07T21:30:32.680664-06:00',
    });

    const result = await promise;

    expect(result).toMatchObject({ id: 'm-2', price: 8 });
    expect(mutation.isPending()).toBe(false);
  });
});
