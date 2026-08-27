import { expect, test } from '@playwright/test';

import { mockGet } from '../mocks/api-mocks';
import { mockAnonymousSession } from '../mocks/session';
import restaurantsList from '../fixtures/restaurants-list.json';

test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAnonymousSession(page);
    await mockGet(page, '/restaurants/', restaurantsList);
  });

  test('redirects the unprefixed root to the default locale', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/en/');
  });

  test('shows the hero, the CTA, and a live restaurant preview', async ({ page }) => {
    await page.goto('/en/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Find your next favorite restaurant',
    );
    await expect(page.getByRole('article')).toHaveCount(restaurantsList.results.length);
  });

  test('the CTA button navigates to the restaurant listing', async ({ page }) => {
    await page.goto('/en/');

    await page.getByRole('link', { name: 'Browse restaurants' }).click();

    await expect(page).toHaveURL('/en/restaurants');
  });

  test('the "see all restaurants" link navigates to the restaurant listing', async ({ page }) => {
    await page.goto('/en/');

    await page.getByRole('link', { name: 'See all restaurants' }).click();

    await expect(page).toHaveURL('/en/restaurants');
  });

  test('the language switcher swaps locale while staying on the home page', async ({ page }) => {
    await page.goto('/en/');

    await page.getByRole('link', { name: 'Switch language to Español' }).click();

    await expect(page).toHaveURL('/es/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Encuentra tu próximo restaurante favorito',
    );
  });
});
