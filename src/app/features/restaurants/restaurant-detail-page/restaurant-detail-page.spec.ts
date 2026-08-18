import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MENU_ITEM_DATA, RESTAURANT_DATA, REVIEW_DATA } from '@core/interfaces/tokens';
import { Review } from '@core/models/review.model';

import { RestaurantDetailPage } from './restaurant-detail-page';

const REVIEW_A: Review = {
  id: 'rv-1',
  restaurantId: 'r-1',
  userId: 'u-1',
  username: 'ana',
  rating: 4,
  comment: 'Great',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};
const REVIEW_B: Review = { ...REVIEW_A, id: 'rv-2', username: 'bea' };

function fakeResource(value: unknown) {
  return {
    value: signal(value),
    isLoading: signal(false),
    error: signal(undefined),
    reload: vi.fn(),
  };
}

describe('RestaurantDetailPage', () => {
  let loadMore: ReturnType<typeof vi.fn>;

  function createFixture() {
    loadMore = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: RESTAURANT_DATA, useValue: { byId: () => fakeResource(undefined) } },
        { provide: MENU_ITEM_DATA, useValue: { list: () => fakeResource(undefined) } },
        {
          provide: REVIEW_DATA,
          useValue: {
            list: () =>
              fakeResource({
                next: 'https://api/reviews/?cursor=abc',
                previous: null,
                results: [REVIEW_A],
              }),
            loadMore,
          },
        },
      ],
    });

    return TestBed.createComponent(RestaurantDetailPage);
  }

  it('syncs the accumulated reviews and next-page cursor from the first page', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance['reviews']()).toEqual([REVIEW_A]);
    expect(fixture.componentInstance['hasMoreReviews']()).toBe(true);
  });

  it('appends the next page and updates the cursor on load more', async () => {
    const fixture = createFixture();
    loadMore.mockResolvedValue({ next: null, previous: null, results: [REVIEW_B] });
    fixture.detectChanges();

    await fixture.componentInstance['loadMoreReviews']();

    expect(fixture.componentInstance['reviews']()).toEqual([REVIEW_A, REVIEW_B]);
    expect(fixture.componentInstance['hasMoreReviews']()).toBe(false);
    expect(loadMore).toHaveBeenCalledWith('https://api/reviews/?cursor=abc');
  });

  it('is a no-op when there is no next page', async () => {
    const fixture = createFixture();
    loadMore.mockResolvedValue({ next: null, previous: null, results: [] });
    fixture.detectChanges();
    await fixture.componentInstance['loadMoreReviews']();
    loadMore.mockClear();

    await fixture.componentInstance['loadMoreReviews']();

    expect(loadMore).not.toHaveBeenCalled();
  });
});
