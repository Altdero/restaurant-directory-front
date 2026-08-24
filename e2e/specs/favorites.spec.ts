import { expect, test } from '@playwright/test';

import { EMPTY_PAGE, mockFavoritesList, mockGet, mockMethod } from '../mocks/api-mocks';
import { mockAnonymousSession, mockAuthenticatedSession } from '../mocks/session';
import restaurantsList from '../fixtures/restaurants-list.json';
import categories from '../fixtures/categories.json';
import favoriteToggleOn from '../fixtures/favorite-toggle-on.json';
import favoritesPage from '../fixtures/favorites-page.json';

test.describe('favorites', () => {
  test('shows the heart as a login link for an anonymous visitor', async ({ page }) => {
    await mockAnonymousSession(page);
    await mockGet(page, '/restaurants/', restaurantsList);
    await mockGet(page, '/categories/', categories);

    await page.goto('/en/restaurants');

    await expect(page.getByRole('link', { name: 'Add to favorites' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to favorites' })).toHaveCount(0);
  });

  test('fills the heart optimistically before the toggle request resolves', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockGet(page, '/restaurants/', restaurantsList);
    await mockGet(page, '/categories/', categories);
    await page.route('**/api/favorites/toggle/', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(favoriteToggleOn),
      });
    });

    await page.goto('/en/restaurants');
    const heart = page.getByRole('button', { name: 'Add to favorites' }).first();
    await heart.click();

    await expect(
      page.getByRole('button', { name: 'Remove from favorites' }).first(),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('lists favorited restaurants on /favorites and removes one on un-favorite', async ({
    page,
  }) => {
    await mockAuthenticatedSession(page);
    // Registered after mockAuthenticatedSession's own (empty) seed mock —
    // Playwright routes are LIFO, and this single handler covers both the
    // app-wide seed and the page's own paginated list, so it fully
    // supersedes the earlier one rather than merging with it.
    const seedWithFavorite = {
      count: 1,
      next: null,
      previous: null,
      results: favoritesPage.results,
    };
    await mockFavoritesList(page, { seed: seedWithFavorite, paginated: favoritesPage });

    await page.goto('/en/favorites');

    await expect(page.getByRole('heading', { name: 'Your favorites' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(1);

    await mockMethod(page, '/favorites/toggle/', 'POST', { favorited: false });
    await mockFavoritesList(page, { seed: EMPTY_PAGE, paginated: EMPTY_PAGE });

    await page.getByRole('button', { name: 'Remove from favorites' }).click();

    await expect(page.getByText("You haven't added any favorites yet.")).toBeVisible();
  });
});
