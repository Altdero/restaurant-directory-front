import { expect, test } from '@playwright/test';

import { mockGet, mockMethod, mockReviews } from '../mocks/api-mocks';
import { mockAnonymousSession, mockAuthenticatedSession } from '../mocks/session';
import restaurantDetail from '../fixtures/restaurant-detail.json';
import menuItems from '../fixtures/menu-items.json';
import reviewsPage1 from '../fixtures/reviews-page-1.json';
import usersMe from '../fixtures/users-me.json';
import reviewCreateResponse from '../fixtures/review-create-response.json';
import reviewUpdateResponse from '../fixtures/review-update-response.json';

const RESTAURANT_ID = restaurantDetail.id;

async function goToDetail(page: import('@playwright/test').Page): Promise<void> {
  await mockGet(page, `/restaurants/${RESTAURANT_ID}/`, restaurantDetail);
  await mockGet(page, '/menu-items/', menuItems);
  await page.goto(`/en/restaurants/${RESTAURANT_ID}`);
}

test.describe('reviews', () => {
  test('prompts an anonymous visitor to log in, with a returnUrl back to this page', async ({
    page,
  }) => {
    await mockAnonymousSession(page);
    await mockReviews(page, { initial: reviewsPage1 });
    await goToDetail(page);

    const prompt = page.getByRole('link', { name: 'Log in to write a review' });
    await expect(prompt).toBeVisible();
    await prompt.click();

    await expect(page).toHaveURL(`/en/login?returnUrl=%2Frestaurants%2F${RESTAURANT_ID}`);
  });

  test('lets an authenticated user with no existing review write one', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockReviews(page, { initial: reviewsPage1 });
    await goToDetail(page);

    await page.getByRole('button', { name: 'Write a review' }).click();
    await page.getByRole('combobox', { name: 'Rating' }).click();
    await page.getByRole('option', { name: '5', exact: true }).click();
    await page.locator('textarea[formcontrolname="comment"]').fill('Fantastic!');

    const created = {
      ...reviewCreateResponse,
      restaurant: RESTAURANT_ID,
      user: usersMe.id,
      username: usersMe.username,
      rating: 5,
      comment: 'Fantastic!',
    };
    await mockMethod(page, '/reviews/', 'POST', created);
    await mockReviews(page, {
      initial: { ...reviewsPage1, results: [...reviewsPage1.results, created] },
    });

    await page.getByRole('button', { name: 'Post review' }).click();

    await expect(page.getByText('Your review')).toBeVisible();
    await expect(page.getByText('Fantastic!')).toBeVisible();
  });

  test('lets the author edit their existing review', async ({ page }) => {
    const myReview = {
      ...reviewsPage1.results[0],
      user: usersMe.id,
      username: usersMe.username,
      comment: 'Original comment',
    };
    await mockAuthenticatedSession(page);
    await mockReviews(page, { initial: { ...reviewsPage1, results: [myReview] } });
    await goToDetail(page);

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('textarea[formcontrolname="comment"]').fill('Updated comment');

    const updated = { ...reviewUpdateResponse, ...myReview, comment: 'Updated comment' };
    await mockMethod(page, `/reviews/${myReview.id}/`, 'PATCH', updated);
    await mockReviews(page, { initial: { ...reviewsPage1, results: [updated] } });

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Updated comment')).toBeVisible();
  });

  test('deletes the review only after the confirm dialog is confirmed', async ({ page }) => {
    const myReview = { ...reviewsPage1.results[0], user: usersMe.id, username: usersMe.username };
    await mockAuthenticatedSession(page);
    await mockReviews(page, { initial: { ...reviewsPage1, results: [myReview] } });
    await goToDetail(page);

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Your review', { exact: true })).toBeVisible();

    let deleteCalled = false;
    await mockMethod(page, `/reviews/${myReview.id}/`, 'DELETE', null, 204);
    page.on('request', (request) => {
      if (request.method() === 'DELETE' && request.url().includes(myReview.id)) {
        deleteCalled = true;
      }
    });
    await mockReviews(page, { initial: { ...reviewsPage1, results: [] } });

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByText('No reviews yet.')).toBeVisible();
    expect(deleteCalled).toBe(true);
  });
});
