import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Category } from '@core/models/category.model';
import { PriceRange } from '@core/models/restaurant.model';

export interface RestaurantFiltersValue {
  readonly category?: string;
  readonly city?: string;
  readonly priceRange?: PriceRange;
  readonly minRating?: number;
  readonly search?: string;
}

const PRICE_RANGES: readonly PriceRange[] = ['$', '$$', '$$$', '$$$$'];
const RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * Presentational except for the reactive form itself (template-driven form
 * state, not business logic — allowed per AGENTS.md § Templates). Applies
 * on submit, not live per keystroke: `/restaurants` is server-rendered
 * per request specifically so each filter combination is its own
 * crawlable URL — a live-apply-on-type UX would fight that by firing a
 * new SSR navigation on every keystroke.
 */
@Component({
  selector: 'app-restaurant-filters',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './restaurant-filters.html',
  styles: `
    .restaurant-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 0.5rem;
    }
  `,
})
export class RestaurantFilters {
  private readonly fb = inject(FormBuilder);

  readonly categories = input.required<readonly Category[]>();
  readonly category = input<string>();
  readonly city = input<string>();
  readonly priceRange = input<PriceRange>();
  readonly minRating = input<number>();
  readonly search = input<string>();

  readonly filtersChange = output<RestaurantFiltersValue>();

  protected readonly priceRanges = PRICE_RANGES;
  protected readonly ratings = RATINGS;

  protected readonly form = this.fb.group({
    category: this.fb.control<string | undefined>(undefined),
    city: this.fb.control<string | undefined>(undefined),
    priceRange: this.fb.control<PriceRange | undefined>(undefined),
    minRating: this.fb.control<number | undefined>(undefined),
    search: this.fb.control<string | undefined>(undefined),
  });

  constructor() {
    effect(() => {
      this.form.patchValue(
        {
          category: this.category(),
          city: this.city(),
          priceRange: this.priceRange(),
          minRating: this.minRating(),
          search: this.search(),
        },
        { emitEvent: false },
      );
    });
  }

  submit(): void {
    const raw = this.form.getRawValue();
    this.filtersChange.emit({
      category: raw.category ?? undefined,
      city: raw.city ?? undefined,
      priceRange: raw.priceRange ?? undefined,
      minRating: raw.minRating ?? undefined,
      search: raw.search ?? undefined,
    });
  }

  reset(): void {
    this.form.reset();
    this.submit();
  }
}
