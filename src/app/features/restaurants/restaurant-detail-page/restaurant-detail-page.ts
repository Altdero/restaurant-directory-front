import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MENU_ITEM_DATA, RESTAURANT_DATA, REVIEW_DATA } from '@core/interfaces/tokens';
import { Review } from '@core/models/review.model';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { MenuSection } from '@features/restaurants/menu-section/menu-section';
import { RestaurantHero } from '@features/restaurants/restaurant-hero/restaurant-hero';
import { ReviewsSection } from '@features/restaurants/reviews-section/reviews-section';
import { ErrorState } from '@shared/components/error-state/error-state';

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

  constructor() {
    effect(() => {
      const page = this.reviewsResource.value();
      if (page) {
        this.loadedReviews.set(page.results);
        this.nextReviewsUrl.set(page.next);
      }
    });
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
}
