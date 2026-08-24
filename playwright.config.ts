import { defineConfig, devices } from '@playwright/test';

/**
 * Mocked default suite only — no backend required (see `e2e/README.md`).
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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run serve:ssr:restaurant-directory',
    url: 'http://localhost:4200/en/restaurants',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
