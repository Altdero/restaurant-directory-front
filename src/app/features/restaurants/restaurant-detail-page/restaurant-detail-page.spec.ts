import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MENU_ITEM_DATA, RESTAURANT_DATA, REVIEW_DATA } from '@core/interfaces/tokens';
import { Review } from '@core/models/review.model';
import { AuthStore } from '@core/services/auth/auth.store';
import { UserProfile } from '@core/models/user-profile.model';
import { of } from 'rxjs';

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
const MY_USER: UserProfile = {
  id: 'u-1',
  username: 'ana',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Ruiz',
  role: 'customer',
  phone: '',
  avatar: '',
  dateJoined: new Date('2026-01-01'),
};

function fakeResource(value: unknown) {
  return {
    value: signal(value),
    isLoading: signal(false),
    error: signal(undefined),
    reload: vi.fn(),
  };
}

function fakeMutation() {
  const mutate = vi.fn();
  return { isPending: signal(false), error: signal(undefined), mutate };
}

describe('RestaurantDetailPage', () => {
  let loadMore: ReturnType<typeof vi.fn>;
  let createReview: ReturnType<typeof fakeMutation>;
  let updateReview: ReturnType<typeof fakeMutation>;
  let removeReview: ReturnType<typeof fakeMutation>;
  let dialogOpen: ReturnType<typeof vi.fn>;

  function createFixture(options: { authenticatedAs?: UserProfile | null } = {}) {
    loadMore = vi.fn();
    createReview = fakeMutation();
    updateReview = fakeMutation();
    removeReview = fakeMutation();
    dialogOpen = vi.fn();

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
            create: () => createReview,
            update: () => updateReview,
            remove: () => removeReview,
          },
        },
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: signal(
              options.authenticatedAs !== undefined && options.authenticatedAs !== null,
            ),
            user: signal(options.authenticatedAs ?? null),
          },
        },
        { provide: MatDialog, useValue: { open: dialogOpen } },
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

  it('identifies myReview by matching the authenticated user id', () => {
    const fixture = createFixture({ authenticatedAs: MY_USER });
    fixture.detectChanges();

    expect(fixture.componentInstance['myReview']()).toEqual(REVIEW_A);
  });

  it('has no myReview when logged out', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance['myReview']()).toBeUndefined();
  });

  it('creates a review when the user has none yet, then reloads and closes the form', async () => {
    const fixture = createFixture({ authenticatedAs: { ...MY_USER, id: 'someone-else' } });
    createReview.mutate.mockResolvedValue(REVIEW_A);
    fixture.componentRef.setInput('id', 'r-1');
    fixture.detectChanges();
    fixture.componentInstance['isReviewFormOpen'].set(true);

    await fixture.componentInstance['submitReview']({ rating: 5, comment: 'Loved it' });

    expect(createReview.mutate).toHaveBeenCalledWith({
      restaurant: 'r-1',
      rating: 5,
      comment: 'Loved it',
    });
    expect(fixture.componentInstance['isReviewFormOpen']()).toBe(false);
  });

  it('updates the existing review when the user already has one', async () => {
    const fixture = createFixture({ authenticatedAs: MY_USER });
    updateReview.mutate.mockResolvedValue(REVIEW_A);
    fixture.componentRef.setInput('id', 'r-1');
    fixture.detectChanges();

    await fixture.componentInstance['submitReview']({ rating: 2, comment: 'Changed my mind' });

    expect(updateReview.mutate).toHaveBeenCalledWith({
      id: REVIEW_A.id,
      body: { rating: 2, comment: 'Changed my mind' },
    });
  });

  it('keeps the form open and does not reload when the mutation fails', async () => {
    const fixture = createFixture({ authenticatedAs: MY_USER });
    updateReview.mutate.mockRejectedValue({ type: 'unknown', status: 500 });
    fixture.componentRef.setInput('id', 'r-1');
    fixture.detectChanges();
    fixture.componentInstance['isReviewFormOpen'].set(true);

    await fixture.componentInstance['submitReview']({ rating: 1, comment: 'x' });

    expect(updateReview.mutate).toHaveBeenCalled();
    expect(fixture.componentInstance['isReviewFormOpen']()).toBe(true);
  });

  it('deletes the review only after the confirm dialog resolves true', async () => {
    const fixture = createFixture({ authenticatedAs: MY_USER });
    dialogOpen.mockReturnValue({ afterClosed: () => of(true) });
    removeReview.mutate.mockResolvedValue(undefined);
    fixture.detectChanges();

    await fixture.componentInstance['confirmDeleteReview']();

    expect(removeReview.mutate).toHaveBeenCalledWith(REVIEW_A.id);
  });

  it('does not delete when the confirm dialog is dismissed', async () => {
    const fixture = createFixture({ authenticatedAs: MY_USER });
    dialogOpen.mockReturnValue({ afterClosed: () => of(false) });
    fixture.detectChanges();

    await fixture.componentInstance['confirmDeleteReview']();

    expect(removeReview.mutate).not.toHaveBeenCalled();
  });
});
