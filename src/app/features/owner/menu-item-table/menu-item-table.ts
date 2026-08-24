import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MenuItem } from '@core/models/menu-item.model';
import { menuItemCategoryLabel } from '@core/utils/menu-item-category-label';
import { groupMenuItems } from '@features/restaurants/menu-section/menu-section';
import { EmptyState } from '@shared/components/empty-state/empty-state';

/**
 * Presentational — delegates grouping to `groupMenuItems()` (already
 * exported and tested from `menu-section.ts`) rather than reimplementing
 * category grouping for the owner-management view.
 */
@Component({
  selector: 'app-menu-item-table',
  imports: [MatButtonModule, EmptyState],
  templateUrl: './menu-item-table.html',
  styles: `
    h3 {
      font: var(--mat-sys-title-medium);
    }

    .row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .row.unavailable {
      opacity: 0.5;
    }

    .name {
      flex: 1 1 auto;
    }

    .price {
      white-space: nowrap;
    }
  `,
})
export class MenuItemTable {
  readonly items = input.required<readonly MenuItem[]>();

  readonly edit = output<MenuItem>();
  readonly delete = output<MenuItem>();

  protected readonly groups = computed(() => groupMenuItems(this.items()));
  protected readonly categoryLabel = menuItemCategoryLabel;
  protected readonly emptyMessage = $localize`:@@menuItemTable.emptyMessage:No menu items yet.`;
}
