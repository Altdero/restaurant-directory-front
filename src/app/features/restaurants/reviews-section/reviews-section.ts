import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/models/api-error.model';
import { Review } from '@core/models/review.model';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { ReviewForm, ReviewFormValue } from '@features/restaurants/review-form/review-form';
import { CursorLoadMore } from '@shared/components/cursor-load-more/cursor-load-more';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { RatingStars } from '@shared/components/rating-stars/rating-stars';

/**
 * Presentational — `RestaurantDetailPage` owns `myReview` (a user has at
 * most one review per restaurant, see docs/API.md), the create/update/
 * remove mutations, and the "is the form open" toggle; this component only
 * derives which reviews are "the other ones" (excluding `myReview`, so it
 * isn't shown twice) and renders whichever of the three write states
 * (log in prompt / write-or-edit card / open form) applies.
 */
@Component({
  selector: 'app-reviews-section',
  imports: [
    RatingStars,
    DatePipe,
    EmptyState,
    ErrorState,
    CursorLoadMore,
    ReviewForm,
    MatButtonModule,
    RouterLink,
  ],
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

    .my-review {
      background-color: var(--mat-sys-surface-container);
      border-radius: var(--mat-sys-corner-medium);
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
  `,
})
export class ReviewsSection {
  readonly reviews = input.required<readonly Review[]>();
  readonly isLoading = input.required<boolean>();
  readonly error = input<ApiError | undefined>(undefined);
  readonly hasMore = input<boolean>(false);
  readonly isLoadingMore = input<boolean>(false);

  readonly isAuthenticated = input<boolean>(false);
  readonly myReview = input<Review>();
  readonly loginReturnUrl = input<string>('/');
  readonly isFormOpen = input<boolean>(false);
  readonly formPending = input<boolean>(false);
  readonly formError = input<ApiError | undefined>(undefined);

  readonly loadMore = output<void>();
  readonly openForm = output<void>();
  readonly cancelForm = output<void>();
  readonly submitForm = output<ReviewFormValue>();
  readonly deleteReview = output<void>();

  protected readonly otherReviews = computed(() =>
    this.reviews().filter((review) => review.id !== this.myReview()?.id),
  );
  protected readonly apiErrorMessage = apiErrorMessage;

  protected emptyMessage(): string {
    return $localize`:@@reviewsSection.emptyMessage:No reviews yet.`;
  }
}
