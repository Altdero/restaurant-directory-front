import { DatePipe, DecimalPipe } from '@angular/common';
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
    DecimalPipe,
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
      font-size: 1.625rem;
      margin: 0 0 1.25rem;
    }

    .summary {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.125rem;
      margin-bottom: 1.25rem;
      background-color: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
    }

    .summary-rating {
      font-family: 'Fraunces Variable', serif;
      font-weight: 600;
      font-size: 2.375rem;
      line-height: 1;
    }

    .summary-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-meta span {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    ul {
      list-style: none;
      margin: 0 0 1rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .review-card {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background-color: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
    }

    .avatar {
      flex: none;
      width: 2.25rem;
      height: 2.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--mat-sys-corner-full);
      background-color: var(--app-chip-teal-bg);
      color: var(--app-chip-teal-fg);
      font: var(--mat-sys-label-medium);
      font-weight: 600;
    }

    .review-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .review-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .username {
      font-weight: 600;
    }

    .date {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .comment {
      margin: 0;
    }

    .my-review {
      margin-bottom: 1.5rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .pill {
      border-radius: var(--mat-sys-corner-full);
      height: 2.75rem;
      padding: 0 1.5rem;
    }

    p > a {
      color: var(--mat-sys-primary);
      font-weight: 500;
      text-decoration: none;
    }
  `,
})
export class ReviewsSection {
  readonly reviews = input.required<readonly Review[]>();
  readonly isLoading = input.required<boolean>();
  readonly error = input<ApiError | undefined>(undefined);
  readonly hasMore = input<boolean>(false);
  readonly isLoadingMore = input<boolean>(false);
  /** The restaurant's own authoritative totals — not derived from `reviews()`, which is only whatever page has loaded so far. */
  readonly averageRating = input<number>(0);
  readonly totalReviews = input<number>(0);

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

  protected initials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }
}
