import { Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@core/services/auth/auth.store';
import { LanguageSwitcher } from '@shared/components/language-switcher/language-switcher';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';

import { UserMenu } from '../user-menu/user-menu';
import { AppLogo } from '@shared/components/app-logo/app-logo';

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
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
    LanguageSwitcher,
    ThemeToggle,
    UserMenu,
    AppLogo,
  ],
  template: `
    <mat-toolbar>
      <app-logo />
      <a
        routerLink="/restaurants"
        routerLinkActive="active"
        class="nav-link"
        i18n="@@nav.restaurants"
      >
        Restaurants
      </a>
      <span class="spacer"></span>
      <div class="desktop-actions">
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
      </div>
      <button
        type="button"
        class="mobile-menu-trigger"
        [matMenuTriggerFor]="mobileMenu"
        i18n-aria-label="@@nav.openMenu"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            fill="none"
          />
        </svg>
      </button>
      <mat-menu #mobileMenu="matMenu">
        <a mat-menu-item routerLink="/restaurants" i18n="@@nav.restaurants">Restaurants</a>
        @if (authStore.initialized()) {
          @if (authStore.isAuthenticated() && authStore.user(); as user) {
            <div class="mobile-menu-user">
              <app-user-menu [user]="user" (logout)="authStore.logout()" />
            </div>
          } @else {
            <a mat-menu-item routerLink="/login" i18n="@@nav.login">Log in</a>
            <a mat-menu-item routerLink="/register" i18n="@@nav.register">Register</a>
          }
        }
        <div class="mobile-menu-footer">
          <app-theme-toggle />
          <app-language-switcher />
        </div>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: `
    mat-toolbar {
      gap: 1.25rem;
      min-height: 4.25rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .nav-link {
      color: var(--mat-sys-on-surface);
      text-decoration: none;
      font: var(--mat-sys-label-large);

      &:hover {
        color: var(--mat-sys-primary);
      }

      &.active {
        color: var(--mat-sys-primary);
        font-weight: 600;
      }
    }

    .spacer {
      flex: 1 1 auto;
    }

    .desktop-actions {
      display: flex;
      align-items: center;
      gap: 1.25rem;

      a {
        color: var(--mat-sys-on-surface);
        text-decoration: none;
        font: var(--mat-sys-label-large);

        &:hover {
          color: var(--mat-sys-primary);
        }
      }
    }

    .mobile-menu-trigger {
      display: none;
      flex-shrink: 0;
      width: 2rem;
      height: 2rem;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-full);
      background: none;
      color: var(--mat-sys-on-surface-variant);
      cursor: pointer;
    }

    .mobile-menu-user {
      padding: 0.25rem 0.5rem;
    }

    .mobile-menu-footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
    }

    /* Material's standard handset breakpoint upper bound. */
    @media (max-width: 599px) {
      .nav-link,
      .desktop-actions {
        display: none;
      }

      .mobile-menu-trigger {
        display: flex;
      }
    }
  `,
})
export class MainToolbar {
  protected readonly authStore = inject(AuthStore);
}
