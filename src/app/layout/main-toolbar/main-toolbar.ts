import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { LanguageSwitcher } from '@shared/components/language-switcher/language-switcher';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';

/**
 * Auth-aware content (login/register links, then a `UserMenu` once signed
 * in) is commit 10's job — `AuthStore` doesn't exist yet, and a link to a
 * route that doesn't exist yet would be worse than no link at all.
 */
@Component({
  selector: 'app-main-toolbar',
  imports: [MatToolbarModule, RouterLink, LanguageSwitcher, ThemeToggle],
  template: `
    <mat-toolbar>
      <a routerLink="/" class="wordmark" i18n="@@nav.wordmark">Restaurant Directory</a>
      <span class="spacer"></span>
      <app-theme-toggle />
      <app-language-switcher />
    </mat-toolbar>
  `,
  styles: `
    .wordmark {
      font-family: 'Fraunces Variable', serif;
      font-weight: 600;
      font-size: 1.25rem;
      text-decoration: none;
      color: var(--mat-sys-on-surface);
    }

    .spacer {
      flex: 1 1 auto;
    }
  `,
})
export class MainToolbar {}
