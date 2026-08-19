import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
const MY_REVIEW: Review = { ...REVIEW, id: 'rv-2', userId: 'u-2', username: 'me' };

describe('ReviewsSection', () => {
  function createFixture() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    return TestBed.createComponent(ReviewsSection);
  }

  it('shows the empty state when there is no error, not loading, no reviews and no myReview', () => {
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

  it('excludes myReview from the plain review list and lists the others', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reviews', [REVIEW, MY_REVIEW]);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('myReview', MY_REVIEW);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('ul li').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Great food');
  });

  it('forwards a load-more click', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reviews', [REVIEW]);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('hasMore', true);
    fixture.detectChanges();

    const emitted = vi.fn();
    fixture.componentInstance.loadMore.subscribe(emitted);
    fixture.nativeElement.querySelector('app-cursor-load-more button').click();

    expect(emitted).toHaveBeenCalled();
  });

  it('shows a login prompt when the visitor is not authenticated', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reviews', []);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('isAuthenticated', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Log in to write a review');
  });

  it('shows a write-a-review button for an authenticated visitor with no review yet', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reviews', []);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('isAuthenticated', true);
    fixture.detectChanges();

    const emitted = vi.fn();
    fixture.componentInstance.openForm.subscribe(emitted);
    fixture.nativeElement.querySelector('button').click();

    expect(emitted).toHaveBeenCalled();
  });

  it('shows the current user’s review with edit/delete actions instead of a write button', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reviews', [MY_REVIEW]);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('isAuthenticated', true);
    fixture.componentRef.setInput('myReview', MY_REVIEW);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.my-review')).toBeTruthy();

    const deleted = vi.fn();
    fixture.componentInstance.deleteReview.subscribe(deleted);
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.my-review button'),
    );
    buttons[1].click();

    expect(deleted).toHaveBeenCalled();
  });

  it('shows the ReviewForm instead of the card when the form is open', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('reviews', []);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('isAuthenticated', true);
    fixture.componentRef.setInput('isFormOpen', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-review-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.my-review')).toBeNull();
  });
});
