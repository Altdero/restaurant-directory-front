import { Component, computed, inject, signal } from '@angular/core';
import { FAVORITE_DATA } from '@core/interfaces/tokens';
import { FavoritesStore } from '@core/services/favorites/favorites-store';
import { RestaurantGrid } from '@features/restaurants/restaurant-grid/restaurant-grid';
import { PaginatorBar } from '@shared/components/paginator-bar/paginator-bar';

const PAGE_SIZE = 10;

/**
 * `/favorites` is authenticated-only (see `auth.guard.ts`), so
 * `isAuthenticated` is always `true` here — no anonymous branch to render,
 * unlike `RestaurantGrid`'s other two call sites. The displayed page is its
 * own separately-paginated `favorites/` fetch (page size 10, per
 * docs/API.md), distinct from `FavoritesStore.favoritedIds`, which seeds up
 * to 100 ids app-wide just to answer "is this restaurant favorited" for the
 * heart icon elsewhere — see that store's doc comment.
 */
@Component({
  selector: 'app-favorites-page',
  imports: [RestaurantGrid, PaginatorBar],
  templateUrl: './favorites-page.html',
  styles: `
    .favorites-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 75rem;
      margin: 0 auto;
    }
  `,
})
export class FavoritesPage {
  private readonly favoriteData = inject(FAVORITE_DATA);
  private readonly favoritesStore = inject(FavoritesStore);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly page = signal(1);

  private readonly query = computed(() => ({ page: this.page(), pageSize: PAGE_SIZE }));
  protected readonly favorites = this.favoriteData.list(this.query);

  protected readonly restaurants = computed(
    () => this.favorites.value()?.results.map((favorite) => favorite.restaurant) ?? [],
  );
  protected readonly favoritedIds = this.favoritesStore.favoritedIds;

  protected readonly emptyMessage = $localize`:@@favoritesPage.emptyMessage:You haven't added any favorites yet.`;

  protected async onToggleFavorite(restaurantId: string): Promise<void> {
    await this.favoritesStore.toggle(restaurantId);
    this.favorites.reload();
  }
}
