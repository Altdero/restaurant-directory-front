import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { RESTAURANT_DATA } from '@core/interfaces/tokens';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PaginatorBar } from '@shared/components/paginator-bar/paginator-bar';
import { PriceRangeBadge } from '@shared/components/price-range-badge/price-range-badge';
import { RatingStars } from '@shared/components/rating-stars/rating-stars';
import { SkeletonCard } from '@shared/components/skeleton-card/skeleton-card';
import { firstValueFrom } from 'rxjs';

const PAGE_SIZE = 12;
const SKELETON_COUNT = [0, 1, 2, 3, 4, 5];

/**
 * `restaurants/my/` — the owned-restaurants list, distinct from the public
 * `list()` `RestaurantListPage` uses. No filters, matching PLAN.md commit
 * 15's scope (an owner's own list is expected to be small).
 *
 * Loading/error/empty branching and the delete-via-`ConfirmDialog` flow
 * mirror already-proven patterns (`RestaurantListPage`,
 * `RestaurantDetailPage`'s review-delete) rather than reusing
 * `RestaurantGrid`/`RestaurantCard` — those are hard-wired to the public
 * favorite-toggle flow with no slot for Edit/Delete actions.
 */
@Component({
  selector: 'app-my-restaurants-page',
  imports: [
    NgOptimizedImage,
    RouterLink,
    MatButtonModule,
    ErrorState,
    EmptyState,
    SkeletonCard,
    PaginatorBar,
    PriceRangeBadge,
    RatingStars,
  ],
  templateUrl: './my-restaurants-page.html',
  styles: `
    .my-restaurants-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 60rem;
      margin: 0 auto;
    }

    h1 {
      font-size: 2.375rem;
      margin: 0;
    }

    .header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    .list {
      background-color: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      box-shadow: var(--app-card-shadow);
      overflow: hidden;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.125rem 1.375rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .row:last-child {
      border-bottom: none;
    }

    .thumb {
      flex: none;
      width: 4.5rem;
      height: 3.5rem;
      border-radius: var(--mat-sys-corner-small);
      object-fit: cover;
    }

    .thumb.placeholder {
      background-color: var(--mat-sys-surface-container-high);
    }

    .info {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .info .name {
      font-weight: 600;
    }

    .info .city {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .status {
      height: 1.625rem;
      padding: 0 0.75rem;
      display: flex;
      align-items: center;
      border-radius: var(--mat-sys-corner-full);
      background-color: var(--app-chip-teal-bg);
      color: var(--app-chip-teal-fg);
      font: var(--mat-sys-label-medium);
    }

    .status.inactive {
      background-color: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pill {
      border-radius: var(--mat-sys-corner-full);
    }

    .danger {
      border: 1px solid var(--mat-sys-error);
      color: var(--mat-sys-error);
    }
  `,
})
export class MyRestaurantsPage {
  private readonly restaurantData = inject(RESTAURANT_DATA);
  private readonly dialog = inject(MatDialog);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly skeletons = SKELETON_COUNT;
  protected readonly page = signal(1);

  private readonly query = computed(() => ({ page: this.page(), pageSize: PAGE_SIZE }));
  protected readonly restaurants = this.restaurantData.mine(this.query);
  /**
   * `resource.value()` re-throws once a resource has failed — guarding on
   * `.error()` first, same fix as `RestaurantListPage`/`FavoritesPage`.
   */
  protected readonly restaurantsPage = computed(() =>
    this.restaurants.error() ? undefined : this.restaurants.value(),
  );

  private readonly removeMutation = this.restaurantData.remove();

  protected readonly apiErrorMessage = apiErrorMessage;
  protected readonly emptyMessage = $localize`:@@myRestaurantsPage.emptyMessage:You haven't added any restaurants yet.`;
  protected readonly deleteLabel = $localize`:@@myRestaurantsPage.delete:Delete`;

  protected async deleteRestaurant(id: string, name: string): Promise<void> {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: $localize`:@@myRestaurantsPage.deleteTitle:Delete ${name}:name:?`,
        message: $localize`:@@myRestaurantsPage.deleteMessage:This can't be undone.`,
      },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) {
      return;
    }
    try {
      await this.removeMutation.mutate(id);
    } catch {
      return;
    }
    this.restaurants.reload();
  }
}
