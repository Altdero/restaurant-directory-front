import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CATEGORY_DATA, RESTAURANT_DATA } from '@core/interfaces/tokens';
import { PriceRange } from '@core/models/restaurant.model';
import { AuthStore } from '@core/services/auth/auth.store';
import { FavoritesStore } from '@core/services/favorites/favorites-store';
import {
  RestaurantFilters,
  RestaurantFiltersValue,
} from '@features/restaurants/restaurant-filters/restaurant-filters';
import { RestaurantGrid } from '@features/restaurants/restaurant-grid/restaurant-grid';
import { PaginatorBar } from '@shared/components/paginator-bar/paginator-bar';

const PAGE_SIZE = 12;

function toOptionalNumber(value: unknown): number | undefined {
  return value === undefined || value === '' ? undefined : numberAttribute(value);
}

function toPage(value: unknown): number {
  return numberAttribute(value, 1);
}

/**
 * Filters and pagination live in the URL's query params, not local
 * component state — bound via `withComponentInputBinding()` (`app.config.ts`)
 * rather than manually subscribing to `ActivatedRoute.queryParams`. This is
 * what makes `/restaurants` (`RenderMode.Server`) actually meaningful: each
 * filter combination is its own crawlable, server-rendered URL, not a
 * client-only view of shared state.
 */
@Component({
  selector: 'app-restaurant-list-page',
  imports: [RestaurantFilters, RestaurantGrid, PaginatorBar],
  templateUrl: './restaurant-list-page.html',
  styles: `
    .restaurant-list-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 75rem;
      margin: 0 auto;
    }
  `,
})
export class RestaurantListPage {
  private readonly restaurantData = inject(RESTAURANT_DATA);
  private readonly categoryData = inject(CATEGORY_DATA);
  private readonly authStore = inject(AuthStore);
  private readonly favoritesStore = inject(FavoritesStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly category = input<string>();
  readonly city = input<string>();
  readonly priceRange = input<PriceRange>();
  readonly minRating = input<number | undefined>(undefined, { transform: toOptionalNumber });
  readonly search = input<string>();
  readonly page = input<number>(1, { transform: toPage });

  protected readonly pageSize = PAGE_SIZE;

  private readonly query = computed(() => ({
    category: this.category(),
    city: this.city(),
    priceRange: this.priceRange(),
    minRating: this.minRating(),
    search: this.search(),
    page: this.page(),
  }));

  protected readonly restaurants = this.restaurantData.list(this.query);
  protected readonly categories = this.categoryData.list(signal({ pageSize: 100 }));

  protected readonly isAuthenticated = this.authStore.isAuthenticated;
  protected readonly favoritedIds = this.favoritesStore.favoritedIds;
  protected readonly loginReturnUrl = '/restaurants';

  protected toggleFavorite(restaurantId: string): void {
    void this.favoritesStore.toggle(restaurantId);
  }

  protected onFiltersChange(filters: RestaurantFiltersValue): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...filters, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected onPageChange(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
}
