import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { Restaurant } from '@core/models/restaurant.model';
import { CategoryChips } from '@shared/components/category-chips/category-chips';
import { FavoriteButton } from '@shared/components/favorite-button/favorite-button';
import { OpeningHoursTable } from '@shared/components/opening-hours-table/opening-hours-table';
import { PriceRangeBadge } from '@shared/components/price-range-badge/price-range-badge';
import { RatingStars } from '@shared/components/rating-stars/rating-stars';

const MAPS_SEARCH_URL = 'https://www.google.com/maps/search/?api=1&query=';

/**
 * No embedded map (see PLAN.md's "Maps" resolved decision) — a deep link
 * to Google Maps instead. Coordinates are `null` for every restaurant in
 * the live API today, so the address-fallback branch is what actually
 * renders right now; the coordinate branch is groundwork for when the
 * backend starts populating `latitude`/`longitude`.
 */
@Component({
  selector: 'app-restaurant-hero',
  imports: [
    NgOptimizedImage,
    CategoryChips,
    RatingStars,
    PriceRangeBadge,
    OpeningHoursTable,
    FavoriteButton,
  ],
  templateUrl: './restaurant-hero.html',
  styles: `
    .cover {
      display: block;
      width: 100%;
      height: 16rem;
      object-fit: cover;
      border-radius: var(--mat-sys-corner-medium);
    }

    .cover.placeholder {
      background-color: var(--mat-sys-surface-container-high);
    }

    h1 {
      margin: 1rem 0 0;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }

    .details {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      margin-top: 1rem;
    }

    address {
      font-style: normal;
    }
  `,
})
export class RestaurantHero {
  readonly restaurant = input.required<Restaurant>();
  readonly isFavorited = input<boolean>(false);
  readonly isAuthenticated = input<boolean>(false);
  readonly loginReturnUrl = input<string>('/');

  readonly toggleFavorite = output<void>();

  protected readonly mapsUrl = computed(() => {
    const restaurant = this.restaurant();
    if (restaurant.latitude !== null && restaurant.longitude !== null) {
      return `${MAPS_SEARCH_URL}${restaurant.latitude},${restaurant.longitude}`;
    }
    const fullAddress = [restaurant.address, restaurant.city, restaurant.state, restaurant.country]
      .filter(Boolean)
      .join(', ');
    return `${MAPS_SEARCH_URL}${encodeURIComponent(fullAddress)}`;
  });
}
