import { Component } from '@angular/core';

/**
 * No copyright year here deliberately — AGENTS.md's template rule against
 * assuming globals like `new Date()` are available applies to SSR-rendered
 * output too: a value computed once at SSR-render time and recomputed at
 * hydration is a hydration-mismatch risk in general, even though a
 * year-rollover is a vanishingly rare case of it in practice.
 */
@Component({
  selector: 'app-site-footer',
  template: `
    <footer>
      <p i18n="@@footer.tagline">Discover restaurants near you.</p>
    </footer>
  `,
})
export class SiteFooter {}
