import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiError } from '@core/models/api-error.model';
import { UserProfile } from '@core/models/user-profile.model';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { applyFieldErrors } from '@core/utils/apply-field-errors';
import { fieldErrorMessage } from '@core/utils/field-error-message';
import { ImageUploader } from '@shared/components/image-uploader/image-uploader';

export interface ProfileFormValue {
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly phone: string;
  readonly avatar: string;
}

/**
 * Presentational, same split as `RestaurantForm`/`MenuItemForm`: control names
 * stay snake_case to match `UserProfileUpdate`'s DTO keys exactly, for
 * `applyFieldErrors`. `username`/`role`/`dateJoined` are read-only on this
 * endpoint (see `docs/API.md`) and are rendered as plain text, never controls.
 *
 * `avatar` is **not** a Reactive Form control — nothing to type into, driven
 * entirely by `ImageUploader`, same `avatarUrl`/`isUploadingImage` input pair
 * and `imageSelected` re-emit as `RestaurantForm`'s `cover_image`. This
 * component never performs HTTP itself.
 */
@Component({
  selector: 'app-profile-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ImageUploader,
  ],
  templateUrl: './profile-form.html',
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 24rem;
    }

    .read-only {
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
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
export class ProfileForm {
  private readonly fb = inject(FormBuilder);

  readonly user = input<UserProfile>();
  readonly isPending = input<boolean>(false);
  readonly error = input<ApiError | undefined>(undefined);
  readonly avatarUrl = input<string>('');
  readonly isUploadingImage = input<boolean>(false);

  readonly save = output<ProfileFormValue>();
  readonly imageSelected = output<File>();

  protected readonly apiErrorMessage = apiErrorMessage;
  protected readonly fieldErrorMessage = fieldErrorMessage;

  protected readonly form = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    first_name: this.fb.nonNullable.control(''),
    last_name: this.fb.nonNullable.control(''),
    phone: this.fb.nonNullable.control(''),
  });

  constructor() {
    effect(() => {
      const user = this.user();
      this.form.patchValue({
        email: user?.email ?? '',
        first_name: user?.firstName ?? '',
        last_name: user?.lastName ?? '',
        phone: user?.phone ?? '',
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
    this.save.emit({ ...this.form.getRawValue(), avatar: this.avatarUrl() });
  }
}
