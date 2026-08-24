import { Component, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Restaurant } from '@core/models/restaurant.model';
import { CategoryChips } from '@shared/components/category-chips/category-chips';
import { FavoriteButton } from '@shared/components/favorite-button/favorite-button';
import { PriceRangeBadge } from '@shared/components/price-range-badge/price-range-badge';
import { RatingStars } from '@shared/components/rating-stars/rating-stars';

@Component({
  selector: 'app-restaurant-card',
  imports: [
    NgOptimizedImage,
    RouterLink,
    RatingStars,
    PriceRangeBadge,
    CategoryChips,
    FavoriteButton,
  ],
  templateUrl: './restaurant-card.html',
  styles: `
    .restaurant-card {
      border-radius: var(--mat-sys-corner-medium);
      overflow: hidden;
      background-color: var(--mat-sys-surface-container-low);
    }

    .card-link {
      display: block;
      color: inherit;
      text-decoration: none;
    }

    .cover-wrap {
      position: relative;
    }

    .heart-overlay {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }

    .cover {
      display: block;
      width: 100%;
      height: 10rem;
      object-fit: cover;
    }

    .cover.placeholder {
      background-color: var(--mat-sys-surface-container-high);
    }

    .body {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    h3 {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }

    .location {
      margin: 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .review-count {
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class RestaurantCard {
  readonly restaurant = input.required<Restaurant>();
  readonly isFavorited = input<boolean>(false);
  readonly isAuthenticated = input<boolean>(false);
  readonly loginReturnUrl = input<string>('/');

  readonly toggleFavorite = output<void>();
}
