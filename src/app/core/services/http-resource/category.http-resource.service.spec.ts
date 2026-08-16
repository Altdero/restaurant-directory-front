import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { environment } from '@environments/environment';
import { provideRouter } from '@angular/router';

import { CategoryHttpResourceService } from './category.http-resource.service';

describe('CategoryHttpResourceService', () => {
  let service: CategoryHttpResourceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        CategoryHttpResourceService,
      ],
    });

    service = TestBed.inject(CategoryHttpResourceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

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
    await TestBed.inject(ApplicationRef).whenStable();

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
