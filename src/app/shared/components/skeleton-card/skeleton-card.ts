import { Component } from '@angular/core';

/** Shimmer placeholder matching `RestaurantCard`'s layout, shown while a list resource is loading. */
@Component({
  selector: 'app-skeleton-card',
  template: `
    <div class="skeleton-card" aria-hidden="true">
      <div class="image"></div>
      <div class="line title"></div>
      <div class="line subtitle"></div>
    </div>
  `,
  styles: `
    @keyframes shimmer {
      0% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0.6;
      }
    }

    .skeleton-card {
      border-radius: var(--mat-sys-corner-medium);
      overflow: hidden;
      background-color: var(--mat-sys-surface-container);
    }

    .image {
      height: 10rem;
      animation: shimmer 1.5s ease-in-out infinite;
      background-color: var(--mat-sys-surface-container-high);
    }

    .line {
      height: 0.75rem;
      margin: 0.75rem;
      border-radius: var(--mat-sys-corner-full);
      animation: shimmer 1.5s ease-in-out infinite;
      background-color: var(--mat-sys-surface-container-high);
    }

    .subtitle {
      width: 60%;
    }
  `,
})
export class SkeletonCard {}
