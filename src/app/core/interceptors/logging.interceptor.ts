import { HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@environments/environment';
import { tap } from 'rxjs';

/** Development-only request/response logging. A no-op in production. */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.production) {
    return next(req);
  }

  const start = Date.now();
  console.log(`[HTTP] → ${req.method} ${req.url}`);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          console.log(`[HTTP] ← ${req.method} ${req.url} (${Date.now() - start}ms)`);
        }
      },
      error: (error: unknown) => {
        console.log(`[HTTP] ✗ ${req.method} ${req.url} (${Date.now() - start}ms)`, error);
      },
    }),
  );
};
