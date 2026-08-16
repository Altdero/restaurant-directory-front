import { Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { CursorPage } from '@core/models/pagination.model';
import { Review, ReviewCreate, ReviewUpdate } from '@core/models/review.model';

export interface ReviewQuery {
  readonly restaurantId?: string;
}

export interface ReviewDataService {
  /** Always the first page — cursor pagination never takes a `cursor` filter. */
  list(query: Signal<ReviewQuery>): AsyncResource<CursorPage<Review>>;
  /**
   * Fetches an opaque `next`/`previous` URL verbatim, exactly as returned by
   * the API — never construct a cursor value manually (see docs/API.md).
   * Accumulating pages into one growing list is the calling page's job, not
   * the data layer's.
   */
  loadMore(url: string): Promise<CursorPage<Review>>;
  create(): AsyncMutation<ReviewCreate, Review>;
  update(): AsyncMutation<{ id: string; body: ReviewUpdate }, Review>;
  remove(): AsyncMutation<string, void>;
}
