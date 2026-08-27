import { Component, input } from '@angular/core';
import { PriceRange } from '@core/models/restaurant.model';

/**
 * Named `PriceRangeBadge`, not `PriceRange` as PLAN.md's component list
 * originally said — `PriceRange` is already the model's type name
 * (`core/models/restaurant.model.ts`), and a component of the same name
 * would collide with it in every file that needs both.
 */
@Component({
  selector: 'app-price-range-badge',
  template: `<span class="price-range-badge">{{ priceRange() }}</span>`,
  styles: `
    .price-range-badge {
      font: var(--mat-sys-label-medium);
      font-weight: 600;
      color: var(--mat-sys-primary);
    }
  `,
})
export class PriceRangeBadge {
  readonly priceRange = input.required<PriceRange>();
}
