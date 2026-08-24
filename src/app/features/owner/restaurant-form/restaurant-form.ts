import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiError } from '@core/models/api-error.model';
import { Category } from '@core/models/category.model';
import { PriceRange, Restaurant } from '@core/models/restaurant.model';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { applyFieldErrors } from '@core/utils/apply-field-errors';
import { ImageUploader } from '@shared/components/image-uploader/image-uploader';

export interface RestaurantFormValue {
  readonly name: string;
  readonly description: string;
  readonly category_ids: readonly string[];
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly postal_code: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly price_range: PriceRange;
  readonly is_active: boolean;
  readonly cover_image: string;
}

const PRICE_RANGES: readonly PriceRange[] = ['$', '$$', '$$$', '$$$$'];

/**
 * Presentational and mode-agnostic, same pattern as `ReviewForm`: `restaurant`
 * present means edit, absent means create — the parent (`RestaurantFormPage`)
 * decides which mutation to call and what extra keys the request body needs
 * (see that component's doc comment for the create-vs-edit body asymmetry).
 *
 * `opening_hours`/`latitude`/`longitude` are deliberately not fields here —
 * see PLAN.md commit 15's scope decisions (still no established editor for
 * a weekday schedule, still no map). Control names stay snake_case to match
 * `RestaurantWrite`'s DTO keys exactly, the same reason `login-page.ts`/
 * `register-page.ts` do this: `applyFieldErrors` looks up a form control by
 * the API's own field name, with no mapping table.
 *
 * `cover_image` is **not** a Reactive Form control — nothing to type into,
 * it's driven entirely by `ImageUploader`. `coverImageUrl` (the current
 * value, from whichever source — the loaded restaurant or a fresh upload)
 * is a plain input the parent (`RestaurantFormPage`) keeps live; `submit()`
 * merges it into the emitted value directly. This component never performs
 * HTTP itself (same rule as `ReviewForm`/`RestaurantFilters`) — a selected
 * file is re-emitted up via `imageSelected` for the parent to actually
 * upload.
 */
@Component({
  selector: 'app-restaurant-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ImageUploader,
  ],
  templateUrl: './restaurant-form.html',
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 32rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .error {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class RestaurantForm {
  private readonly fb = inject(FormBuilder);

  readonly restaurant = input<Restaurant>();
  readonly categories = input.required<readonly Category[]>();
  readonly isPending = input<boolean>(false);
  readonly error = input<ApiError | undefined>(undefined);
  readonly coverImageUrl = input<string>('');
  readonly isUploadingImage = input<boolean>(false);

  readonly save = output<RestaurantFormValue>();
  readonly cancelled = output<void>();
  readonly imageSelected = output<File>();

  protected readonly priceRanges = PRICE_RANGES;
  protected readonly apiErrorMessage = apiErrorMessage;

  protected readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', Validators.required),
    description: this.fb.nonNullable.control(''),
    category_ids: this.fb.nonNullable.control<readonly string[]>([]),
    address: this.fb.nonNullable.control(''),
    city: this.fb.nonNullable.control(''),
    state: this.fb.nonNullable.control(''),
    country: this.fb.nonNullable.control(''),
    postal_code: this.fb.nonNullable.control(''),
    phone: this.fb.nonNullable.control(''),
    email: this.fb.nonNullable.control('', Validators.email),
    website: this.fb.nonNullable.control(''),
    price_range: this.fb.nonNullable.control<PriceRange>('$'),
    is_active: this.fb.nonNullable.control(true),
  });

  constructor() {
    effect(() => {
      const restaurant = this.restaurant();
      this.form.patchValue({
        name: restaurant?.name ?? '',
        description: restaurant?.description ?? '',
        category_ids: restaurant?.categories.map((category) => category.id) ?? [],
        address: restaurant?.address ?? '',
        city: restaurant?.city ?? '',
        state: restaurant?.state ?? '',
        country: restaurant?.country ?? '',
        postal_code: restaurant?.postalCode ?? '',
        phone: restaurant?.phone ?? '',
        email: restaurant?.email ?? '',
        website: restaurant?.website ?? '',
        price_range: restaurant?.priceRange ?? '$',
        is_active: restaurant?.isActive ?? true,
      });
    });

    effect(() => {
      const error = this.error();
      if (error) {
        applyFieldErrors(this.form, error);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.save.emit({ ...this.form.getRawValue(), cover_image: this.coverImageUrl() });
  }
}
