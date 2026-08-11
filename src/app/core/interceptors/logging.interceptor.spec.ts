import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { loggingInterceptor } from './logging.interceptor';

describe('loggingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loggingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('logs the outgoing request and the successful response', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    http.get('http://localhost:8000/api/restaurants/').subscribe();
    httpMock.expectOne('http://localhost:8000/api/restaurants/').flush({});

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('→ GET'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('← GET'));

    logSpy.mockRestore();
  });

  it('logs a failed request too', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    http.get('http://localhost:8000/api/restaurants/').subscribe({ error: () => undefined });
    httpMock
      .expectOne('http://localhost:8000/api/restaurants/')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('✗ GET'), expect.anything());

    logSpy.mockRestore();
  });
});
