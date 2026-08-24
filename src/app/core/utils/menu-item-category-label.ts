import { MenuItemCategory } from '@core/models/menu-item.model';

/**
 * Shared by `MenuSection` (public display), `MenuItemForm` and
 * `MenuItemTable` (owner management) — one label per category, not
 * duplicated per consumer. IDs keep the original `menuSection.*` prefix
 * from commit 12 (this function moved out of that component) rather than
 * being renamed, so the existing translated units in `messages.es.xlf`
 * aren't orphaned.
 */
export function menuItemCategoryLabel(category: MenuItemCategory): string {
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
