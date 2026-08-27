import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@core/services/auth/auth.store';
import { LanguageSwitcher } from '@shared/components/language-switcher/language-switcher';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';

import { UserMenu } from '../user-menu/user-menu';

/**
 * Gated on `authStore.initialized()` so the toolbar doesn't flash
 * logged-out links before the silent session-rehydration attempt (see
 * `auth.store.ts`) resolves. SSR/prerendered output always renders the
 * logged-out branch — there is no browser cookie jar to rehydrate from on
 * the server — matching the same accepted single-frame-flash tradeoff
 * already documented for dark mode on prerendered routes.
 */
@Component({
  selector: 'app-main-toolbar',
  imports: [
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    LanguageSwitcher,
    ThemeToggle,
    UserMenu,
  ],
  template: `
    <mat-toolbar>
      <a routerLink="/" class="wordmark" i18n="@@nav.wordmark">Restaurant Directory</a>
      <a routerLink="/restaurants" routerLinkActive="active" i18n="@@nav.restaurants">
        Restaurants
      </a>
      <span class="spacer"></span>
      @if (authStore.initialized()) {
        @if (authStore.isAuthenticated() && authStore.user(); as user) {
          <app-user-menu [user]="user" (logout)="authStore.logout()" />
        } @else {
          <a routerLink="/login" i18n="@@nav.login">Log in</a>
          <a routerLink="/register" i18n="@@nav.register">Register</a>
        }
      }
      <app-theme-toggle />
      <app-language-switcher />
    </mat-toolbar>
  `,
  styles: `
    mat-toolbar {
      gap: 1.25rem;
      min-height: 4.25rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    a:not(.wordmark) {
      color: var(--mat-sys-on-surface);
      text-decoration: none;
      font: var(--mat-sys-label-large);
    }

    a:not(.wordmark):hover {
      color: var(--mat-sys-primary);
    }

    a.active {
      color: var(--mat-sys-primary);
      font-weight: 600;
    }

    .wordmark {
      font-family: 'Fraunces Variable', serif;
      font-weight: 700;
      font-size: 1.375rem;
      text-decoration: none;
      color: var(--mat-sys-on-surface);
    }

    .spacer {
      flex: 1 1 auto;
    }
  `,
})
export class MainToolbar {
  protected readonly authStore = inject(AuthStore);
}
