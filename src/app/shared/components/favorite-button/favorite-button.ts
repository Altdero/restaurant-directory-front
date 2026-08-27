import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

const HEART_PATH =
  'M12 21s-7.5-4.6-10.2-9.1C.4 9.6 1 6.6 3.4 5.1c2.1-1.3 4.7-.8 6.2 1 .2.2.3.4.4.6.1-.2.2-.4.4-.6 1.5-1.8 4.1-2.3 6.2-1 2.4 1.5 3 4.5 1.6 6.8C19.5 16.4 12 21 12 21z';

/**
 * Anonymous visitors get a real `routerLink` to `/login` (with a
 * `returnUrl` back to the page they were on) instead of a click handler —
 * same "log in to..." pattern as `ReviewsSection`. Authenticated visitors
 * get a real toggle button with `aria-pressed`, per PLAN.md's
 * accessibility requirement for this exact control.
 */
@Component({
  selector: 'app-favorite-button',
  imports: [RouterLink],
  template: `
    @if (isAuthenticated()) {
      <button
        type="button"
        class="favorite-button"
        [class.favorited]="isFavorited()"
        [attr.aria-pressed]="isFavorited()"
        [attr.aria-label]="isFavorited() ? unfavoriteLabel : favoriteLabel"
        (click)="toggled.emit()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="HEART_PATH" /></svg>
      </button>
    } @else {
      <a
        class="favorite-button"
        [routerLink]="['/login']"
        [queryParams]="{ returnUrl: loginReturnUrl() }"
        [attr.aria-label]="favoriteLabel"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="HEART_PATH" /></svg>
      </a>
    }
  `,
  styles: `
    .favorite-button {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border: none;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      padding: 0;
    }

    svg {
      width: 1.1rem;
      height: 1.1rem;
      fill: none;
      stroke: var(--mat-sys-on-surface);
      stroke-width: 1.8;
    }

    .favorited {
      background-color: var(--mat-sys-primary);
    }

    .favorited svg {
      fill: #fff;
      stroke: #fff;
    }
  `,
})
export class FavoriteButton {
  readonly isFavorited = input.required<boolean>();
  readonly isAuthenticated = input.required<boolean>();
  readonly loginReturnUrl = input<string>('/');

  readonly toggled = output<void>();

  protected readonly HEART_PATH = HEART_PATH;
  protected readonly favoriteLabel = $localize`:@@favoriteButton.add:Add to favorites`;
  protected readonly unfavoriteLabel = $localize`:@@favoriteButton.remove:Remove from favorites`;
}
