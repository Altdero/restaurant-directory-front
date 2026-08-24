import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CATEGORY_DATA, RESTAURANT_DATA } from '@core/interfaces/tokens';
import { ApiError } from '@core/models/api-error.model';
import { RestaurantWrite } from '@core/models/restaurant.model';
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
 * **Create vs. edit request-body asymmetry — the one subtlety in this
 * component.** `create()` takes a full `RestaurantWrite`, so a new
 * restaurant gets `cover_image: ''`/`opening_hours: {}`/`latitude`/
 * `longitude: null` — valid empty defaults for fields this commit doesn't
 * expose a form control for (Cloudinary upload is commit 16; an
 * opening-hours editor has no established pattern yet — see PLAN.md commit
 * 15's scope decisions). `update()` takes a `Partial<RestaurantWrite>`, so
 * the edit path sends the form value *alone*, with none of those four keys
 * — omitting them means the backend leaves the restaurant's existing
 * values untouched on PATCH, rather than a blank form silently wiping a
 * cover image or schedule the owner already set through some other path.
 */
@Component({
  selector: 'app-restaurant-form-page',
  imports: [RestaurantForm, ErrorState],
  templateUrl: './restaurant-form-page.html',
  styles: `
    .restaurant-form-page {
      max-width: 40rem;
      margin: 0 auto;
      padding: 1.5rem;
    }
  `,
})
export class RestaurantFormPage {
  private readonly restaurantData = inject(RESTAURANT_DATA);
  private readonly categoryData = inject(CATEGORY_DATA);
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

  protected async submit(value: RestaurantFormValue): Promise<void> {
    this.formError.set(undefined);
    try {
      if (this.id()) {
        await this.updateMutation.mutate({ id: this.id()!, body: value });
      } else {
        const body: RestaurantWrite = {
          ...value,
          cover_image: '',
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
