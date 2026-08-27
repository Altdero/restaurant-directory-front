import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { RESTAURANT_DATA } from '@core/interfaces/tokens';
import { AuthStore } from '@core/services/auth/auth.store';
import { FavoritesStore } from '@core/services/favorites/favorites-store';
import { SeoService } from '@core/services/seo/seo.service';
import { RestaurantGrid } from '@features/restaurants/restaurant-grid/restaurant-grid';

const PREVIEW_PAGE_SIZE = 6;

/**
 * `/` — `RenderMode.Prerender` (see `app.routes.server.ts`): the hero above
 * is pure static marketing content, baked into the build once. The
 * restaurant preview below is genuinely live data, fetched client-side
 * after load like every other resource-consuming page — a prerendered page
 * has no per-request backend to call. No invented sort ("popular",
 * "top-rated") — `docs/API.md`'s `restaurants/` query params don't support
 * one, so this is honestly just the first page, default order.
 *
 * SEO is set once in the constructor, not an `effect()` — unlike every
 * other SEO-emitting page, nothing here ever changes after construction
 * (no filters, no async-loaded entity the title depends on), so there's
 * nothing to react to.
 */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MatButtonModule, RestaurantGrid],
  templateUrl: './home-page.html',
  styles: `
    .home-page {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      padding: 1.5rem;
      max-width: 75rem;
      margin: 0 auto;
    }

    .hero {
      text-align: center;
      padding: 5rem 1rem 4rem;
    }

    .hero h1 {
      font-family: 'Fraunces Variable', serif;
      font-size: 2.75rem;
      line-height: 1.05;
      letter-spacing: -0.02em;
      max-width: 40rem;
      margin: 0 auto 0.75rem;
    }

    .hero p {
      max-width: 36rem;
      margin: 0 auto 1.5rem;
      font-size: 1.125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .preview {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .see-all {
      align-self: center;
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface-variant);
      text-decoration: none;
    }

    .see-all:hover {
      color: var(--mat-sys-primary);
    }
  `,
})
export class HomePage {
  private readonly restaurantData = inject(RESTAURANT_DATA);
  private readonly authStore = inject(AuthStore);
  private readonly favoritesStore = inject(FavoritesStore);
  private readonly seoService = inject(SeoService);

  private readonly previewQuery = signal({ pageSize: PREVIEW_PAGE_SIZE });
  protected readonly preview = this.restaurantData.list(this.previewQuery);
  /**
   * `resource.value()` re-throws the underlying error once a resource has
   * failed — same guard as every other resource-consuming page.
   */
  protected readonly restaurants = computed(() =>
    this.preview.error() ? [] : (this.preview.value()?.results ?? []),
  );

  protected readonly isAuthenticated = this.authStore.isAuthenticated;
  protected readonly favoritedIds = this.favoritesStore.favoritedIds;
  protected readonly loginReturnUrl = '/';

  constructor() {
    this.seoService.updatePage({
      title: $localize`:@@homePage.metaTitle:Restaurant Directory — Find your next favorite restaurant`,
      description: $localize`:@@homePage.metaDescription:Browse restaurants by category, city, price and rating. Read reviews, check menus and save your favorites.`,
    });
  }

  protected toggleFavorite(restaurantId: string): void {
    void this.favoritesStore.toggle(restaurantId);
  }
}
