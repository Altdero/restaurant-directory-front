import { TestBed } from '@angular/core/testing';
import { MenuItem } from '@core/models/menu-item.model';

import { MenuItemForm } from './menu-item-form';

const MENU_ITEM: MenuItem = {
  id: 'mi-1',
  restaurantId: 'r-1',
  restaurantName: 'La Trattoria',
  name: 'Margherita Pizza',
  description: 'Classic',
  price: 12.5,
  category: 'main_course',
  image: 'https://res.cloudinary.com/demo/image/upload/pizza.jpg',
  isAvailable: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('MenuItemForm', () => {
  function createFixture() {
    return TestBed.createComponent(MenuItemForm);
  }

  it('starts with defaults in create mode', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].getRawValue()).toMatchObject({
      name: '',
      price: 0,
      category: 'main_course',
      is_available: true,
    });
  });

  it('prefills the form from the menuItem input in edit mode', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('menuItem', MENU_ITEM);
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].getRawValue()).toMatchObject({
      name: 'Margherita Pizza',
      price: 12.5,
      category: 'main_course',
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

  it('emits the snake_case payload, including the tracked image url, on a valid submit', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput(
      'imageUrl',
      'https://res.cloudinary.com/demo/image/upload/new.jpg',
    );
    fixture.detectChanges();
    fixture.componentInstance['form'].patchValue({ name: 'New Item', price: 5 });
    const emitted = vi.fn();
    fixture.componentInstance.save.subscribe(emitted);

    fixture.componentInstance.submit();

    expect(emitted).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Item',
        price: 5,
        image: 'https://res.cloudinary.com/demo/image/upload/new.jpg',
      }),
    );
  });

  it('applies a field-level server error to the matching control', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    fixture.componentRef.setInput('error', {
      type: 'field',
      errors: { price: ['Price must be greater than 0.'] },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].get('price')?.errors).toEqual({
      server: 'Price must be greater than 0.',
    });
  });
});
