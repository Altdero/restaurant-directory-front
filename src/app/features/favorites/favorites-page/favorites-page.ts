import { Component, computed, inject, signal } from '@angular/core';
import { FAVORITE_DATA } from '@core/interfaces/tokens';
import { FavoritesStore } from '@core/services/favorites/favorites-store';
import { RestaurantGrid } from '@features/restaurants/restaurant-grid/restaurant-grid';
import { PaginatorBar } from '@shared/components/paginator-bar/paginator-bar';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

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
  imports: [RestaurantGrid, PaginatorBar, MatButton, RouterLink],
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

    h1 {
      font-size: 2.375rem;
      margin: 0;
    }

    .no-favorites {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
      justify-content: center;
      margin: 0 auto;

      .favorites-icon {
        width: 64px;
        height: 64px;
        border-radius: 999px;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-primary);
        font-size: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      h2 {
        margin: 0;
        font-weight: 600;
        font-size: 1.75rem;
      }

      p {
        margin: 0;
        color: var(--mat-sys-on-surface-variant);
      }
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

  /**
   * `resource.value()` re-throws the underlying error once a resource has
   * failed (Angular's own documented `WritableResource` behavior) — this
   * guards on `.error()` first, same fix as `RestaurantListPage`, so a
   * failed fetch never throws mid-render and silently blanks the page.
   */
  private readonly favoritesPage = computed(() =>
    this.favorites.error() ? undefined : this.favorites.value(),
  );
  protected readonly restaurants = computed(
    () => this.favoritesPage()?.results.map((favorite) => favorite.restaurant) ?? [],
  );
  protected readonly favoritesCount = computed(() => this.favoritesPage()?.count ?? 0);
  protected readonly favoritedIds = this.favoritesStore.favoritedIds;

  protected async onToggleFavorite(restaurantId: string): Promise<void> {
    await this.favoritesStore.toggle(restaurantId);
    this.favorites.reload();
  }
}
