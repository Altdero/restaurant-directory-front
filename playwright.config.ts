import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

/**
 * Two suites, one config, one `webServer` — `npm run e2e` (project
 * `chromium`, everything except `@live`-tagged tests) and `npm run e2e:live`
 * (project `live`, only `@live`-tagged tests — see `e2e/specs/live-smoke.
 * spec.ts` and `e2e/README.md`). The same production build/serve works for
 * both: `apiBaseUrl` is baked in at build time from `.env`'s `API_BASE_URL`,
 * which already points at `http://localhost:8000/api` in local dev — the
 * mocked suite intercepts those requests via `page.route()`, the live one
 * lets them through for real. Loading `.env` here (mirrors
 * `scripts/build.mjs`'s own guarded `loadEnvFile`) is what lets the live
 * spec read `E2E_TEST_USERNAME`/`E2E_TEST_PASSWORD` from this process.
 *
 * `webServer` runs a real production build + `serve:ssr`, not `ng serve` —
 * confirmed empirically while wiring this up: `ng serve` actually runs the
 * full `server.ts` SSR middleware in dev too (not a plain static dev
 * server, as assumed while planning this), so it hits PLAN.md's documented
 * `ng serve` locale-prefix gap on every route (`/` redirects to `/es/`,
 * which 404s under the dev build's single-locale-at-root output). This
 * mirrors CLAUDE.md's own documented interim workaround: build once, serve
 * via `serve:ssr:restaurant-directory`, browse the `/en/...` tree.
 */
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', grepInvert: /@live/, use: { ...devices['Desktop Chrome'] } },
    {
      // No retries: retrying a failure against a throttled, shared live
      // backend risks making the throttling worse, not recovering from it.
      name: 'live',
      grep: /@live/,
      retries: 0,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run serve:ssr:restaurant-directory',
    url: 'http://localhost:4200/en/restaurants',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
