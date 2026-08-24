#!/usr/bin/env node
/**
 * Wraps `ng build` to inject NG_APP_API_BASE_URL and NG_APP_SITE_URL as
 * build-time literals via esbuild's `define`, so neither the production API
 * URL nor this app's own deployed origin needs to be hardcoded in source
 * (see src/environments/environment.prod.ts). Only the production
 * configuration references these identifiers — development builds use plain
 * hardcoded localhost defaults in environment.ts and never need this script.
 *
 * Loads .env for local builds; a no-op on Render, where the platform injects
 * environment variables into the process directly.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const apiBaseUrl = process.env['API_BASE_URL'];
const siteUrl = process.env['SITE_URL'];
const missing = [
  !apiBaseUrl && 'API_BASE_URL',
  !siteUrl && 'SITE_URL',
].filter(Boolean);
if (missing.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missing.join(', ')}\n` +
      'Copy .env.example to .env for a local build, or set them in your deployment environment.',
  );
  process.exit(1);
}

const result = spawnSync(
  'npx',
  [
    'ng',
    'build',
    `--define=NG_APP_API_BASE_URL=${JSON.stringify(apiBaseUrl)}`,
    `--define=NG_APP_SITE_URL=${JSON.stringify(siteUrl)}`,
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);