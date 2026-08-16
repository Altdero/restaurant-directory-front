import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { ReviewDataService, ReviewQuery } from '@core/interfaces/review-data.service';
import { CursorPage } from '@core/models/pagination.model';
import { Review, ReviewCreate, ReviewDto, ReviewUpdate, toReview } from '@core/models/review.model';
import { buildUrl } from '@core/utils/api-url.builder';
import { mapCursorPage } from '@core/utils/pagination-mapper';
import { toReviewParams } from '@core/utils/query-params';
import { environment } from '@environments/environment';
import { firstValueFrom, map } from 'rxjs';

import { createMutation, toAsyncResource } from './http-resource.adapter';

const EMPTY_PAGE: CursorPage<Review> = { next: null, previous: null, results: [] };

/** See `RestaurantHttpResourceService` for why `@Injectable()` with no `providedIn`. */
@Injectable()
export class ReviewHttpResourceService implements ReviewDataService {
  private readonly http = inject(HttpClient);

  list(query: Signal<ReviewQuery>): AsyncResource<CursorPage<Review>> {
    const resource = httpResource(
      () => buildUrl(environment.apiBaseUrl, '/reviews/', toReviewParams(query())),
      { defaultValue: EMPTY_PAGE, parse: mapCursorPage(toReview) },
    );
    return toAsyncResource(resource);
  }

  loadMore(url: string): Promise<CursorPage<Review>> {
    return firstValueFrom(this.http.get<unknown>(url).pipe(map(mapCursorPage(toReview))));
  }

  create(): AsyncMutation<ReviewCreate, Review> {
    return createMutation((body) =>
      this.http
        .post<ReviewDto>(buildUrl(environment.apiBaseUrl, '/reviews/'), body)
        .pipe(map(toReview)),
    );
  }

  update(): AsyncMutation<{ id: string; body: ReviewUpdate }, Review> {
    return createMutation(({ id, body }) =>
      this.http
        .patch<ReviewDto>(buildUrl(environment.apiBaseUrl, `/reviews/${id}/`), body)
        .pipe(map(toReview)),
    );
  }

  remove(): AsyncMutation<string, void> {
    return createMutation((id) =>
      this.http.delete<void>(buildUrl(environment.apiBaseUrl, `/reviews/${id}/`)),
    );
  }
}
