import { Component, input, output } from '@angular/core';
import { ApiError } from '@core/models/api-error.model';
import { Restaurant } from '@core/models/restaurant.model';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { RestaurantCard } from '@shared/components/restaurant-card/restaurant-card';
import { SkeletonCard } from '@shared/components/skeleton-card/skeleton-card';

const SKELETON_COUNT = [0, 1, 2, 3, 4, 5];

/** Picks loading / error / empty / results — the one real decision `RestaurantListPage` delegates here. */
@Component({
  selector: 'app-restaurant-grid',
  imports: [RestaurantCard, SkeletonCard, EmptyState, ErrorState],
  template: `
    @if (error(); as apiError) {
      <app-error-state [message]="errorMessage(apiError)" (retry)="retry.emit()" />
    } @else if (isLoading()) {
      <div class="grid">
        @for (i of skeletons; track i) {
          <app-skeleton-card />
        }
      </div>
    } @else if (restaurants().length === 0) {
      <app-empty-state [message]="resolvedEmptyMessage()" />
    } @else {
      <div class="grid">
        @for (restaurant of restaurants(); track restaurant.id) {
          <app-restaurant-card
            [restaurant]="restaurant"
            [isFavorited]="favoritedIds().has(restaurant.id)"
            [isAuthenticated]="isAuthenticated()"
            [loginReturnUrl]="loginReturnUrl()"
            (toggleFavorite)="toggleFavorite.emit(restaurant.id)"
          />
        }
      </div>
    }
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      gap: 1rem;
    }
  `,
})
export class RestaurantGrid {
  readonly restaurants = input.required<readonly Restaurant[]>();
  readonly isLoading = input.required<boolean>();
  readonly error = input<ApiError | undefined>(undefined);
  readonly favoritedIds = input<ReadonlySet<string>>(new Set());
  readonly isAuthenticated = input<boolean>(false);
  readonly loginReturnUrl = input<string>('/');
  /** Overrides the default empty-state message — e.g. `FavoritesPage`'s "no favorites yet" copy. */
  readonly emptyMessage = input<string>();

  readonly retry = output<void>();
  readonly toggleFavorite = output<string>();

  protected readonly skeletons = SKELETON_COUNT;

  protected resolvedEmptyMessage(): string {
    return (
      this.emptyMessage() ??
      $localize`:@@restaurantGrid.emptyMessage:No restaurants match your filters.`
    );
  }

  protected errorMessage(error: ApiError): string {
    return error.type === 'detail'
      ? error.message
      : $localize`:@@restaurantGrid.errorMessage:Couldn't load restaurants. Please try again.`;
  }
}
