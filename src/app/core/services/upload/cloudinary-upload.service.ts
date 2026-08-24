import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { UploadFolder, UploadSignatureDto } from '@core/models/upload.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { environment } from '@environments/environment';
import { firstValueFrom } from 'rxjs';

/**
 * Single-implementation utility service, not a token+dual-implementation
 * resource like `RESTAURANT_DATA` etc. — Cloudinary has exactly one
 * backend, nothing to swap, matching the same `@Service()` singleton
 * pattern `NotificationService`/`ThemeService` already use.
 *
 * Two calls, both through the normally-injected `HttpClient` (no
 * `HttpBackend` bypass — that exists elsewhere only to dodge interceptor
 * *re-entrancy*, a different problem): `POST uploads/signature/` matches
 * `environment.apiBaseUrl`, so `auth.interceptor.ts` attaches our bearer
 * token correctly; the following Cloudinary POST never matches that
 * prefix, so the same interceptor's existing scoping guard excludes it by
 * construction — no third-party token leak, nothing extra to configure
 * here (see docs/API.md's upload flow and `auth.interceptor.ts`'s doc
 * comment, which names this exact call).
 */
@Service()
export class CloudinaryUploadService {
  private readonly http = inject(HttpClient);

  async upload(file: File, folder: UploadFolder): Promise<string> {
    const signature = await firstValueFrom(
      this.http.post<UploadSignatureDto>(buildUrl(environment.apiBaseUrl, '/uploads/signature/'), {
        folder,
      }),
    );

    const body = new FormData();
    body.append('file', file);
    body.append('api_key', signature.api_key);
    body.append('timestamp', String(signature.timestamp));
    body.append('signature', signature.signature);
    body.append('folder', signature.folder);

    const response = await firstValueFrom(
      this.http.post<{ readonly secure_url: string }>(
        `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`,
        body,
      ),
    );
    return response.secure_url;
  }
}
