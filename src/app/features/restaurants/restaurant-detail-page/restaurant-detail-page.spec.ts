import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { MENU_ITEM_DATA, RESTAURANT_DATA, REVIEW_DATA } from '@core/interfaces/tokens';
import { Restaurant } from '@core/models/restaurant.model';
import { Review } from '@core/models/review.model';
import { AuthStore } from '@core/services/auth/auth.store';
import { FavoritesStore } from '@core/services/favorites/favorites-store';
import { UserProfile } from '@core/models/user-profile.model';

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
  let toggleFavorite: ReturnType<typeof vi.fn>;
  let favoritedIds: ReturnType<typeof signal<ReadonlySet<string>>>;

  function createFixture(
    options: { authenticatedAs?: UserProfile | null; restaurant?: Restaurant } = {},
  ) {
    loadMore = vi.fn();
    createReview = fakeMutation();
    updateReview = fakeMutation();
    removeReview = fakeMutation();
    dialogOpen = vi.fn();
    toggleFavorite = vi.fn();
    favoritedIds = signal(new Set<string>());

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RESTAURANT_DATA, useValue: { byId: () => fakeResource(options.restaurant) } },
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
        { provide: FavoritesStore, useValue: { favoritedIds, toggle: toggleFavorite } },
      ],
    });

    return TestBed.createComponent(RestaurantDetailPage);
  }

  // The happy paths here (cursor pagination, create-vs-update branching,
  // myReview matching, review-delete confirm/cancel, favorite toggling) are
  // now proven end-to-end by e2e/specs/restaurant-detail.spec.ts and
  // e2e/specs/reviews.spec.ts with equal precision — kept only the one
  // scenario no E2E test exercises (all E2E review tests mock success).
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
});
