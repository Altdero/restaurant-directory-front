import { Component, computed, input } from '@angular/core';

const STAR_PATH = 'M12 2.5l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6l-6.2 3.6 1.6-6.9-5.3-4.7 7-.7z';

/**
 * Read-only 0–5 star display. Renders the fractional rating as a
 * continuous width-clipped overlay (not five discrete full/half/empty
 * icons) so any decimal `averageRating` from the API is shown precisely.
 */
@Component({
  selector: 'app-rating-stars',
  template: `
    <span class="rating-stars" role="img" [attr.aria-label]="ariaLabel()">
      <svg class="track" viewBox="0 0 120 24" aria-hidden="true">
        @for (position of stars; track position) {
          <path [attr.d]="STAR_PATH" [attr.transform]="'translate(' + position * 24 + ',0)'" />
        }
      </svg>
      <svg
        class="fill"
        [style.width.%]="fillPercent()"
        viewBox="0 0 120 24"
        preserveAspectRatio="xMinYMid slice"
        aria-hidden="true"
      >
        @for (position of stars; track position) {
          <path [attr.d]="STAR_PATH" [attr.transform]="'translate(' + position * 24 + ',0)'" />
        }
      </svg>
    </span>
  `,
  styles: `
    .rating-stars {
      position: relative;
      display: inline-block;
      width: 6rem;
      height: 1.2rem;
    }

    svg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      height: 100%;
    }

    .track path {
      fill: var(--mat-sys-outline-variant);
    }

    .fill path {
      fill: var(--mat-sys-primary);
    }
  `,
})
export class RatingStars {
  readonly rating = input.required<number>();

  protected readonly STAR_PATH = STAR_PATH;
  protected readonly stars = [0, 1, 2, 3, 4];

  protected readonly fillPercent = computed(() => (this.clamp(this.rating()) / 5) * 100);
  protected readonly ariaLabel = computed(
    () => $localize`:@@ratingStars.label:Rated ${this.clamp(this.rating())} out of 5`,
  );

  private clamp(rating: number): number {
    return Math.max(0, Math.min(5, rating));
  }
}
