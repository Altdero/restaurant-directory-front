import { expect, test } from '@playwright/test';

import { mockGet, mockReviews } from '../mocks/api-mocks';
import { mockAnonymousSession } from '../mocks/session';
import restaurantDetail from '../fixtures/restaurant-detail.json';
import menuItems from '../fixtures/menu-items.json';
import reviewsPage1 from '../fixtures/reviews-page-1.json';
import reviewsPage1WithNext from '../fixtures/reviews-page-1-with-next.json';
import reviewsPage2 from '../fixtures/reviews-page-2.json';
import restaurantNotFound from '../fixtures/restaurant-not-found.json';

const RESTAURANT_ID = restaurantDetail.id;

test.describe('restaurant detail', () => {
  test.beforeEach(async ({ page }) => {
    await mockAnonymousSession(page);
  });

  test('renders the restaurant, its menu and its reviews', async ({ page }) => {
    await mockGet(page, `/restaurants/${RESTAURANT_ID}/`, restaurantDetail);
    await mockGet(page, '/menu-items/', menuItems);
    await mockReviews(page, { initial: reviewsPage1 });

    await page.goto(`/en/restaurants/${RESTAURANT_ID}`);

    await expect(page.getByRole('heading', { name: restaurantDetail.name })).toBeVisible();
    await expect(page.getByText(restaurantDetail.address)).toBeVisible();
    await expect(page.getByText(menuItems.results[0].name)).toBeVisible();
    await expect(page.getByText(reviewsPage1.results[0].comment)).toBeVisible();
  });

  test('loads more reviews by following the API-provided next URL', async ({ page }) => {
    await mockGet(page, `/restaurants/${RESTAURANT_ID}/`, restaurantDetail);
    await mockGet(page, '/menu-items/', menuItems);
    await mockReviews(page, { initial: reviewsPage1WithNext, next: reviewsPage2 });

    await page.goto(`/en/restaurants/${RESTAURANT_ID}`);
    await expect(page.getByText(reviewsPage1WithNext.results[0].comment)).toBeVisible();

    await page.getByRole('button', { name: /load more/i }).click();

    await expect(page.getByText(reviewsPage2.results[0].comment)).toBeVisible();
    await expect(page.getByRole('button', { name: /load more/i })).toHaveCount(0);
  });

  test('shows the real 404 message for a nonexistent restaurant', async ({ page }) => {
    await mockGet(
      page,
      '/restaurants/00000000-0000-0000-0000-000000000000/',
      restaurantNotFound,
      404,
    );

    await page.goto('/en/restaurants/00000000-0000-0000-0000-000000000000');

    await expect(page.getByRole('alert')).toContainText(restaurantNotFound.detail);
  });
});
