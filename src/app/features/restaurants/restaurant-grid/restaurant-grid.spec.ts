import { TestBed } from '@angular/core/testing';

import { RestaurantGrid } from './restaurant-grid';

describe('RestaurantGrid', () => {
  it('prefers the detail message for a detail ApiError', () => {
    const fixture = TestBed.createComponent(RestaurantGrid);

    expect(
      fixture.componentInstance['errorMessage']({ type: 'detail', status: 500, message: 'x' }),
    ).toBe('x');
  });

  it('falls back to a generic error message for a non-detail ApiError', () => {
    const fixture = TestBed.createComponent(RestaurantGrid);

    expect(fixture.componentInstance['errorMessage']({ type: 'unknown', status: 500 })).toBe(
      "Couldn't load restaurants. Please try again.",
    );
  });

  it('falls back to the default empty message when no override is given', () => {
    const fixture = TestBed.createComponent(RestaurantGrid);

    expect(fixture.componentInstance['resolvedEmptyMessage']()).toBe(
      'No restaurants match your filters.',
    );
  });

  it('uses the caller-supplied empty message when given', () => {
    const fixture = TestBed.createComponent(RestaurantGrid);
    fixture.componentRef.setInput('emptyMessage', "You haven't added any favorites yet.");

    expect(fixture.componentInstance['resolvedEmptyMessage']()).toBe(
      "You haven't added any favorites yet.",
    );
  });
});
