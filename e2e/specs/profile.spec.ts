import { expect, test } from '@playwright/test';

import { API_BASE, mockMethod } from '../mocks/api-mocks';
import { mockAuthenticatedSession } from '../mocks/session';
import usersMe from '../fixtures/users-me.json';
import profileUpdateResponse from '../fixtures/profile-update-response.json';
import uploadSignatureResponse from '../fixtures/upload-signature-response.json';

async function mockUpload(page: import('@playwright/test').Page): Promise<void> {
  await mockMethod(page, '/uploads/signature/', 'POST', uploadSignatureResponse);
  await page.route('https://api.cloudinary.com/v1_1/demo/image/upload', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
      }),
    }),
  );
}

test.describe('profile', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page, { user: usersMe });
  });

  test('shows the current profile values', async ({ page }) => {
    await page.goto('/en/profile');

    await expect(page.locator('input[formcontrolname="email"]')).toHaveValue(usersMe.email);
    await expect(page.getByText(`Username: ${usersMe.username}`)).toBeVisible();
  });

  test('updates the profile fields and avatar, sending the PATCH body', async ({ page }) => {
    await page.goto('/en/profile');

    await page.locator('input[formcontrolname="first_name"]').fill('Ana');
    await page.locator('input[formcontrolname="last_name"]').fill('Ruiz');
    await page.locator('input[formcontrolname="phone"]').fill('555-0100');

    await mockUpload(page);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-bytes'),
    });
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeEnabled();

    let capturedBody: unknown;
    await page.route(`${API_BASE}/users/me/`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.fallback();
      }
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profileUpdateResponse),
      });
    });

    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.locator('input[formcontrolname="first_name"]')).toHaveValue('Ana');
    expect(capturedBody).toMatchObject({
      first_name: 'Ana',
      last_name: 'Ruiz',
      phone: '555-0100',
      avatar: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
    });
  });
});
