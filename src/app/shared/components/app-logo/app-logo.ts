import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Icon + wordmark, linking to `/`. Pulled out of `MainToolbar` so the mark
 * stays a single reusable unit rather than markup duplicated wherever the
 * brand needs to appear.
 */
@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <a routerLink="/" class="logo">
      <svg
        class="logo-icon"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <ellipse cx="50" cy="85" rx="25" ry="4" class="logo-shadow" />
        <path
          d="M50 15C33.43 15 20 28.43 20 45C20 63.75 42 82.5 50 85C58 82.5 80 63.75 80 45C80 28.43 66.57 15 50 15Z"
          class="logo-bg"
        />
        <path
          d="M32 58H68C70.2 58 72 56.2 72 54C72 51.8 70.2 50 68 50H32C29.8 50 28 51.8 28 54C28 56.2 29.8 58 32 58Z"
          class="logo-mark"
        />
        <path d="M34 46C34 37.16 41.16 30 50 30C58.84 30 66 37.16 66 46H34Z" class="logo-mark" />
        <circle cx="50" cy="25" r="3.5" class="logo-mark" />
        <path d="M50 30V46H66C66 37.16 58.84 30 50 30Z" class="logo-highlight" />
      </svg>
      <span class="logo-text" i18n="@@nav.wordmark">Restaurant Directory</span>
    </a>
  `,
  styles: `
    .logo {
      display: inline-flex;
      align-items: center;
      text-decoration: none;
    }

    .logo-icon {
      width: 2rem;
      height: 2rem;
      flex-shrink: 0;
    }

    .logo-shadow {
      fill: rgb(var(--app-ink-rgb) / 10%);
    }

    .logo-bg {
      fill: var(--mat-sys-primary);
    }

    .logo-mark,
    .logo-highlight {
      fill: var(--mat-sys-on-primary);
    }

    .logo-highlight {
      opacity: 0.3;
    }

    .logo-text {
      font-family: 'Fraunces Variable', serif;
      font-weight: 400;
      font-size: 1rem;
      color: var(--mat-sys-on-surface);
    }
  `,
})
export class AppLogo {}
