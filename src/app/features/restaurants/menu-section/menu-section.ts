import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ApiError } from '@core/models/api-error.model';
import { MenuItem, MenuItemCategory } from '@core/models/menu-item.model';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { menuItemCategoryLabel } from '@core/utils/menu-item-category-label';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';

export interface MenuItemGroup {
  readonly category: MenuItemCategory;
  readonly items: readonly MenuItem[];
}

const CATEGORY_ORDER: readonly MenuItemCategory[] = [
  'appetizer',
  'main_course',
  'beverage',
  'dessert',
  'other',
];

/** Groups a flat menu-item list by category, in a fixed display order, dropping empty categories. */
export function groupMenuItems(items: readonly MenuItem[]): readonly MenuItemGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}

@Component({
  selector: 'app-menu-section',
  imports: [NgOptimizedImage, EmptyState, ErrorState],
  templateUrl: './menu-section.html',
  styles: `
    h2 {
      font-size: 1.625rem;
      margin: 0 0 1.25rem;
    }

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

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .item {
      display: flex;
      gap: 1rem;
      padding: 0.875rem;
      background-color: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
    }

    .item.unavailable {
      opacity: 0.5;
    }

    .thumb {
      flex: none;
      width: 4.75rem;
      height: 4.75rem;
      border-radius: var(--mat-sys-corner-small);
      object-fit: cover;
    }

    .thumb.placeholder {
      background-color: var(--mat-sys-surface-container-high);
    }

    .item-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .item-name {
      font-weight: 600;
    }

    .item-description {
      margin: 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .price {
      white-space: nowrap;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }
  `,
})
export class MenuSection {
  readonly menuItems = input.required<readonly MenuItem[]>();
  readonly isLoading = input.required<boolean>();
  readonly error = input<ApiError | undefined>(undefined);

  protected readonly groups = computed(() => groupMenuItems(this.menuItems()));
  protected readonly categoryLabel = menuItemCategoryLabel;
  protected readonly apiErrorMessage = apiErrorMessage;

  protected emptyMessage(): string {
    return $localize`:@@menuSection.emptyMessage:This restaurant hasn't added a menu yet.`;
  }
}
