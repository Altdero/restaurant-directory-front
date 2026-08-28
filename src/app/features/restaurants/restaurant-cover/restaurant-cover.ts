import { Component, input, output } from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { FavoriteButton } from '@shared/components/favorite-button/favorite-button';
import { Restaurant } from '@core/models/restaurant.model';

/**
 * The image-overlay hero (commit 30, PLAN.md § Option A visual restyle)
 * renders rating/price/category as plain white text/pills instead of
 * reusing `RatingStars`/`PriceRangeBadge`/`CategoryChips` — those three
 * are styled for their one existing look (colored fill on a light card),
 * which wouldn't read against a variable-brightness photo without fighting
 * their own encapsulated styles from outside. Simpler and more honest to
 * render this overlay's own markup directly than to bolt an unrelated
 * white-on-dark variant onto three components whose only other consumers
 * never need one.
 */
@Component({
  selector: 'app-restaurant-cover',
  imports: [DecimalPipe, FavoriteButton, NgOptimizedImage],
  templateUrl: './restaurant-cover.html',
  styles: `
    .cover-wrap {
      position: relative;
      border-radius: var(--mat-sys-corner-large);
      overflow: hidden;

      .cover {
        display: block;
        width: 100%;
        height: 20rem;
        object-fit: cover;
      }

      .cover.placeholder {
        background-color: var(--mat-sys-surface-container-high);
      }

      .cover-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to top,
          rgb(var(--app-ink-rgb) / 72%) 0%,
          rgb(var(--app-ink-rgb) / 15%) 55%,
          rgb(var(--app-ink-rgb) / 0%) 100%
        );
      }

      .heart-overlay {
        position: absolute;
        top: 1.125rem;
        right: 1.125rem;
      }

      .hero-content {
        position: absolute;
        inset: auto 0 0 0;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;

        h1 {
          margin: 0;
          color: #fff;
          font-size: 2.75rem;
          line-height: 1.05;
          letter-spacing: -0.02em;
        }

        .meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgb(255 255 255 / 90%);
          font: var(--mat-sys-body-medium);
        }

        .category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 0;
          padding: 0;
          list-style: none;

          li {
            height: 1.75rem;
            padding: 0 0.75rem;
            display: flex;
            align-items: center;
            border-radius: var(--mat-sys-corner-full);
            background-color: rgb(255 255 255 / 18%);
            border: 1px solid rgb(255 255 255 / 30%);
            backdrop-filter: blur(4px);
            color: #fff;
            font: var(--mat-sys-label-medium);
          }
        }
      }

      .description {
        margin: 0.5rem 0 0;
      }
    }
  `,
})
export class RestaurantCover {
  readonly restaurant = input.required<Restaurant>();
  readonly isFavorited = input<boolean>(false);
  readonly isAuthenticated = input<boolean>(false);
  readonly loginReturnUrl = input<string>('/');

  readonly toggleFavorite = output<void>();
}
