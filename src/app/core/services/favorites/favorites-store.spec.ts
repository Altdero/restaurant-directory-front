import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FAVORITE_DATA } from '@core/interfaces/tokens';
import { AuthStore } from '@core/services/auth/auth.store';
import { NotificationService } from '@core/services/notification/notification.service';

import { FavoritesStore } from './favorites-store';

function fakeResource(value: unknown) {
  return {
    value: signal(value),
    isLoading: signal(false),
    error: signal(undefined),
    reload: vi.fn(),
  };
}

describe('FavoritesStore', () => {
  let isAuthenticated: ReturnType<typeof signal<boolean>>;
  let list: ReturnType<typeof vi.fn>;
  let toggleMutate: ReturnType<typeof vi.fn>;
  let notifyError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isAuthenticated = signal(false);
    list = vi.fn();
    toggleMutate = vi.fn();
    notifyError = vi.fn();
  });

  /**
   * `list` is called once, synchronously, the moment `FavoritesStore` is
   * constructed (see the store's doc comment) — any `list.mockReturnValue(...)`
   * a test needs must be set up before calling this, not after.
   */
  function createStore() {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FAVORITE_DATA,
          useValue: {
            list,
            toggle: () => ({
              isPending: signal(false),
              error: signal(undefined),
              mutate: toggleMutate,
            }),
          },
        },
        { provide: AuthStore, useValue: { isAuthenticated } },
        { provide: NotificationService, useValue: { error: notifyError } },
      ],
    });

    return TestBed.inject(FavoritesStore);
  }

  it('never fetches favorites for an anonymous visitor', () => {
    list.mockReturnValue(fakeResource(undefined));
    createStore();
    TestBed.tick();

    expect(list).toHaveBeenCalledTimes(1);
    const query = list.mock.calls[0][0];
    expect(query()).toBeUndefined();
  });

  it('seeds favorited ids from the first page once authenticated', () => {
    list.mockReturnValue(
      fakeResource({
        count: 2,
        next: null,
        previous: null,
        results: [
          { id: 'f-1', restaurant: { id: 'r-1' }, createdAt: new Date() },
          { id: 'f-2', restaurant: { id: 'r-2' }, createdAt: new Date() },
        ],
      }),
    );
    const store = createStore();
    isAuthenticated.set(true);
    TestBed.tick();

    expect(list).toHaveBeenCalled();
    expect(store.favoritedIds()).toEqual(new Set(['r-1', 'r-2']));
  });

  it('clears favorited ids on logout', () => {
    list.mockReturnValue(
      fakeResource({
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 'f-1', restaurant: { id: 'r-1' }, createdAt: new Date() }],
      }),
    );
    const store = createStore();
    isAuthenticated.set(true);
    TestBed.tick();
    expect(store.favoritedIds().size).toBe(1);

    isAuthenticated.set(false);
    TestBed.tick();

    expect(store.favoritedIds().size).toBe(0);
  });

  it('flips the id optimistically, then reconciles with the server result', async () => {
    list.mockReturnValue(fakeResource(undefined));
    toggleMutate.mockResolvedValue({ favorited: true });
    const store = createStore();

    const promise = store.toggle('r-9');
    expect(store.favoritedIds().has('r-9')).toBe(true);
    await promise;

    expect(store.favoritedIds().has('r-9')).toBe(true);
    expect(toggleMutate).toHaveBeenCalledWith('r-9');
  });

  it('rolls back the optimistic flip and notifies on failure', async () => {
    list.mockReturnValue(fakeResource(undefined));
    toggleMutate.mockRejectedValue({ type: 'unknown', status: 500 });
    const store = createStore();

    await store.toggle('r-9');

    expect(store.favoritedIds().has('r-9')).toBe(false);
    expect(notifyError).toHaveBeenCalled();
  });
});
