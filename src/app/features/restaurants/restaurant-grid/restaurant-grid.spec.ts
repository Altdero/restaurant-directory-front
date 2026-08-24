import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Restaurant } from '@core/models/restaurant.model';

import { RestaurantGrid } from './restaurant-grid';

const RESTAURANT = { id: 'r-1', name: 'La Trattoria' } as Restaurant;

describe('RestaurantGrid', () => {
  function createFixture() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
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

  it('falls back to the default empty message when no override is given', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance['resolvedEmptyMessage']()).toBe(
      'No restaurants match your filters.',
    );
  });

  it('uses the caller-supplied empty message when given', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('emptyMessage', "You haven't added any favorites yet.");
    expect(fixture.componentInstance['resolvedEmptyMessage']()).toBe(
      "You haven't added any favorites yet.",
    );
  });

  it('emits toggleFavorite with the restaurant id from a card', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('restaurants', [RESTAURANT]);
    fixture.componentRef.setInput('isLoading', false);
    const emitted = vi.fn();
    fixture.componentInstance.toggleFavorite.subscribe(emitted);
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.css('app-restaurant-card'));
    card.triggerEventHandler('toggleFavorite');

    expect(emitted).toHaveBeenCalledWith(RESTAURANT.id);
  });
});
