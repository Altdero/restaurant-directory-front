import { Component, input } from '@angular/core';
import { Category } from '@core/models/category.model';

/** Read-only category list — not selectable/removable, so plain markup rather than MatChips. */
@Component({
  selector: 'app-category-chips',
  template: `
    <ul class="category-chips">
      @for (category of categories(); track category.id) {
        <li>
          @if (category.icon) {
            <span aria-hidden="true">{{ category.icon }}</span>
          }
          {{ category.name }}
        </li>
      }
    </ul>
  `,
  styles: `
    .category-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      font: var(--mat-sys-label-small);
      background-color: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      border-radius: var(--mat-sys-corner-full);
      padding: 0.125rem 0.625rem;
    }
  `,
})
export class CategoryChips {
  readonly categories = input.required<readonly Category[]>();
}
