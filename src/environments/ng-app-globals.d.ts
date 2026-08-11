/**
 * Replaced with a literal string at build time via the `define` esbuild option
 * (see scripts/build.mjs), so the production API URL never needs to be
 * hardcoded in source. Deliberately not `process.env.*`: `@types/node`'s
 * ambient `process` types `env` values as `string | undefined`, which would
 * force a non-null assertion here even though `define` guarantees a literal
 * string is always substituted before this identifier reaches the bundle.
 */
declare const NG_APP_API_BASE_URL: string;
