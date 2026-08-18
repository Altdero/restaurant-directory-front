import { TestBed } from '@angular/core/testing';

import { RatingStars } from './rating-stars';

describe('RatingStars', () => {
  function fillWidth(rating: number): string {
    const fixture = TestBed.createComponent(RatingStars);
    fixture.componentRef.setInput('rating', rating);
    fixture.detectChanges();
    const fill: HTMLElement = fixture.nativeElement.querySelector('.fill');
    return fill.style.width;
  }

  it('fills half the width for a 2.5 rating', () => {
    expect(fillWidth(2.5)).toBe('50%');
  });

  it('clamps a rating above 5 to a full fill', () => {
    expect(fillWidth(7)).toBe('100%');
  });

  it('clamps a negative rating to no fill', () => {
    expect(fillWidth(-1)).toBe('0%');
  });
});
