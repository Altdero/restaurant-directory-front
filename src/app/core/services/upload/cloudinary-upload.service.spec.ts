import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@environments/environment';

import { CloudinaryUploadService } from './cloudinary-upload.service';

const SIGNATURE_DTO = {
  signature: 'sig-1',
  timestamp: 1234567890,
  api_key: 'key-1',
  cloud_name: 'demo',
  folder: 'restaurant-directory/restaurants',
};

describe('CloudinaryUploadService', () => {
  let service: CloudinaryUploadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CloudinaryUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests a signature, then uploads directly to Cloudinary with it, returning the secure_url', async () => {
    const file = new File(['x'], 'cover.jpg', { type: 'image/jpeg' });
    const promise = service.upload(file, 'restaurants');

    const signatureReq = httpMock.expectOne(`${environment.apiBaseUrl}/uploads/signature/`);
    expect(signatureReq.request.body).toEqual({ folder: 'restaurants' });
    signatureReq.flush(SIGNATURE_DTO);

    // Two sequential `await firstValueFrom(...)` calls inside `upload()` —
    // unlike a pure RxJS operator chain, each `await` is guaranteed a real
    // microtask hop, so the Cloudinary request isn't issued synchronously
    // within `flush()`. Poll rather than guess the exact hop count, same
    // reasoning as this project's TanStack tests (see docs/ARCHITECTURE.md).
    const uploadReq = await vi.waitFor(() =>
      httpMock.expectOne('https://api.cloudinary.com/v1_1/demo/image/upload'),
    );
    const body = uploadReq.request.body as FormData;
    expect(body.get('file')).toBe(file);
    expect(body.get('api_key')).toBe('key-1');
    expect(body.get('timestamp')).toBe('1234567890');
    expect(body.get('signature')).toBe('sig-1');
    expect(body.get('folder')).toBe('restaurant-directory/restaurants');
    uploadReq.flush({ secure_url: 'https://res.cloudinary.com/demo/image/upload/cover.jpg' });

    expect(await promise).toBe('https://res.cloudinary.com/demo/image/upload/cover.jpg');
  });
});
