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
const MY_REVIEW: Review = { ...REVIEW, id: 'rv-2', userId: 'u-2', username: 'me' };

describe('ReviewsSection', () => {
  it('excludes myReview from the plain review list', () => {
    const fixture = TestBed.createComponent(ReviewsSection);
    fixture.componentRef.setInput('reviews', [REVIEW, MY_REVIEW]);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('myReview', MY_REVIEW);

    expect(fixture.componentInstance['otherReviews']()).toEqual([REVIEW]);
  });
});
