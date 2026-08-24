import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MENU_ITEM_DATA, RESTAURANT_DATA, REVIEW_DATA } from '@core/interfaces/tokens';
import { Review } from '@core/models/review.model';
import { AuthStore } from '@core/services/auth/auth.store';
import { FavoritesStore } from '@core/services/favorites/favorites-store';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { MenuSection } from '@features/restaurants/menu-section/menu-section';
import { ReviewFormValue } from '@features/restaurants/review-form/review-form';
import { RestaurantHero } from '@features/restaurants/restaurant-hero/restaurant-hero';
import { ReviewsSection } from '@features/restaurants/reviews-section/reviews-section';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { ErrorState } from '@shared/components/error-state/error-state';
import { firstValueFrom } from 'rxjs';

/**
 * Menu items are fetched with `limit: 100` — a full menu in one request,
 * not paginated UI. Restaurant menus are small in practice, and PLAN.md's
 * commit 12 scope is display only; menu-item pagination controls aren't
 * part of it.
 */
const MENU_ITEM_LIMIT = 100;

@Component({
  selector: 'app-restaurant-detail-page',
  imports: [RestaurantHero, MenuSection, ReviewsSection, ErrorState],
  templateUrl: './restaurant-detail-page.html',
  styles: `
    .restaurant-detail-page {
      max-width: 60rem;
      margin: 0 auto;
      padding: 1.5rem;
    }
  `,
})
export class RestaurantDetailPage {
  private readonly restaurantData = inject(RESTAURANT_DATA);
  private readonly menuItemData = inject(MENU_ITEM_DATA);
  private readonly reviewData = inject(REVIEW_DATA);
  private readonly authStore = inject(AuthStore);
  private readonly favoritesStore = inject(FavoritesStore);
  private readonly dialog = inject(MatDialog);

  readonly id = input<string>();

  protected readonly restaurant = this.restaurantData.byId(this.id);
  protected readonly menuItems = this.menuItemData.list(
    computed(() => ({ restaurantId: this.id(), limit: MENU_ITEM_LIMIT })),
  );
  private readonly reviewsQuery = computed(() => ({ restaurantId: this.id() }));
  private readonly reviewsResource = this.reviewData.list(this.reviewsQuery);

  private readonly loadedReviews = signal<readonly Review[]>([]);
  private readonly nextReviewsUrl = signal<string | null>(null);
  protected readonly isLoadingMoreReviews = signal(false);

  protected readonly reviews = this.loadedReviews.asReadonly();
  protected readonly hasMoreReviews = computed(() => this.nextReviewsUrl() !== null);
  /** Not the raw resource's `isLoading` — once a first page has loaded, a "load more" in flight shouldn't re-trigger the section's full loading state. */
  protected readonly reviewsIsLoading = computed(
    () => this.reviewsResource.isLoading() && this.loadedReviews().length === 0,
  );
  protected readonly reviewsError = this.reviewsResource.error;

  protected readonly apiErrorMessage = apiErrorMessage;

  private readonly createReviewMutation = this.reviewData.create();
  private readonly updateReviewMutation = this.reviewData.update();
  private readonly removeReviewMutation = this.reviewData.remove();

  protected readonly isAuthenticated = this.authStore.isAuthenticated;
  protected readonly isFavorited = computed(() => {
    const restaurant = this.restaurant.value();
    return restaurant ? this.favoritesStore.favoritedIds().has(restaurant.id) : false;
  });
  protected readonly myReview = computed(() => {
    const userId = this.authStore.user()?.id;
    return userId ? this.reviews().find((review) => review.userId === userId) : undefined;
  });
  protected readonly loginReturnUrl = computed(() => `/restaurants/${this.id()}`);
  protected readonly isReviewFormOpen = signal(false);
  protected readonly reviewFormPending = computed(
    () => this.createReviewMutation.isPending() || this.updateReviewMutation.isPending(),
  );
  protected readonly reviewFormError = computed(
    () => this.createReviewMutation.error() ?? this.updateReviewMutation.error(),
  );

  constructor() {
    effect(() => {
      const page = this.reviewsResource.value();
      if (page) {
        this.loadedReviews.set(page.results);
        this.nextReviewsUrl.set(page.next);
      }
    });
  }

  protected toggleFavorite(): void {
    const restaurant = this.restaurant.value();
    if (restaurant) {
      void this.favoritesStore.toggle(restaurant.id);
    }
  }

  protected async loadMoreReviews(): Promise<void> {
    const url = this.nextReviewsUrl();
    if (!url) {
      return;
    }
    this.isLoadingMoreReviews.set(true);
    try {
      const page = await this.reviewData.loadMore(url);
      this.loadedReviews.update((current) => [...current, ...page.results]);
      this.nextReviewsUrl.set(page.next);
    } finally {
      this.isLoadingMoreReviews.set(false);
    }
  }

  protected async submitReview(value: ReviewFormValue): Promise<void> {
    const restaurantId = this.id();
    if (!restaurantId) {
      return;
    }
    const existing = this.myReview();
    try {
      if (existing) {
        await this.updateReviewMutation.mutate({ id: existing.id, body: value });
      } else {
        await this.createReviewMutation.mutate({ restaurant: restaurantId, ...value });
      }
    } catch {
      return;
    }
    this.isReviewFormOpen.set(false);
    this.reviewsResource.reload();
  }

  protected async confirmDeleteReview(): Promise<void> {
    const existing = this.myReview();
    if (!existing) {
      return;
    }
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: $localize`:@@restaurantDetailPage.deleteReviewTitle:Delete your review?`,
        message: $localize`:@@restaurantDetailPage.deleteReviewMessage:This can't be undone.`,
      },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) {
      return;
    }
    try {
      await this.removeReviewMutation.mutate(existing.id);
    } catch {
      return;
    }
    this.reviewsResource.reload();
  }
}
