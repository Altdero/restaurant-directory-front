#!/usr/bin/env node
/**
 * Wraps `ng build` to inject NG_APP_API_BASE_URL as a build-time literal via
 * esbuild's `define`, so the production API URL never needs to be hardcoded
 * in source (see src/environments/environment.prod.ts). Only the production
 * configuration references this identifier — development builds use a plain
 * hardcoded localhost default in environment.ts and never need this script.
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
if (!apiBaseUrl) {
  console.error(
    'Missing required environment variable: API_BASE_URL\n' +
      'Copy .env.example to .env for a local build, or set it in your deployment environment.',
  );
  process.exit(1);
}

const result = spawnSync(
  'npx',
  ['ng', 'build', `--define=NG_APP_API_BASE_URL=${JSON.stringify(apiBaseUrl)}`, ...process.argv.slice(2)],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);