import { Component, computed, inject, signal } from '@angular/core';
import { ApiError } from '@core/models/api-error.model';
import { AuthStore } from '@core/services/auth/auth.store';
import { CloudinaryUploadService } from '@core/services/upload/cloudinary-upload.service';
import { ProfileForm, ProfileFormValue } from '@features/profile/profile-form/profile-form';

/**
 * `/profile` — owns `AuthStore` directly (already the single source of truth
 * for the current user, no resource/token needed) and the Cloudinary upload,
 * same `uploadedAvatar`/`isUploadingImage` pattern as `RestaurantFormPage`'s
 * `uploadedCoverImage`. Stays on the page after a successful save — the form
 * just reflects the now-updated `user()`.
 */
@Component({
  selector: 'app-profile-page',
  imports: [ProfileForm],
  templateUrl: './profile-page.html',
  styles: `
    .profile-page {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      max-width: 34rem;
      margin: 0 auto;
      padding: 1.5rem;
    }

    h1 {
      font-size: 2.375rem;
      margin: 0;
    }

    .subtitle {
      margin: 0 0 1.25rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class ProfilePage {
  private readonly authStore = inject(AuthStore);
  private readonly uploadService = inject(CloudinaryUploadService);

  protected readonly user = this.authStore.user;

  private readonly uploadedAvatar = signal<string | undefined>(undefined);
  protected readonly avatarUrl = computed(() => this.uploadedAvatar() ?? this.user()?.avatar ?? '');
  protected readonly isUploadingImage = signal(false);

  protected readonly isPending = signal(false);
  protected readonly formError = signal<ApiError | undefined>(undefined);

  protected async onImageSelected(file: File): Promise<void> {
    this.isUploadingImage.set(true);
    try {
      this.uploadedAvatar.set(await this.uploadService.upload(file, 'avatars'));
    } finally {
      this.isUploadingImage.set(false);
    }
  }

  protected async submit(value: ProfileFormValue): Promise<void> {
    this.formError.set(undefined);
    this.isPending.set(true);
    try {
      await this.authStore.updateProfile(value);
    } catch (error) {
      this.formError.set(error as ApiError);
    } finally {
      this.isPending.set(false);
    }
  }
}
