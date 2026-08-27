import { Component, computed, inject } from '@angular/core';
import { ThemeService } from '@core/services/theme/theme.service';

/**
 * Inline SVG icons rather than `MatIconModule` + an icon font: this is the
 * only icon needed in this commit, and a font (self-hosted or not) is a
 * disproportionate dependency for one glyph pair.
 */
@Component({
  selector: 'app-theme-toggle',
  template: `
    <button
      type="button"
      [attr.aria-pressed]="isDark()"
      [attr.aria-label]="label()"
      (click)="theme.toggle()"
    >
      @if (isDark()) {
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path
            d="M12 4V2m0 20v-2m8-8h2M2 12h2m14.14-6.14 1.42-1.42M4.44 19.56l1.42-1.42M19.56 19.56l-1.42-1.42M4.44 4.44l1.42 1.42M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            fill="none"
          />
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 1 0 20.354 15.354Z" />
        </svg>
      }
    </button>
  `,
  styles: `
    button {
      width: 2rem;
      height: 2rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-full);
      background: none;
      color: var(--mat-sys-on-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly isDark = computed(() => this.theme.resolved() === 'dark');
  protected readonly label = computed(() =>
    this.isDark()
      ? $localize`:@@theme.switchToLight:Switch to light mode`
      : $localize`:@@theme.switchToDark:Switch to dark mode`,
  );
}
