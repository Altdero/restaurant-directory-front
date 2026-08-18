import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ApiError } from '@core/models/api-error.model';
import { Review } from '@core/models/review.model';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { CursorLoadMore } from '@shared/components/cursor-load-more/cursor-load-more';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { RatingStars } from '@shared/components/rating-stars/rating-stars';

/**
 * Display only — creating/editing/deleting a review is commit 13's job
 * (`ReviewForm`, per PLAN.md's commit plan). `loadMore` is a plain output:
 * the smart `RestaurantDetailPage` owns the accumulated list and the
 * `ReviewDataService.loadMore()` call, since a cursor URL must be used
 * verbatim, never reconstructed (see docs/API.md).
 */
@Component({
  selector: 'app-reviews-section',
  imports: [RatingStars, DatePipe, EmptyState, ErrorState, CursorLoadMore],
  templateUrl: './reviews-section.html',
  styles: `
    h2 {
      font: var(--mat-sys-title-medium);
    }

    ul {
      list-style: none;
      margin: 0 0 1rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .review-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .username {
      font-weight: 500;
    }

    .date {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .comment {
      margin: 0.25rem 0 0;
    }
  `,
})
export class ReviewsSection {
  readonly reviews = input.required<readonly Review[]>();
  readonly isLoading = input.required<boolean>();
  readonly error = input<ApiError | undefined>(undefined);
  readonly hasMore = input<boolean>(false);
  readonly isLoadingMore = input<boolean>(false);

  readonly loadMore = output<void>();

  protected readonly apiErrorMessage = apiErrorMessage;

  protected emptyMessage(): string {
    return $localize`:@@reviewsSection.emptyMessage:No reviews yet.`;
  }
}
