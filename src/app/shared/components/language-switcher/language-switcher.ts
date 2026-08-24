import { DOCUMENT } from '@angular/core';
import { Component, LOCALE_ID, inject } from '@angular/core';
import { stripLocalePrefix } from '@core/utils/locale-path';

type Locale = 'es' | 'en';

const LOCALE_LABELS: Record<Locale, string> = { es: 'Español', en: 'English' };

/**
 * A real document navigation (`<a href>`), never `routerLink` — each locale
 * is a separately compiled bundle, so switching requires a full page load
 * (see AGENTS.md § i18n rules). `LOCALE_ID` is a plain build-time constant
 * here, not a signal: it can never change without that reload.
 */
@Component({
  selector: 'app-language-switcher',
  template: `
    <a
      [href]="alternateHref"
      hreflang="{{ alternateLocale }}"
      rel="alternate"
      [attr.aria-label]="switchLabel"
    >
      {{ alternateLabel }}
    </a>
  `,
})
export class LanguageSwitcher {
  private readonly document = inject(DOCUMENT);
  private readonly localeId = inject(LOCALE_ID);

  protected readonly currentLocale: Locale = this.localeId === 'en' ? 'en' : 'es';
  protected readonly alternateLocale: Locale = this.currentLocale === 'es' ? 'en' : 'es';
  protected readonly alternateLabel = LOCALE_LABELS[this.alternateLocale];
  protected readonly alternateHref = this.buildAlternateHref();
  protected readonly switchLabel = $localize`:@@nav.switchLanguage:Switch language to ${this.alternateLabel}:alternateLabel:`;

  private buildAlternateHref(): string {
    const { pathname, search } = this.document.location;
    const pathWithoutLocale = stripLocalePrefix(pathname);
    const path = pathWithoutLocale === '/' ? '' : pathWithoutLocale;
    return `/${this.alternateLocale}${path}${search}`;
  }
}
