import { TestBed } from '@angular/core/testing';
import { Review } from '@core/models/review.model';

import { ReviewForm } from './review-form';

const REVIEW: Review = {
  id: 'rv-1',
  restaurantId: 'r-1',
  userId: 'u-1',
  username: 'ana',
  rating: 3,
  comment: 'Decent',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('ReviewForm', () => {
  function createFixture() {
    return TestBed.createComponent(ReviewForm);
  }

  it('starts empty in create mode', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].getRawValue()).toEqual({ rating: null, comment: '' });
  });

  it('prefills the form from the review input in edit mode', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('review', REVIEW);
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].getRawValue()).toEqual({
      rating: 3,
      comment: 'Decent',
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

  it('emits the rating and comment on a valid submit', () => {
    const fixture = createFixture();
    fixture.detectChanges();
    fixture.componentInstance['form'].setValue({ rating: 5, comment: 'Excellent' });
    const emitted = vi.fn();
    fixture.componentInstance.save.subscribe(emitted);

    fixture.componentInstance.submit();

    expect(emitted).toHaveBeenCalledWith({ rating: 5, comment: 'Excellent' });
  });
});
