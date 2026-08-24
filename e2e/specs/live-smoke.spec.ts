import { expect, test } from '@playwright/test';

/**
 * Runs against a real backend (`npm run e2e:live`, tagged `@live` — see
 * `playwright.config.ts`'s `live` project, which selects only this tag and
 * `e2e/README.md`). No `page.route()` mocking anywhere in this file — every
 * request hits `http://localhost:8000/api` for real. Its job is catching
 * contract drift between this app and the real API, not coverage (the
 * mocked default suite already covers behavior/branching in detail), so
 * it's kept deliberately small: anonymous clients on this API are
 * throttled at 30 req/min, and every step here after login is a real
 * request against a shared local dev backend.
 *
 * Needs `E2E_TEST_USERNAME`/`E2E_TEST_PASSWORD` (a real seeded account) —
 * skips with a clear reason rather than failing when they're unset, since
 * this suite depends on external state the repo itself can't provide.
 */
test.describe('live smoke', { tag: '@live' }, () => {
  test('logs in, browses to a restaurant, and round-trips a favorite toggle', async ({ page }) => {
    const username = process.env['E2E_TEST_USERNAME'];
    const password = process.env['E2E_TEST_PASSWORD'];
    test.skip(
      !username || !password,
      'E2E_TEST_USERNAME/E2E_TEST_PASSWORD are not set — see e2e/README.md',
    );

    await page.goto('/en/login');
    await page.locator('input[formcontrolname="username"]').fill(username!);
    await page.locator('input[formcontrolname="password"]').fill(password!);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('button', { name: username! })).toBeVisible();

    await page.goto('/en/restaurants');
    const firstCard = page.getByRole('article').first();
    await expect(firstCard).toBeVisible();
    const restaurantName = await firstCard.locator('h3').innerText();

    await firstCard.getByRole('heading', { level: 3 }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(restaurantName);

    const heart = page.getByRole('button', { name: /favorites/ });
    const wasFavorited = (await heart.getAttribute('aria-pressed')) === 'true';

    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', String(!wasFavorited));

    // Leave no residue on the shared seeded account — toggle back to the
    // state this restaurant was in before the test ran.
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', String(wasFavorited));
  });
});
