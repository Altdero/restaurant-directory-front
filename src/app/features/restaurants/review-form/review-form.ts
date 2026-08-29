import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiError } from '@core/models/api-error.model';
import { Review } from '@core/models/review.model';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { fieldErrorMessage } from '@core/utils/field-error-message';

export interface ReviewFormValue {
  readonly rating: number;
  readonly comment: string;
}

const RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * Presentational — `RestaurantDetailPage` owns the create-vs-update
 * decision (a user has at most one review per restaurant, see
 * docs/API.md) and the mutation calls. `review` present means edit mode;
 * absent means create mode, only the mode-appropriate heading/submit text differ.
 */
@Component({
  selector: 'app-review-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './review-form.html',
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 24rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .error {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class ReviewForm {
  private readonly fb = inject(FormBuilder);

  readonly review = input<Review>();
  readonly isPending = input<boolean>(false);
  readonly error = input<ApiError | undefined>(undefined);

  readonly save = output<ReviewFormValue>();
  readonly cancelled = output<void>();

  protected readonly ratings = RATINGS;
  protected readonly apiErrorMessage = apiErrorMessage;
  protected readonly fieldErrorMessage = fieldErrorMessage;

  protected readonly form = this.fb.nonNullable.group({
    rating: this.fb.nonNullable.control<number | null>(null, Validators.required),
    comment: this.fb.nonNullable.control('', Validators.required),
  });

  constructor() {
    effect(() => {
      const review = this.review();
      this.form.patchValue({
        rating: review?.rating ?? null,
        comment: review?.comment ?? '',
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (raw.rating === null) {
      return;
    }
    this.save.emit({ rating: raw.rating, comment: raw.comment });
  }
}
