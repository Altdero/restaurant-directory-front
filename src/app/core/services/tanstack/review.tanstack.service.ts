import { HttpClient } from '@angular/common/http';
import { Injectable, inject, Signal } from '@angular/core';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { ReviewDataService, ReviewQuery } from '@core/interfaces/review-data.service';
import { ApiError } from '@core/models/api-error.model';
import { CursorPage } from '@core/models/pagination.model';
import { Review, ReviewCreate, ReviewDto, ReviewUpdate, toReview } from '@core/models/review.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { mapCursorPage } from '@core/utils/pagination-mapper';
import { toReviewParams } from '@core/utils/query-params';
import { environment } from '@environments/environment';
import { firstValueFrom, map } from 'rxjs';

import { toAsyncMutation, toAsyncResource } from './tanstack.adapter';

/** See `RestaurantHttpResourceService` for why `@Injectable()` with no `providedIn`. */
@Injectable()
export class ReviewTanStackService implements ReviewDataService {
  private readonly http = inject(HttpClient);

  list(query: Signal<ReviewQuery>): AsyncResource<CursorPage<Review>> {
    const result = injectQuery<CursorPage<Review>, ApiError>(() => {
      const q = query();
      return {
        queryKey: ['reviews', 'list', q],
        queryFn: () =>
          firstValueFrom(
            this.http
              .get<unknown>(buildUrl(environment.apiBaseUrl, '/reviews/', toReviewParams(q)))
              .pipe(map(mapCursorPage(toReview))),
          ),
      };
    });
    return toAsyncResource(result);
  }

  loadMore(url: string): Promise<CursorPage<Review>> {
    return firstValueFrom(this.http.get<unknown>(url).pipe(map(mapCursorPage(toReview))));
  }

  create(): AsyncMutation<ReviewCreate, Review> {
    const mutation = injectMutation<Review, ApiError, ReviewCreate>(() => ({
      mutationFn: (body) =>
        firstValueFrom(
          this.http
            .post<ReviewDto>(buildUrl(environment.apiBaseUrl, '/reviews/'), body)
            .pipe(map(toReview)),
        ),
    }));
    return toAsyncMutation(mutation);
  }

  update(): AsyncMutation<{ id: string; body: ReviewUpdate }, Review> {
    const mutation = injectMutation<Review, ApiError, { id: string; body: ReviewUpdate }>(() => ({
      mutationFn: ({ id, body }) =>
        firstValueFrom(
          this.http
            .patch<ReviewDto>(buildUrl(environment.apiBaseUrl, `/reviews/${id}/`), body)
            .pipe(map(toReview)),
        ),
    }));
    return toAsyncMutation(mutation);
  }

  remove(): AsyncMutation<string, void> {
    const mutation = injectMutation<void, ApiError, string>(() => ({
      mutationFn: (id) =>
        firstValueFrom(this.http.delete<void>(buildUrl(environment.apiBaseUrl, `/reviews/${id}/`))),
    }));
    return toAsyncMutation(mutation);
  }
}
