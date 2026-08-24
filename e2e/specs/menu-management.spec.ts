import { expect, test } from '@playwright/test';

import { API_BASE, mockGet, mockMethod } from '../mocks/api-mocks';
import { mockAuthenticatedSession } from '../mocks/session';
import restaurantDetail from '../fixtures/restaurant-detail.json';
import menuItems from '../fixtures/menu-items.json';
import usersMeOwner from '../fixtures/users-me-owner.json';
import uploadSignatureResponse from '../fixtures/upload-signature-response.json';
import menuItemCreateResponse from '../fixtures/menu-item-create-response.json';
import menuItemUpdateResponse from '../fixtures/menu-item-update-response.json';

const RESTAURANT_ID = restaurantDetail.id;
const PIZZA_ID = menuItems.results[2].id;

async function mockUpload(page: import('@playwright/test').Page): Promise<void> {
  await mockMethod(page, '/uploads/signature/', 'POST', uploadSignatureResponse);
  await page.route('https://api.cloudinary.com/v1_1/demo/image/upload', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ secure_url: 'https://res.cloudinary.com/demo/image/upload/item.jpg' }),
    }),
  );
}

test.describe('menu item management', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page, { user: usersMeOwner });
    await mockGet(page, `/restaurants/${RESTAURANT_ID}/`, restaurantDetail);
    await mockGet(page, '/menu-items/', menuItems);
  });

  test('lists the restaurant’s menu items grouped by category', async ({ page }) => {
    await page.goto(`/en/my/restaurants/${RESTAURANT_ID}/menu`);

    await expect(page.getByRole('heading', { name: /Menu for/ })).toContainText(
      restaurantDetail.name,
    );
    await expect(page.getByRole('article')).toHaveCount(menuItems.results.length);
  });

  test('creates a menu item, including an uploaded image', async ({ page }) => {
    await page.goto(`/en/my/restaurants/${RESTAURANT_ID}/menu`);
    await page.getByRole('button', { name: 'Add menu item' }).click();

    await page.locator('input[formcontrolname="name"]').fill('New Item');
    await page.locator('input[formcontrolname="price"]').fill('5');

    await mockUpload(page);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'item.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-bytes'),
    });
    await expect(page.getByRole('button', { name: 'Add menu item' })).toBeEnabled();

    let capturedBody: unknown;
    await page.route(`${API_BASE}/menu-items/`, async (route) => {
      if (route.request().method() !== 'POST') {
        return route.fallback();
      }
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(menuItemCreateResponse),
      });
    });
    await mockGet(page, '/menu-items/', {
      ...menuItems,
      count: menuItems.results.length + 1,
      results: [...menuItems.results, menuItemCreateResponse],
    });

    await page.getByRole('button', { name: 'Add menu item' }).click();

    await expect(page.getByRole('article')).toHaveCount(menuItems.results.length + 1);
    expect(capturedBody).toMatchObject({
      restaurant: RESTAURANT_ID,
      name: 'New Item',
      price: 5,
      image: 'https://res.cloudinary.com/demo/image/upload/item.jpg',
    });
  });

  test('edits an existing menu item', async ({ page }) => {
    await page.goto(`/en/my/restaurants/${RESTAURANT_ID}/menu`);
    const pizzaRow = page.getByRole('article').filter({ hasText: 'Margherita Pizza' });
    await pizzaRow.getByRole('button', { name: 'Edit' }).click();

    await expect(page.locator('input[formcontrolname="name"]')).toHaveValue('Margherita Pizza');
    await page.locator('input[formcontrolname="name"]').fill('Margherita Pizza Renamed');

    let capturedBody: unknown;
    await page.route(`${API_BASE}/menu-items/${PIZZA_ID}/`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.fallback();
      }
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(menuItemUpdateResponse),
      });
    });

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('button', { name: 'Add menu item' })).toBeVisible();
    expect(capturedBody).toMatchObject({ name: 'Margherita Pizza Renamed' });
  });

  test('deletes a menu item only after the confirm dialog is confirmed', async ({ page }) => {
    await page.goto(`/en/my/restaurants/${RESTAURANT_ID}/menu`);
    const pizzaRow = page.getByRole('article').filter({ hasText: 'Margherita Pizza' });

    await pizzaRow.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('article')).toHaveCount(menuItems.results.length);

    let deleteCalled = false;
    await mockMethod(page, `/menu-items/${PIZZA_ID}/`, 'DELETE', null, 204);
    page.on('request', (request) => {
      if (request.method() === 'DELETE' && request.url().includes(PIZZA_ID)) {
        deleteCalled = true;
      }
    });
    await mockGet(page, '/menu-items/', {
      ...menuItems,
      count: menuItems.results.length - 1,
      results: menuItems.results.filter((item) => item.id !== PIZZA_ID),
    });

    await pizzaRow.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByRole('article')).toHaveCount(menuItems.results.length - 1);
    expect(deleteCalled).toBe(true);
  });
});
