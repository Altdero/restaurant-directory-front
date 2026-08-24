import { expect, test } from '@playwright/test';

import { mockGet, mockMethod } from '../mocks/api-mocks';
import { mockAuthenticatedSession } from '../mocks/session';
import restaurantsList from '../fixtures/restaurants-list.json';
import categories from '../fixtures/categories.json';
import error429 from '../fixtures/error-429.json';

test.describe('error handling', () => {
  test('shows the generic throttled toast on a 429', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockGet(page, '/restaurants/', error429, 429);
    await mockGet(page, '/categories/', categories);

    await page.goto('/en/restaurants');

    await expect(page.getByText('Too many requests. Please try again in a moment.')).toBeVisible();
  });

  test('forces a logout redirect when a 401 survives a failed refresh retry', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockGet(page, '/restaurants/', restaurantsList);
    await mockGet(page, '/categories/', categories);

    await page.goto('/en/restaurants');
    await expect(page.getByRole('article')).toHaveCount(restaurantsList.results.length);

    // The initial session-rehydration refresh (during goto) already
    // succeeded — this re-registration only affects the interceptor's
    // later retry-refresh attempt below (Playwright routes are LIFO).
    await mockMethod(
      page,
      '/auth/refresh/',
      'POST',
      { detail: 'Token is invalid or expired' },
      401,
    );
    await mockMethod(
      page,
      '/favorites/toggle/',
      'POST',
      { detail: 'Token is invalid or expired', code: 'token_not_valid' },
      401,
    );

    await page.getByRole('button', { name: 'Add to favorites' }).first().click();

    await expect(page).toHaveURL(/\/login/);
  });
});
