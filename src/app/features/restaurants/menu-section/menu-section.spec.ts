import { MenuItem } from '@core/models/menu-item.model';

import { groupMenuItems } from './menu-section';

function item(overrides: Partial<MenuItem>): MenuItem {
  return {
    id: 'i-1',
    restaurantId: 'r-1',
    restaurantName: 'La Trattoria',
    name: 'Item',
    description: '',
    price: 10,
    category: 'main_course',
    image: '',
    isAvailable: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('groupMenuItems', () => {
  it('orders categories appetizer, main course, beverage, dessert, other regardless of input order', () => {
    const items = [
      item({ id: 'i-1', category: 'dessert' }),
      item({ id: 'i-2', category: 'appetizer' }),
      item({ id: 'i-3', category: 'main_course' }),
    ];

    const groups = groupMenuItems(items);

    expect(groups.map((g) => g.category)).toEqual(['appetizer', 'main_course', 'dessert']);
  });

  it('drops categories with no items instead of rendering an empty section', () => {
    const groups = groupMenuItems([item({ category: 'beverage' })]);

    expect(groups).toEqual([
      { category: 'beverage', items: [expect.objectContaining({ category: 'beverage' })] },
    ]);
  });

  it('returns an empty array for an empty menu', () => {
    expect(groupMenuItems([])).toEqual([]);
  });
});
