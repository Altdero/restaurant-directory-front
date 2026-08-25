import { expect, test } from '@playwright/test';

import { mockGet, mockMethod } from '../mocks/api-mocks';
import { mockAnonymousSession, mockAuthenticatedSession } from '../mocks/session';
import loginResponse from '../fixtures/login-response.json';
import usersMe from '../fixtures/users-me.json';
import restaurantsList from '../fixtures/restaurants-list.json';
import categories from '../fixtures/categories.json';

test.describe('auth', () => {
  test('logs in and shows the username in the toolbar', async ({ page }) => {
    await mockAnonymousSession(page);
    await mockMethod(page, '/auth/login/', 'POST', loginResponse);
    await mockGet(page, '/users/me/', usersMe);

    await page.goto('/en/login');
    await page.locator('input[formcontrolname="username"]').fill(usersMe.username);
    await page.locator('input[formcontrolname="password"]').fill('whatever');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/en/');
    await expect(page.getByRole('button', { name: usersMe.username })).toBeVisible();
  });

  test('shows the real 401 error on bad credentials and does not redirect', async ({ page }) => {
    await mockAnonymousSession(page);
    await mockMethod(
      page,
      '/auth/login/',
      'POST',
      { detail: 'No active account found with the given credentials' },
      401,
    );

    await page.goto('/en/login');
    await page.locator('input[formcontrolname="username"]').fill('nobody');
    await page.locator('input[formcontrolname="password"]').fill('wrong');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('alert')).toContainText('No active account found');
    await expect(page).toHaveURL('/en/login');
  });

  test('flags a password mismatch on register without calling the API', async ({ page }) => {
    await mockAnonymousSession(page);
    let registerCalled = false;
    await page.route('**/api/auth/register/', () => {
      registerCalled = true;
    });

    await page.goto('/en/register');
    await page.locator('input[formcontrolname="username"]').fill('newuser');
    await page.locator('input[formcontrolname="email"]').fill('newuser@example.com');
    await page.locator('input[formcontrolname="password"]').fill('Password1');
    await page.locator('input[formcontrolname="password_confirm"]').fill('Password2');

    await expect(page.getByRole('alert')).toContainText('Passwords do not match');

    // The button stays enabled (inline validation errors are revealed on
    // click, not by disabling the button — see fieldErrorMessage()); the
    // mismatch is still what actually blocks the request.
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('alert')).toContainText('Passwords do not match');
    expect(registerCalled).toBe(false);
  });

  test('redirects an anonymous visitor from /favorites to /login with a returnUrl, and back after login', async ({
    page,
  }) => {
    await mockAnonymousSession(page);
    await mockMethod(page, '/auth/login/', 'POST', loginResponse);
    await mockGet(page, '/users/me/', usersMe);

    await page.goto('/en/favorites');
    await expect(page).toHaveURL('/en/login?returnUrl=%2Ffavorites');

    await page.locator('input[formcontrolname="username"]').fill(usersMe.username);
    await page.locator('input[formcontrolname="password"]').fill('whatever');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/en/favorites');
  });

  test('redirects an already-authenticated visitor away from /login', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.goto('/en/login');
    await expect(page).toHaveURL('/en/');
  });

  test('logs out and reverts the toolbar to Log in / Register', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockMethod(page, '/auth/logout/', 'POST', { detail: 'Logged out' });
    await mockGet(page, '/restaurants/', restaurantsList);
    await mockGet(page, '/categories/', categories);

    await page.goto('/en/restaurants');
    await page.getByRole('button', { name: usersMe.username }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });
});
