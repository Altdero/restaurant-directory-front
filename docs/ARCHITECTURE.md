# Architecture

## Data layer: one interface, two implementations

`httpResource()` returns `HttpResourceRef<T>`; TanStack Query returns `CreateQueryResult`. Neither type may leak into a component. `core/interfaces/` defines the shapes both implementations satisfy:

```ts
export interface AsyncResource<T> {
  readonly value: Signal<T | undefined>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<ApiError | undefined>;
  reload(): void;
}

export interface AsyncMutation<TInput, TResult> {
  readonly isPending: Signal<boolean>;
  readonly error: Signal<ApiError | undefined>;
  mutate(input: TInput): Promise<TResult>;
}
```

Each resource gets one interface (`RestaurantDataService`, `CategoryDataService`, `ReviewDataService`, `MenuItemDataService`, `FavoriteDataService`) built from these two primitives, plus an `InjectionToken`:

```ts
export const RESTAURANT_DATA = new InjectionToken<RestaurantDataService>('RESTAURANT_DATA');
```

`core/services/http-resource/` and `core/services/tanstack/` each implement every interface. `app.config.ts` binds all five tokens to one family, chosen by `environment.dataLayer: 'http-resource' | 'tanstack'`:

```ts
providers: [
  ...(environment.dataLayer === 'tanstack'
    ? provideTanStackDataLayer()
    : provideHttpResourceDataLayer()),
];
```

Components inject `inject(RESTAURANT_DATA)` and never learn which implementation they received. Adding a sixth resource means adding one interface and two implementations — no existing file changes.

Both implementations reuse the same implementation-agnostic pieces: `ApiUrlBuilder` (query serialization), `ApiErrorMapper` (DRF error shapes → a discriminated `ApiError` union), the three pagination-envelope decoders, and the DTO↔model mappers that parse decimal strings and ISO timestamps. The only thing that differs between the two implementations is the fetching mechanism itself — which is also why both are tested against one shared contract suite rather than duplicated test files.

## Rendering strategy

| Route                                                     | Render mode | Why                                                     |
| --------------------------------------------------------- | ----------- | ------------------------------------------------------- |
| `/`, `/categories`                                        | Prerender   | Static, slow-changing content                           |
| `/restaurants`, `/restaurants/:id`, `/categories/:slug`   | Server      | Primary SEO surfaces; need per-request meta and JSON-LD |
| `/login`, `/register`, `/favorites`, `/profile`, `/my/**` | Client      | See below                                               |
| `/**`                                                     | Server      | 404 with correct HTTP status                            |

Every protected route is client-rendered by necessity, not convenience: the access token lives in memory only, and the refresh token is an `httpOnly` cookie scoped to `/api/auth/` — the Angular SSR server never receives it. Server-rendering a protected page would only ever produce a logged-out shell.

## i18n

Native `@angular/localize`, compiled once and inlined per locale (`I18nInliner`, part of `@angular/build:application`) — not a runtime translation library. `subPath` in `angular.json`'s `i18n` block sets both the URL prefix and the HTML base href, so the Angular route table itself is locale-agnostic: `routerLink="/restaurants"` resolves to `/es/restaurants` or `/en/restaurants` depending on which compiled bundle is currently loaded. `@angular/ssr`'s `AngularAppEngine` serves every locale from a single Node process, reading the locale from the first URL path segment per request.

Full detail: `prompt_restaurant_frontend.md` § Internationalization (not committed — internal reference only).

## Models

Each resource has one `*.model.ts` file in `core/models/` holding three things together: the raw `*Dto` interface (snake_case, matching the API's wire format exactly — decimals and dates as strings), the app-facing model (camelCase, decimals parsed to `number`, timestamps parsed to `Date`), and a `to*()` mapper function between them. Resources whose write shape differs from their read shape (`RestaurantWrite` vs. `Restaurant`, `ReviewCreate`/`ReviewUpdate` vs. `Review`) get separate write types rather than one interface with optional fields — see `docs/API.md` for which resources this applies to.

`core/utils/decimal.ts` (`parseDecimal`) and `core/utils/date.ts` (`parseApiDate`) back every mapper and throw on invalid input rather than silently producing `NaN`/`Invalid Date`. `core/utils/error-mapper.ts` (`mapApiError`) normalizes every DRF error shape into one discriminated `ApiError` union, branching on response shape and status code, never on message text. `core/utils/api-url.builder.ts` handles query serialization for the page-number and limit/offset pagination styles (structurally identical, both `{ count, next, previous, results }`); cursor pagination is deliberately unsupported there — a `cursor` value must only ever come from a `next`/`previous` URL the API already returned.

## Environment configuration

`environment.ts` (dev) hardcodes `apiBaseUrl: 'http://localhost:8000/api'` — a conventional local default, not a deployment secret. `environment.prod.ts` reads a bare global identifier, `NG_APP_API_BASE_URL` (declared in `environments/ng-app-globals.d.ts`), swapped in via `fileReplacements` on the `production` build configuration.

That identifier is not `process.env.API_BASE_URL`: `@types/node`'s ambient `process` types every env value as `string | undefined`, which would force a non-null assertion on every read despite the build guaranteeing a literal string. Since `angular.json` is static JSON and can't embed a shell-interpolated value, `scripts/build.mjs` wraps `ng build` — it loads `.env` via `process.loadEnvFile()` when present (a no-op on Render, which injects env vars into the process directly), fails fast if `API_BASE_URL` is unset, and passes `--define=NG_APP_API_BASE_URL=<value>` so esbuild replaces the identifier with a literal string at build time, in both the browser and server bundles. `npm run build` runs this wrapper; `npm run watch` (the `development` configuration) never references the identifier at all, so it needs no wrapper.

## Auth

`AuthStore` holds the access token and current user as signals, never persisted. `auth.interceptor.ts` attaches the bearer token and `withCredentials: true`. `error.interceptor.ts` implements 401-retry-once via `auth/refresh/`, excluding `auth/login/`, `auth/register/`, and `auth/refresh/` itself from the retry (see `docs/API.md`). Guards (`auth.guard.ts`, `owner.guard.ts`, `guest.guard.ts`) gate routes; `role` on `UserProfile` is treated as UX convenience only, never a security boundary, since the backend enforces the same rule independently.
