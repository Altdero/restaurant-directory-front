import { expect, test } from '@playwright/test';

import { API_BASE, mockGet, mockMethod } from '../mocks/api-mocks';
import { mockAuthenticatedSession } from '../mocks/session';
import restaurantsList from '../fixtures/restaurants-list.json';
import categories from '../fixtures/categories.json';
import usersMeOwner from '../fixtures/users-me-owner.json';
import usersMe from '../fixtures/users-me.json';
import restaurantCreateResponse from '../fixtures/restaurant-create-response.json';
import restaurantUpdateResponse from '../fixtures/restaurant-update-response.json';

const GUADALAJARA_ID = restaurantsList.results[1].id;

test.describe('owner restaurant CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page, { user: usersMeOwner });
    await mockGet(page, '/restaurants/my/', restaurantsList);
    await mockGet(page, '/categories/', categories);
  });

  test('lists the owner’s restaurants', async ({ page }) => {
    await page.goto('/en/my/restaurants');

    await expect(page.getByRole('heading', { name: 'My restaurants' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(restaurantsList.results.length);
  });

  test('creates a restaurant, sending the create-mode defaults for undeferred fields', async ({
    page,
  }) => {
    await page.goto('/en/my/restaurants');
    await page.getByRole('link', { name: 'Add restaurant' }).click();
    await expect(page).toHaveURL('/en/my/restaurants/new');

    await page.locator('input[formcontrolname="name"]').fill('New Spot');

    let capturedBody: unknown;
    await page.route(`${API_BASE}/restaurants/`, async (route) => {
      if (route.request().method() !== 'POST') {
        return route.fallback();
      }
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(restaurantCreateResponse),
      });
    });

    await page.getByRole('button', { name: 'Create restaurant' }).click();

    await expect(page).toHaveURL('/en/my/restaurants');
    expect(capturedBody).toMatchObject({
      name: 'New Spot',
      cover_image: '',
      opening_hours: {},
      latitude: null,
      longitude: null,
    });
  });

  test('edits a restaurant, omitting the deferred fields from the PATCH body', async ({ page }) => {
    await mockGet(page, `/restaurants/${GUADALAJARA_ID}/`, restaurantsList.results[1]);

    await page.goto('/en/my/restaurants');
    await page
      .getByRole('article')
      .filter({ hasText: 'Guadalajara' })
      .getByRole('link', { name: 'Edit' })
      .click();
    await expect(page).toHaveURL(`/en/my/restaurants/${GUADALAJARA_ID}/edit`);
    await expect(page.locator('input[formcontrolname="name"]')).toHaveValue('La Trattoria');

    await page.locator('input[formcontrolname="name"]').fill('La Trattoria Renamed');

    let capturedBody: unknown;
    await page.route(`${API_BASE}/restaurants/${GUADALAJARA_ID}/`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.fallback();
      }
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(restaurantUpdateResponse),
      });
    });

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page).toHaveURL('/en/my/restaurants');
    expect(capturedBody).toMatchObject({ name: 'La Trattoria Renamed' });
    expect(capturedBody).not.toHaveProperty('cover_image');
    expect(capturedBody).not.toHaveProperty('opening_hours');
    expect(capturedBody).not.toHaveProperty('latitude');
    expect(capturedBody).not.toHaveProperty('longitude');
  });

  test('deletes a restaurant only after the confirm dialog is confirmed', async ({ page }) => {
    await page.goto('/en/my/restaurants');
    const guadalajaraRow = page.getByRole('article').filter({ hasText: 'Guadalajara' });

    await guadalajaraRow.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('article')).toHaveCount(restaurantsList.results.length);

    let deleteCalled = false;
    await mockMethod(page, `/restaurants/${GUADALAJARA_ID}/`, 'DELETE', null, 204);
    page.on('request', (request) => {
      if (request.method() === 'DELETE' && request.url().includes(GUADALAJARA_ID)) {
        deleteCalled = true;
      }
    });
    await mockGet(page, '/restaurants/my/', {
      ...restaurantsList,
      count: 1,
      results: [restaurantsList.results[0]],
    });

    await guadalajaraRow.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByRole('article')).toHaveCount(1);
    expect(deleteCalled).toBe(true);
  });

  test('redirects a non-owner away from the owner dashboard', async ({ page }) => {
    await mockAuthenticatedSession(page, { user: usersMe });

    await page.goto('/en/my/restaurants');

    await expect(page).toHaveURL('/en/');
  });
});
