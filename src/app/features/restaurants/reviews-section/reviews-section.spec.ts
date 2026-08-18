import { TestBed } from '@angular/core/testing';
import { Review } from '@core/models/review.model';

import { ReviewsSection } from './reviews-section';

const REVIEW: Review = {
  id: 'rv-1',
  restaurantId: 'r-1',
  userId: 'u-1',
  username: 'ana',
  rating: 4,
  comment: 'Great food',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('ReviewsSection', () => {
  function createFixture() {
    return TestBed.createComponent(ReviewsSection);
  }

  it('shows the empty state when there is no error, not loading, and no reviews', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reviews', []);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
  });

  it('shows the error state instead of the empty state when there is an error', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reviews', []);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('error', { type: 'unknown', status: 500 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeNull();
  });

  it('lists reviews and forwards a load-more click', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reviews', [REVIEW]);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('hasMore', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(1);

    const emitted = vi.fn();
    fixture.componentInstance.loadMore.subscribe(emitted);
    fixture.nativeElement.querySelector('button').click();

    expect(emitted).toHaveBeenCalled();
  });
});
