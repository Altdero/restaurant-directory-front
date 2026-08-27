import { NgOptimizedImage } from '@angular/common';
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
  imports: [NgOptimizedImage, MatButtonModule, EmptyState],
  templateUrl: './menu-item-table.html',
  styles: `
    .group {
      margin-bottom: 1.5rem;
    }

    .group:last-child {
      margin-bottom: 0;
    }

    .category-label {
      font-family: 'Inter Variable', sans-serif;
      font: var(--mat-sys-label-medium);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--app-chip-teal-fg);
      margin: 0 0 0.75rem;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem;
      background-color: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
    }

    .row.unavailable {
      opacity: 0.5;
    }

    .thumb {
      flex: none;
      width: 3.75rem;
      height: 3.75rem;
      border-radius: var(--mat-sys-corner-small);
      object-fit: cover;
    }

    .thumb.placeholder {
      background-color: var(--mat-sys-surface-container-high);
    }

    .info {
      flex: 1 1 auto;
      min-width: 0;
    }

    .info .name {
      font-weight: 600;
    }

    .description {
      margin: 0.125rem 0 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .price {
      white-space: nowrap;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .actions button {
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .actions .danger {
      border-color: var(--mat-sys-error);
      color: var(--mat-sys-error);
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
  protected readonly editLabel = $localize`:@@menuItemTable.edit:Edit`;
  protected readonly deleteLabel = $localize`:@@menuItemTable.delete:Delete`;
}
