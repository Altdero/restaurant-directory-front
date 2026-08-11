import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

/**
 * Must stay in sync with `i18n.locales` / `i18n.sourceLocale` in angular.json.
 * The engine's own Accept-Language redirect falls back to the first supported
 * locale, which is `en` here (the source locale) — not the Spanish default this
 * project requires, so unprefixed requests are redirected explicitly instead.
 */
const SUPPORTED_LOCALES = ['es', 'en'];
const DEFAULT_LOCALE = 'es';

const allowedHosts = process.env['ALLOWED_HOSTS']
  ?.split(',')
  .map((host) => host.trim())
  .filter(Boolean);

const app = express();
const angularApp = new AngularNodeAppEngine({ allowedHosts });

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Redirect any request whose path does not start with a supported locale
 * segment to its `/es/...` equivalent, preserving the rest of the path and
 * the query string. This covers both the bare `/` root and unprefixed deep
 * links (e.g. `/restaurants`), so no page is reachable at two URLs.
 */
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }

  const [, firstSegment] = req.path.split('/');
  if (SUPPORTED_LOCALES.includes(firstSegment)) {
    next();
    return;
  }

  const queryIndex = req.url.indexOf('?');
  const search = queryIndex === -1 ? '' : req.url.slice(queryIndex);
  res.redirect(302, `/${DEFAULT_LOCALE}${req.path}${search}`);
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
