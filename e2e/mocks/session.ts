import type { Page } from '@playwright/test';

import loginResponse from '../fixtures/login-response.json';
import usersMe from '../fixtures/users-me.json';
import favoritesSeedEmpty from '../fixtures/favorites-seed-empty.json';
import { EMPTY_PAGE, mockFavoritesList, mockGet, mockMethod } from './api-mocks';

/**
 * `AuthStore`'s constructor always attempts a silent `POST /auth/refresh/`
 * on the browser, before setting `initialized` — every page hangs on that
 * signal (guards, `MainToolbar`) until it resolves one way or the other, so
 * every spec must mock this before navigating, whether the scenario is
 * logged in or out.
 */
export async function mockAnonymousSession(page: Page): Promise<void> {
  await mockMethod(
    page,
    '/auth/refresh/',
    'POST',
    { detail: 'Authentication credentials were not provided.' },
    401,
  );
  await mockFavoritesList(page, { seed: EMPTY_PAGE });
}

export async function mockAuthenticatedSession(
  page: Page,
  options: { user?: unknown; favoritesSeed?: unknown } = {},
): Promise<void> {
  await mockMethod(page, '/auth/refresh/', 'POST', loginResponse);
  await mockGet(page, '/users/me/', options.user ?? usersMe);
  await mockFavoritesList(page, { seed: options.favoritesSeed ?? favoritesSeedEmpty });
}
