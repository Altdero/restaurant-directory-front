import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiError } from '@core/models/api-error.model';
import { MenuItem, MenuItemCategory } from '@core/models/menu-item.model';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { applyFieldErrors } from '@core/utils/apply-field-errors';
import { fieldErrorMessage } from '@core/utils/field-error-message';
import { menuItemCategoryLabel } from '@core/utils/menu-item-category-label';
import { ImageUploader } from '@shared/components/image-uploader/image-uploader';

export interface MenuItemFormValue {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: MenuItemCategory;
  readonly is_available: boolean;
  readonly image: string;
}

const CATEGORIES: readonly MenuItemCategory[] = [
  'appetizer',
  'main_course',
  'beverage',
  'dessert',
  'other',
];

/**
 * Presentational and mode-agnostic, mirrors `RestaurantForm` exactly:
 * `menuItem` present means edit, absent means create; `image` is not a
 * Reactive Form control (driven by `ImageUploader`, merged in at submit —
 * see `RestaurantForm`'s doc comment for the full reasoning, identical
 * here); control names stay snake_case to match `MenuItemWrite`'s DTO
 * keys for `applyFieldErrors`.
 */
@Component({
  selector: 'app-menu-item-form',
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
  templateUrl: './menu-item-form.html',
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      box-sizing: border-box;
      padding: 2rem;
      background-color: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      box-shadow: var(--app-card-shadow);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .error {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class MenuItemForm {
  private readonly fb = inject(FormBuilder);

  readonly menuItem = input<MenuItem>();
  readonly isPending = input<boolean>(false);
  readonly error = input<ApiError | undefined>(undefined);
  readonly imageUrl = input<string>('');
  readonly isUploadingImage = input<boolean>(false);

  readonly save = output<MenuItemFormValue>();
  readonly cancelled = output<void>();
  readonly imageSelected = output<File>();

  protected readonly categories = CATEGORIES;
  protected readonly categoryLabel = menuItemCategoryLabel;
  protected readonly apiErrorMessage = apiErrorMessage;
  protected readonly fieldErrorMessage = fieldErrorMessage;

  protected readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', Validators.required),
    description: this.fb.nonNullable.control(''),
    price: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
    category: this.fb.nonNullable.control<MenuItemCategory>('main_course'),
    is_available: this.fb.nonNullable.control(true),
  });

  constructor() {
    effect(() => {
      const menuItem = this.menuItem();
      this.form.patchValue({
        name: menuItem?.name ?? '',
        description: menuItem?.description ?? '',
        price: menuItem?.price ?? 0,
        category: menuItem?.category ?? 'main_course',
        is_available: menuItem?.isAvailable ?? true,
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
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit({ ...this.form.getRawValue(), image: this.imageUrl() });
  }
}
