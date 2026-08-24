import { Service, computed, effect, inject, signal } from '@angular/core';
import { FavoriteQuery } from '@core/interfaces/favorite-data.service';
import { FAVORITE_DATA } from '@core/interfaces/tokens';
import { AuthStore } from '@core/services/auth/auth.store';
import { NotificationService } from '@core/services/notification/notification.service';

/**
 * "Effectively all" a user's favorites in one request, same reasoning as
 * `RestaurantListPage`'s category-dropdown fetch: unlikely to have hundreds
 * of favorites for a portfolio-scale app, and this only needs restaurant
 * ids, not a paginated UI (`FavoritesPage` does its own separately-paginated
 * fetch for display — see docs/ARCHITECTURE.md).
 */
const FAVORITES_SEED_PAGE_SIZE = 100;

/**
 * `signal<Set<string>>` of favorited restaurant ids, shared app-wide so a
 * heart icon on `/restaurants`, `/restaurants/:id` and `/favorites` all
 * agree on the same state (see PLAN.md § State management). `toggle()` is
 * optimistic: flips the id immediately, reconciles with the server's
 * authoritative `{ favorited }` response on success, and rolls back on
 * failure — the exact contract PLAN.md's testing-strategy section commits
 * to ("signal transitions, computed correctness, optimistic rollback").
 *
 * The seed fetch can *never* fire for an anonymous visitor — `/favorites/`
 * requires auth, and firing it anyway would trip `error.interceptor.ts`'s
 * 401-retry-once path, which ends in a forced redirect to `/login` for a
 * visitor who was just browsing a public page. Gated the same way
 * `RestaurantDataService.byId` gates on an undefined id: `seedQuery` is
 * `undefined` while logged out, and `FavoriteDataService.list()` treats an
 * `undefined` query as "don't fetch" (see that interface's doc comment).
 * The resource itself is created once, directly in the constructor (an
 * ordinary injection context) — nesting a second `effect()` inside the one
 * below to recreate the resource on every auth change would throw NG0602
 * ("effect() cannot be called from within a reactive context").
 */
@Service()
export class FavoritesStore {
  private readonly favoriteData = inject(FAVORITE_DATA);
  private readonly authStore = inject(AuthStore);
  private readonly notifications = inject(NotificationService);

  private readonly ids = signal<ReadonlySet<string>>(new Set());
  readonly favoritedIds = this.ids.asReadonly();

  private readonly toggleMutation = this.favoriteData.toggle();

  private readonly seedQuery = computed<FavoriteQuery | undefined>(() =>
    this.authStore.isAuthenticated() ? { pageSize: FAVORITES_SEED_PAGE_SIZE } : undefined,
  );
  private readonly seedResource = this.favoriteData.list(this.seedQuery);

  constructor() {
    effect(() => {
      if (!this.authStore.isAuthenticated()) {
        this.ids.set(new Set());
        return;
      }
      const page = this.seedResource.value();
      if (page) {
        this.ids.set(new Set(page.results.map((favorite) => favorite.restaurant.id)));
      }
    });
  }

  async toggle(restaurantId: string): Promise<void> {
    const wasFavorited = this.ids().has(restaurantId);
    this.setFavorited(restaurantId, !wasFavorited);
    try {
      const result = await this.toggleMutation.mutate(restaurantId);
      this.setFavorited(restaurantId, result.favorited);
    } catch {
      this.setFavorited(restaurantId, wasFavorited);
      this.notifications.error(
        $localize`:@@favoritesStore.toggleError:Couldn't update your favorites. Please try again.`,
      );
    }
  }

  private setFavorited(restaurantId: string, favorited: boolean): void {
    this.ids.update((current) => {
      const next = new Set(current);
      if (favorited) {
        next.add(restaurantId);
      } else {
        next.delete(restaurantId);
      }
      return next;
    });
  }
}
