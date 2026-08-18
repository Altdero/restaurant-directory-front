import { TestBed } from '@angular/core/testing';
import { Category } from '@core/models/category.model';

import { RestaurantFilters } from './restaurant-filters';

const CATEGORIES: readonly Category[] = [
  {
    id: 'c-1',
    name: 'Italian',
    slug: 'italian',
    description: '',
    icon: '',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

describe('RestaurantFilters', () => {
  function createFixture() {
    const fixture = TestBed.createComponent(RestaurantFilters);
    fixture.componentRef.setInput('categories', CATEGORIES);
    fixture.detectChanges();
    return fixture;
  }

  it('emits the current form value on submit', () => {
    const fixture = createFixture();
    const emitted = vi.fn();
    fixture.componentInstance.filtersChange.subscribe(emitted);

    fixture.componentInstance['form'].setValue({
      category: 'c-1',
      city: 'Mexico City',
      priceRange: '$$',
      minRating: 4,
      search: 'tacos',
    });
    fixture.componentInstance.submit();

    expect(emitted).toHaveBeenCalledWith({
      category: 'c-1',
      city: 'Mexico City',
      priceRange: '$$',
      minRating: 4,
      search: 'tacos',
    });
  });

  it('clears the form and emits empty filters on reset', () => {
    const fixture = createFixture();
    fixture.componentInstance['form'].setValue({
      category: 'c-1',
      city: 'Mexico City',
      priceRange: '$$',
      minRating: 4,
      search: 'tacos',
    });
    const emitted = vi.fn();
    fixture.componentInstance.filtersChange.subscribe(emitted);

    fixture.componentInstance.reset();

    expect(emitted).toHaveBeenCalledWith({
      category: undefined,
      city: undefined,
      priceRange: undefined,
      minRating: undefined,
      search: undefined,
    });
  });

  it('syncs the form when its current-value inputs change (e.g. browser back/forward)', () => {
    const fixture = createFixture();

    fixture.componentRef.setInput('city', 'Guadalajara');
    fixture.componentRef.setInput('search', 'pizza');
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].getRawValue()).toMatchObject({
      city: 'Guadalajara',
      search: 'pizza',
    });
  });
});
