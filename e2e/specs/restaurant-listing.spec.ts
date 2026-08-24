import { expect, test } from '@playwright/test';

import { EMPTY_PAGE, mockGet } from '../mocks/api-mocks';
import { mockAnonymousSession } from '../mocks/session';
import restaurantsList from '../fixtures/restaurants-list.json';
import categories from '../fixtures/categories.json';

test.describe('restaurant listing', () => {
  test.beforeEach(async ({ page }) => {
    await mockAnonymousSession(page);
    await mockGet(page, '/categories/', categories);
  });

  test('renders restaurant cards from the API response', async ({ page }) => {
    await mockGet(page, '/restaurants/', restaurantsList);
    await page.goto('/en/restaurants');

    await expect(page.getByRole('article')).toHaveCount(restaurantsList.results.length);
    await expect(page.getByText('Mexico City')).toBeVisible();
    await expect(page.getByText('Guadalajara')).toBeVisible();
  });

  test('applying a filter re-fetches with the matching query params', async ({ page }) => {
    await mockGet(page, '/restaurants/', restaurantsList);
    await page.goto('/en/restaurants');

    const guadalajaraOnly = { ...restaurantsList, count: 1, results: [restaurantsList.results[1]] };
    await mockGet(page, '/restaurants/', guadalajaraOnly);

    await page.locator('input[formcontrolname="city"]').fill('Guadalajara');
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page).toHaveURL(/city=Guadalajara/);
    await expect(page.getByText(restaurantsList.results[1].city)).toBeVisible();
  });

  test('Clear resets filters and removes them from the URL', async ({ page }) => {
    await mockGet(page, '/restaurants/', restaurantsList);
    await page.goto('/en/restaurants?city=Guadalajara');

    await page.getByRole('button', { name: 'Clear' }).click();

    await expect(page).not.toHaveURL(/city=/);
  });

  test('paginates using the prev/next controls', async ({ page }) => {
    const bigPage = { ...restaurantsList, count: 24 };
    await mockGet(page, '/restaurants/', bigPage);
    await page.goto('/en/restaurants');

    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page).toHaveURL(/page=2/);
  });

  test('shows the empty state when there are no results', async ({ page }) => {
    await mockGet(page, '/restaurants/', EMPTY_PAGE);
    await page.goto('/en/restaurants');

    await expect(page.getByText('No restaurants match your filters.')).toBeVisible();
  });

  test('shows an error state and retries on demand', async ({ page }) => {
    await mockGet(page, '/restaurants/', { detail: 'Server exploded' }, 500);
    await page.goto('/en/restaurants');

    await expect(page.getByRole('alert')).toBeVisible();

    await mockGet(page, '/restaurants/', restaurantsList);
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.getByRole('article')).toHaveCount(restaurantsList.results.length);
  });
});
