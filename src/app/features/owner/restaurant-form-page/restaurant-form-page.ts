import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CATEGORY_DATA, RESTAURANT_DATA } from '@core/interfaces/tokens';
import { ApiError } from '@core/models/api-error.model';
import { RestaurantWrite } from '@core/models/restaurant.model';
import { CloudinaryUploadService } from '@core/services/upload/cloudinary-upload.service';
import { apiErrorMessage } from '@core/utils/api-error-message';
import {
  RestaurantForm,
  RestaurantFormValue,
} from '@features/owner/restaurant-form/restaurant-form';
import { ErrorState } from '@shared/components/error-state/error-state';

/**
 * Handles both `/my/restaurants/new` and `/my/restaurants/:id/edit` — `id`
 * present means edit, absent means create, same split `RestaurantForm`
 * itself uses for its `restaurant` input.
 *
 * **Owns the actual Cloudinary upload** — `RestaurantForm` only re-emits
 * the selected `File` (never performs HTTP itself). `uploadedCoverImage`
 * holds the result once `CloudinaryUploadService.upload()` resolves;
 * `coverImageUrl` falls back to the loaded restaurant's existing image
 * when nothing new has been uploaded yet, so the form always has a
 * correct current value to round-trip.
 *
 * **Create vs. edit request-body asymmetry — simpler than commit 15 left
 * it.** `cover_image` used to be omitted from the `update()` `Partial`
 * body because the form had no way to *preserve* the existing value —
 * sending it risked wiping it with an empty default. Now that the form
 * faithfully round-trips the current value via `coverImageUrl` above,
 * `cover_image` is safe to include in both create and update bodies
 * unconditionally, same as every other field. `opening_hours`/`latitude`/
 * `longitude` still have no form control (no established schedule-editor
 * pattern yet, no map — see PLAN.md commit 15's scope decisions) and stay
 * omitted from the update body for the same reason `cover_image` used to
 * be.
 */
@Component({
  selector: 'app-restaurant-form-page',
  imports: [RestaurantForm, ErrorState],
  templateUrl: './restaurant-form-page.html',
  styles: `
    .restaurant-form-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-width: 40rem;
      margin: 0 auto;
      padding: 1.5rem;
    }

    h1 {
      font-size: 2.375rem;
      margin: 0;
    }
  `,
})
export class RestaurantFormPage {
  private readonly restaurantData = inject(RESTAURANT_DATA);
  private readonly categoryData = inject(CATEGORY_DATA);
  private readonly uploadService = inject(CloudinaryUploadService);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly restaurant = this.restaurantData.byId(this.id);
  /**
   * `resource.value()` re-throws the underlying error once a resource has
   * failed — reading it directly in the template would throw mid-render
   * the moment editing a restaurant fails to load. Same fix as
   * `RestaurantListPage`/`FavoritesPage`/`RestaurantDetailPage`.
   */
  protected readonly restaurantValue = computed(() =>
    this.restaurant.error() ? undefined : this.restaurant.value(),
  );
  protected readonly categories = this.categoryData.list(signal({ pageSize: 100 }));
  protected readonly categoriesPage = computed(() =>
    this.categories.error() ? undefined : this.categories.value(),
  );

  private readonly createMutation = this.restaurantData.create();
  private readonly updateMutation = this.restaurantData.update();

  protected readonly isPending = computed(
    () => this.createMutation.isPending() || this.updateMutation.isPending(),
  );
  protected readonly formError = signal<ApiError | undefined>(undefined);
  protected readonly apiErrorMessage = apiErrorMessage;

  private readonly uploadedCoverImage = signal<string | undefined>(undefined);
  protected readonly coverImageUrl = computed(
    () => this.uploadedCoverImage() ?? this.restaurantValue()?.coverImage ?? '',
  );
  protected readonly isUploadingImage = signal(false);

  protected async onImageSelected(file: File): Promise<void> {
    this.isUploadingImage.set(true);
    try {
      this.uploadedCoverImage.set(await this.uploadService.upload(file, 'restaurants'));
    } finally {
      this.isUploadingImage.set(false);
    }
  }

  protected async submit(value: RestaurantFormValue): Promise<void> {
    this.formError.set(undefined);
    try {
      if (this.id()) {
        await this.updateMutation.mutate({ id: this.id()!, body: value });
      } else {
        const body: RestaurantWrite = {
          ...value,
          opening_hours: {},
          latitude: null,
          longitude: null,
        };
        await this.createMutation.mutate(body);
      }
    } catch (error) {
      this.formError.set(error as ApiError);
      return;
    }
    void this.router.navigateByUrl('/my/restaurants');
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/my/restaurants');
  }
}
