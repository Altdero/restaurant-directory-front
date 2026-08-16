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
  environment.dataLayer === 'tanstack'
    ? provideTanStackDataLayer()
    : provideHttpResourceDataLayer(),
];
```

Components inject `inject(RESTAURANT_DATA)` and never learn which implementation they received. Adding a sixth resource means adding one interface and two implementations — no existing file changes.

**Both implementations ship in the browser bundle regardless of the switch — a known, accepted tradeoff, not an oversight.** `environment.dataLayer` is a plain runtime object property, not a build-time constant substituted via `--define` (unlike `NG_APP_API_BASE_URL`), so esbuild's dead-code elimination cannot prove which branch of the ternary above actually runs and keeps both. This pushed the production initial-bundle size from ~420 kB to ~627 kB (commit 8), which required raising `angular.json`'s `budgets[0].maximumWarning` from `500kB` to `650kB` — a deliberate, documented change, not a silenced warning. The whole point of this architecture is demonstrating two interchangeable, fully-implemented data layers side by side, so shipping both is consistent with that goal for a project at this stage. If bundle size becomes a real concern later, the upgrade path mirrors `NG_APP_API_BASE_URL`: promote `dataLayer` to a build-time `--define`'d global, so only the selected branch survives tree-shaking — an additive change, not a re-plan.

Both implementations reuse the same implementation-agnostic pieces: `ApiUrlBuilder` (query serialization), `ApiErrorMapper` (DRF error shapes → a discriminated `ApiError` union), the three pagination-envelope decoders, and the DTO↔model mappers that parse decimal strings and ISO timestamps. The only thing that differs between the two implementations is the fetching mechanism itself — which is also why both are tested against one shared contract suite rather than duplicated test files.

### `httpResource()` implementation — implemented and verified

`core/services/http-resource/http-resource.adapter.ts` holds the two pieces every one of the five resource services (`core/services/http-resource/*.http-resource.service.ts`) builds on:

- **`toAsyncResource()`** adapts an `httpResource()` ref to `AsyncResource<T>`. It takes a `ResourceLike<T>` — a structural subset of `HttpResourceRef<T>` (just `value`/`isLoading`/`error`/`reload`) — rather than `HttpResourceRef<T>` itself. `WritableResource.set`/`update` take `T` in a contravariant (input) position, so `HttpResourceRef<Restaurant>` (built with a `defaultValue`, used by `list()`/`mine()`) structurally fails to satisfy a parameter typed `HttpResourceRef<Restaurant | undefined>` (built without one, used by `byId()`) even though both are equally valid to _read_ — reading only the four members this adapter touches sidesteps that.
- **`createMutation()`** builds an `AsyncMutation<TInput, TResult>` from a one-shot `HttpClient` call (`firstValueFrom` + local `isPending`/`error` signals) for every `create()`/`update()`/`remove()`/`toggle()` method. Deliberately not `httpResource()`-based — mutations are imperative, one-shot calls, not reactive signal-driven queries.

**Verified finding that corrected an initial wrong assumption:** reading `@angular/core/fesm2022/_resource-chunk.mjs` suggested `resource()`'s `encapsulateResourceError` wraps any thrown non-`Error`-like value (no string `.name`/`.message`) in a `ResourceWrappedError`, putting the original on `.cause` — since `error.interceptor.ts` throws the mapped `ApiError` object directly (never an `Error` instance), the adapter was first written to unwrap `.cause`. A real `HttpTestingController` 404 response proved this wrong for `httpResource()` specifically: `resource.error()` holds the exact `ApiError` object, completely unwrapped, no `.cause` involved. The adapter now casts `resource.error()` straight through `unknown` to `ApiError | undefined` — the `Signal<Error | undefined>` type is misleading at runtime for this resource factory. Caught by writing the test first and getting a genuine failure, not by re-reading the source harder.

**Query mapping** (`core/utils/query-params.ts`, one `to*Params()` function per resource) and **pagination-envelope mapping** (`core/utils/pagination-mapper.ts`, `mapCountedPage`/`mapCursorPage`) are both implementation-agnostic and reused by the TanStack implementation below — only the fetching mechanism differs, per the section above.

**Cursor pagination's "load more" is not signal-driven.** `ReviewDataService.loadMore(url: string): Promise<CursorPage<Review>>` takes the API's own opaque `next`/`previous` URL verbatim and returns a plain `Promise` — never a `cursor` query param reconstructed from a `ReviewQuery`. Accumulating pages into one growing list is the calling feature page's job (commit 12), not the data layer's — the data layer's only responsibility is fetching and normalizing one page at a time.

**Testing `httpResource()`-backed resources requires two things beyond a normal `HttpTestingController` test**, both confirmed empirically, not assumed:

1. `TestBed.runInInjectionContext(() => service.list(query))` to call the resource-creating method — `httpResource()` is an `@initializerApiFunction` requiring an active injection context, same rule as `inject()`. Calling a method on an already-constructed service instance is not automatically in one.
2. `TestBed.tick()` after creation triggers the resource's initial effect and issues the HTTP request; after `req.flush(...)`, the signal write does **not** happen synchronously inside `flush()` — `ResourceImpl#loadEffect` (`_resource-chunk.mjs`) is an `async` method, and JS guarantees the code after any `await` runs on a microtask, never synchronously, regardless of how fast the awaited value resolves. `await TestBed.inject(ApplicationRef).whenStable()` (a real, documented Angular primitive for "wait for pending async work to settle" — not a bare `Promise.resolve()` guess) is required before asserting on the resolved state.

### TanStack Query implementation — implemented and verified

`core/services/tanstack/tanstack.adapter.ts` mirrors the httpResource adapter's shape (`toAsyncResource()`, plus `toAsyncMutation()` for writes) but the mechanics underneath are genuinely different, each one verified rather than assumed:

- **No error-wrapping to undo, unlike `httpResource()`.** TanStack Query does not run thrown values through anything like Angular's `encapsulateResourceError` — `query.error()` holds exactly what `error.interceptor.ts` threw. The only real adaptation is `null` → `undefined`, since `QueryObserverBaseResult.error` is typed `TError | null` (TanStack's own convention) against `AsyncResource.error: ApiError | undefined`.
- **`injectMutation()` requires an active injection context, unlike the httpResource family's `createMutation()`.** The httpResource mutations are plain `HttpClient` calls with no such requirement; TanStack's are not. Since a component must call `create()`/`update()`/etc. the same way regardless of which implementation it received, `AsyncMutation`'s doc comment in `core/interfaces/async-resource.ts` now states the stricter (TanStack) requirement as the contract for both.
- **`retry: false` is set on the shared `QueryClient`** (`provide-tanstack-data-layer.ts`) for both queries and mutations. TanStack's default (3 retries, exponential backoff) would silently re-attempt failures this app treats as final (a 400 or 404 isn't transient), and the one genuinely retryable case — an expired access token — is already handled once, synchronously, inside `error.interceptor.ts`, before TanStack ever observes a failure.

**Testing TanStack-backed resources needed real investigation into `@tanstack/query-core`'s actual source** (shipped as readable TypeScript in `node_modules/@tanstack/query-core/src/`, not just `.d.ts`), because the first two testing approaches that worked for `httpResource()` did not transfer:

1. `ApplicationRef.whenStable()` alone resolved _before_ the query's state ever settled. Cause, confirmed by reading `create-base-query.mjs`: the Angular `PendingTasks` entry `whenStable()` waits for is only registered _inside_ the callback passed to `observer.subscribe(notifyManager.batchCalls(...))`, and `notifyManager`'s default scheduler (`@tanstack/query-core`'s `systemSetTimeoutZero`) dispatches that callback via a real `setTimeout(0)` — a macrotask, not a microtask. `whenStable()`, called immediately after a synchronous `HttpTestingController.flush()`, checks stability before that macrotask has ever fired, so nothing is pending yet and it resolves immediately.
2. The fix is **not** to await a real `setTimeout(0)` in every test (workable, but it litters every test with a timing detail and a small real delay). Instead, `notifyManager.setScheduler((callback) => callback())` in `beforeEach` (restored to the real default in `afterEach`) makes TanStack's own notification dispatch synchronous for the whole suite — a one-line, documented override rather than a per-test tactical wait.
3. Even with that override, one `await Promise.resolve()` per query assertion was _still_ not always sufficient — `Mutation#execute`/the query fetch path cross more than one microtask boundary internally (`createRetryer`, `firstValueFrom`), and the exact number isn't a contract worth hardcoding against. `await vi.waitFor(() => { TestBed.tick(); if (resource.isLoading()) throw new Error(...); })` — Vitest's poll-until-it-passes helper — is used for query assertions instead, so the test doesn't depend on TanStack's internal call-stack depth. Mutations only ever needed one `await Promise.resolve()` before the HTTP request appeared (`Mutation#execute` is a single `async` method, so exactly one hop), and the mutation's own returned `Promise` can just be awaited directly for the result, sidestepping the polling question entirely for that half of the test.

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

`AccessTokenStore` (`core/services/auth/`) holds the access token as a signal, never persisted — nothing else. It's deliberately split from the full `AuthStore` (user profile, login/logout orchestration, `isOwner`/`isAuthenticated`, added later): the interceptors only ever need the token itself, and this keeps them independent of the larger store.

`auth.interceptor.ts` attaches the bearer token and `withCredentials: true` — but only to requests targeting `environment.apiBaseUrl`. This scoping is load-bearing, not cosmetic: an unscoped interceptor would leak the JWT to third-party requests such as the direct-to-Cloudinary upload.

`error.interceptor.ts` implements 401-retry-once via `auth/refresh/`, excluding `auth/login/`, `auth/register/`, and `auth/refresh/` itself from the retry (see `docs/API.md`), and is scoped to our own API the same way. The actual refresh call is coordinated by `TokenRefreshCoordinator`, which deduplicates concurrent 401s into a single in-flight `auth/refresh/` call — several requests failing near-simultaneously as the token expires is a mainline scenario, and without coordination each would trigger its own refresh, racing against the backend's refresh-token rotation. It calls the API via a raw `HttpClient` built on `HttpBackend`, bypassing the interceptor chain (the normal `HttpClient` would re-enter `error.interceptor.ts` itself). It's `@Service()`-scoped rather than a module-level variable deliberately, since Angular SSR's per-request injector means module-level state would otherwise leak between concurrent users' requests in the same Node process.

`NotificationService` (`core/services/notification/`) is a thin `MatSnackBar` wrapper `error.interceptor.ts` uses to toast on 429s; message text is authored with `$localize` directly in the `.ts` file (`error.interceptor.ts`'s throttled-message string is the first translated string in the app, verified end-to-end against a real localized build).

Guards (`auth.guard.ts`, `owner.guard.ts`, `guest.guard.ts`) gate routes; `role` on `UserProfile` is treated as UX convenience only, never a security boundary, since the backend enforces the same rule independently.
