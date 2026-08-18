import { TestBed } from '@angular/core/testing';
import { Restaurant } from '@core/models/restaurant.model';

import { RestaurantGrid } from './restaurant-grid';

const RESTAURANT = { id: 'r-1', name: 'La Trattoria' } as Restaurant;

describe('RestaurantGrid', () => {
  function createFixture() {
    return TestBed.createComponent(RestaurantGrid);
  }

  it('shows skeletons while loading', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('restaurants', []);
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-skeleton-card').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('app-error-state')).toBeNull();
  });

  it('shows the error state and prefers a detail message when present', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('restaurants', []);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('error', {
      type: 'detail',
      status: 500,
      message: 'Server exploded',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();
    expect(
      fixture.componentInstance['errorMessage']({ type: 'detail', status: 500, message: 'x' }),
    ).toBe('x');
  });

  it('falls back to a generic error message for a non-detail ApiError', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance['errorMessage']({ type: 'unknown', status: 500 })).toBe(
      "Couldn't load restaurants. Please try again.",
    );
  });

  it('shows the empty state when there is no error, not loading, and no results', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('restaurants', []);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
  });

  it('shows the restaurant cards when results are present', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('restaurants', [RESTAURANT]);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-restaurant-card').length).toBe(1);
  });
});
