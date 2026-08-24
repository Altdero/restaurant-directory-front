import { DOCUMENT, LOCALE_ID, Service, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { stripLocalePrefix } from '@core/utils/locale-path';
import { environment } from '@environments/environment';

type Locale = 'es' | 'en';

/** `x-default` points at the `es` URL — matches `server.ts`'s `DEFAULT_LOCALE`. */
const DEFAULT_LOCALE: Locale = 'es';

export interface SeoPageData {
  readonly title: string;
  readonly description: string;
  /**
   * When provided, replaces the current query string in the canonical/
   * hreflang URLs with one rebuilt from these entries (sorted, `undefined`/
   * `''` values dropped) instead of self-referencing the raw current URL.
   * Only `RestaurantListPage` needs this, to normalize `page=1` (identical
   * content to no `page` param) out of its canonical while keeping other
   * filters self-canonical.
   */
  readonly canonicalQueryParams?: Readonly<Record<string, string | number | undefined>>;
}

/**
 * Sets `<title>`/`<meta name="description">`/Open Graph tags (via the
 * built-in `Meta`/`Title` services) and manages the `<link rel="canonical">`
 * / `<link rel="alternate" hreflang>` tags Angular has no built-in for.
 * `<link>`s are upserted by a `data-seo` marker attribute so repeated calls
 * (e.g. a filter change re-running the page's `effect()`) never accumulate
 * duplicates.
 */
@Service()
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly localeId = inject(LOCALE_ID);

  updatePage(data: SeoPageData): void {
    this.title.setTitle(data.title);
    this.meta.updateTag({ name: 'description', content: data.description });

    const currentLocale: Locale = this.localeId === 'en' ? 'en' : 'es';
    const path = this.buildPath(data.canonicalQueryParams);
    const canonicalUrl = this.buildUrl(currentLocale, path);

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({
      property: 'og:locale',
      content: currentLocale === 'es' ? 'es_ES' : 'en_US',
    });

    this.setLink('canonical', canonicalUrl);
    this.setLink('alternate', this.buildUrl('es', path), 'es');
    this.setLink('alternate', this.buildUrl('en', path), 'en');
    this.setLink('alternate', this.buildUrl(DEFAULT_LOCALE, path), 'x-default');
  }

  private buildPath(canonicalQueryParams: SeoPageData['canonicalQueryParams']): string {
    const stripped = stripLocalePrefix(this.document.location.pathname);
    const pathname = stripped === '/' ? '' : stripped;

    if (!canonicalQueryParams) {
      return `${pathname}${this.document.location.search}`;
    }

    const params = new URLSearchParams();
    for (const key of Object.keys(canonicalQueryParams).sort()) {
      const value = canonicalQueryParams[key];
      if (value === undefined || value === '') {
        continue;
      }
      params.set(key, String(value));
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  private buildUrl(locale: Locale, path: string): string {
    return `${environment.siteUrl}/${locale}${path}`;
  }

  private setLink(rel: string, href: string, hreflang?: string): void {
    const marker = hreflang ? `${rel}-${hreflang}` : rel;
    let link = this.document.head.querySelector<HTMLLinkElement>(`link[data-seo="${marker}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('data-seo', marker);
      link.setAttribute('rel', rel);
      if (hreflang) {
        link.setAttribute('hreflang', hreflang);
      }
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
