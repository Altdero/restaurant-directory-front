import { TestBed } from '@angular/core/testing';
import { Category } from '@core/models/category.model';
import { Restaurant } from '@core/models/restaurant.model';

import { RestaurantForm } from './restaurant-form';

const CATEGORY: Category = {
  id: 'c-1',
  name: 'Italian',
  slug: 'italian',
  description: '',
  icon: '',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const RESTAURANT: Restaurant = {
  id: 'r-1',
  owner: 'owner1',
  name: 'La Trattoria',
  slug: 'la-trattoria',
  description: 'Cozy spot',
  categories: [CATEGORY],
  address: '123 Main St',
  city: 'Mexico City',
  state: '',
  country: 'Mexico',
  postalCode: '01000',
  latitude: null,
  longitude: null,
  phone: '555-1234',
  email: 'hi@latrattoria.com',
  website: '',
  priceRange: '$$',
  coverImage: '',
  averageRating: 4,
  totalReviews: 2,
  openingHours: {},
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('RestaurantForm', () => {
  function createFixture() {
    const fixture = TestBed.createComponent(RestaurantForm);
    fixture.componentRef.setInput('categories', [CATEGORY]);
    return fixture;
  }

  it('starts empty in create mode', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].getRawValue()).toMatchObject({
      name: '',
      category_ids: [],
      price_range: '$',
      is_active: true,
    });
  });

  it('prefills the form from the restaurant input in edit mode', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('restaurant', RESTAURANT);
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].getRawValue()).toMatchObject({
      name: 'La Trattoria',
      category_ids: ['c-1'],
      city: 'Mexico City',
      price_range: '$$',
      is_active: true,
    });
  });

  it('does not emit when the form is invalid', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    const emitted = vi.fn();
    fixture.componentInstance.save.subscribe(emitted);

    fixture.componentInstance.submit();

    expect(emitted).not.toHaveBeenCalled();
  });

  it('emits the snake_case payload on a valid submit', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    fixture.componentInstance['form'].patchValue({ name: 'New Spot', category_ids: ['c-1'] });
    const emitted = vi.fn();
    fixture.componentInstance.save.subscribe(emitted);

    fixture.componentInstance.submit();

    expect(emitted).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Spot', category_ids: ['c-1'] }),
    );
  });

  it('applies a field-level server error to the matching control', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    fixture.componentRef.setInput('error', {
      type: 'field',
      errors: { name: ['Already taken.'] },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].get('name')?.errors).toEqual({
      server: 'Already taken.',
    });
  });
});
