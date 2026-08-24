import { DOCUMENT, Service, inject } from '@angular/core';

const MARKER = 'seo-jsonld';

/**
 * Manages exactly one `<script type="application/ld+json">` tag via
 * `DOCUMENT`, upserting its `textContent` (create-if-missing, replace-if-
 * present) so client-side navigation between two pages that both emit
 * JSON-LD (e.g. two restaurant detail pages) never leaves stale or
 * duplicate structured data behind. No generic multi-schema registry — only
 * `RestaurantDetailPage` emits JSON-LD today.
 */
@Service()
export class JsonLdService {
  private readonly document = inject(DOCUMENT);

  set(schema: object): void {
    let script = this.document.head.querySelector<HTMLScriptElement>(
      `script[data-seo="${MARKER}"]`,
    );
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', MARKER);
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }

  clear(): void {
    this.document.head.querySelector(`script[data-seo="${MARKER}"]`)?.remove();
  }
}
