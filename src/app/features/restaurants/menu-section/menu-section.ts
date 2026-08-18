import { Component, computed, input } from '@angular/core';
import { ApiError } from '@core/models/api-error.model';
import { MenuItem, MenuItemCategory } from '@core/models/menu-item.model';
import { apiErrorMessage } from '@core/utils/api-error-message';
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

function categoryLabel(category: MenuItemCategory): string {
  switch (category) {
    case 'appetizer':
      return $localize`:@@menuSection.appetizer:Appetizers`;
    case 'main_course':
      return $localize`:@@menuSection.mainCourse:Main Courses`;
    case 'beverage':
      return $localize`:@@menuSection.beverage:Beverages`;
    case 'dessert':
      return $localize`:@@menuSection.dessert:Desserts`;
    case 'other':
      return $localize`:@@menuSection.other:Other`;
  }
}

/** Groups a flat menu-item list by category, in a fixed display order, dropping empty categories. */
export function groupMenuItems(items: readonly MenuItem[]): readonly MenuItemGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}

@Component({
  selector: 'app-menu-section',
  imports: [EmptyState, ErrorState],
  templateUrl: './menu-section.html',
  styles: `
    h2 {
      font: var(--mat-sys-title-medium);
    }

    ul {
      list-style: none;
      margin: 0 0 1.5rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .item {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .item.unavailable {
      opacity: 0.5;
    }

    .item-name {
      font-weight: 500;
    }

    .item-description {
      margin: 0;
      font: var(--mat-sys-body-small);
      color: var(--mat-sys-on-surface-variant);
    }

    .price {
      white-space: nowrap;
    }
  `,
})
export class MenuSection {
  readonly menuItems = input.required<readonly MenuItem[]>();
  readonly isLoading = input.required<boolean>();
  readonly error = input<ApiError | undefined>(undefined);

  protected readonly groups = computed(() => groupMenuItems(this.menuItems()));
  protected readonly categoryLabel = categoryLabel;
  protected readonly apiErrorMessage = apiErrorMessage;

  protected emptyMessage(): string {
    return $localize`:@@menuSection.emptyMessage:This restaurant hasn't added a menu yet.`;
  }
}
