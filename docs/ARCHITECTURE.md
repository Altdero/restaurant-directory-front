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

**`/` is not actually a defined Angular route yet** (`features/home/` is a later commit — see PLAN.md § Project structure) — the row above states the intended eventual render mode, not today's reality. Discovered while implementing commit 10: with `app.routes.ts` empty, the `**` → `Prerender` catch-all happened to still emit a static `index.html` for `/` per locale, an accident of there being no real routes for the build-time extractor to walk rather than evidence `/` was actually routed. Once `login`/`register` became real routes, the extractor started properly enumerating only genuine routes, `/` stopped being one of them, and the built SSR server now returns a bare `404 Cannot GET /en/` for it (verified with a real `curl` against `dist/restaurant-directory/server/server.mjs`). Not a regression introduced by commit 10's code — a pre-existing gap that commit 10's routing was the first to make visible. Resolves itself once the home-page commit adds a real `path: ''` route.

## i18n

Native `@angular/localize`, compiled once and inlined per locale (`I18nInliner`, part of `@angular/build:application`) — not a runtime translation library. `subPath` in `angular.json`'s `i18n` block sets both the URL prefix and the HTML base href, so the Angular route table itself is locale-agnostic: `routerLink="/restaurants"` resolves to `/es/restaurants` or `/en/restaurants` depending on which compiled bundle is currently loaded. `@angular/ssr`'s `AngularAppEngine` serves every locale from a single Node process, reading the locale from the first URL path segment per request.

Full detail: `prompt_restaurant_frontend.md` § Internationalization (not committed — internal reference only).

## UI theme, shell & dark mode

**Custom M3 palette — generated once, committed as a static file, not regenerated per build.** `mat.theme()` only accepts an already-computed M3 tonal palette map (verified against `@angular/material/core/theming/_definition.scss`: `primary: map.get($color-config, primary) or palettes.$violet-palette` — never a bare hex string). Computing one from a seed color requires Material Color Utilities, which has no pure-Sass equivalent, so `src/styles/_theme-colors.scss` was generated via the real, non-interactive schematic:

```
ng generate @angular/material:m3-theme --primary-color="#C2410C" \
  --tertiary-color="#0F766E" --directory=src/styles --defaults
```

(`--interactive=false` alone produced no output at all with no error — `--defaults` was also required to actually run non-interactively; the `--directory` flag also doesn't create a missing directory, it string-concatenates onto the filename if the directory doesn't exist yet, so the first attempt produced `src/styles_theme-colors.scss` rather than `src/styles/_theme-colors.scss` — `mkdir -p src/styles` first, then move the file, fixed it.)

**Light/dark schemes are three separate `mat.theme()` calls nested under different selectors**, not one call with a dark-mode flag (`src/styles/_theme.scss`): a base `html { }` (light, plus typography/density), a `@media (prefers-color-scheme: dark)` block, and explicit `[data-theme='light']`/`[data-theme='dark']` overrides (the last two win over the media query via attribute-selector specificity, regardless of source order). Verified by inspecting the actual compiled `styles.css`, not assumed from the Sass source: within each selector's emitted rule, `mat.theme()`'s own `--mat-sys-surface` value appears first, and this file's explicit cream/ink overrides (`#FDFBF7`/`#1C1917` — exact values from PLAN.md, close to but not identical to the M3 generator's own algorithmic neutral tones) appear after it in the same rule, so they win via ordinary "last declaration wins" cascade — confirmed present for all four scheme/override combinations in the built CSS.

**Fonts are self-hosted via `@use` inside `styles.scss`, not `angular.json`'s `styles` array.** `@angular/build:application`'s schema requires every `styles` array entry to be an actual file path ending in a recognized extension — a bare package specifier like `"@fontsource-variable/inter"` fails schema validation (`must match pattern "\.(?:css|scss|sass|less)$"`), even though this exact bare-specifier form is the documented usage in fontsource's own README (written for older, webpack-based tooling). `@use '@fontsource-variable/inter/index.css' as inter;` (aliased — both packages' entry points are named `index.css`, and Sass rejects two unaliased modules sharing a namespace) works instead.

**`ThemeService`** (`core/services/theme/theme.service.ts`) holds the explicit light/dark preference (`undefined` meaning "defer to the OS"), applies it via a `data-theme` attribute on `<html>` through an `effect()` (the only way to reach an element outside Angular's own component tree — `DOCUMENT` injection, not a template host binding), and persists it in a plain (non-`httpOnly`) cookie. Reading the initial value is SSR-request-scoped: the `REQUEST` injection token's cookie header on the server, `document.cookie` in the browser.

**Verified end-to-end against a real built-and-served response, with an important honest caveat about what that verification actually covers right now.** A `curl` with a `Cookie: theme=dark` header against the built SSR server correctly returned `<html data-theme="dark">`, and `theme=light`/no cookie behaved correctly too — but only after temporarily changing `app.routes.server.ts`'s catch-all from `RenderMode.Prerender` to `RenderMode.Server` for the test, then reverting. With today's actual config (`**` → `Prerender`, since `app.routes.ts` has no real client routes yet to be more specific about), **every route in the app is currently prerendered** — confirmed by the build log itself ("Prerendered 2 static routes" for `/es` and `/en`, "Prerendered 0 static routes" with the temporary `Server` override). A prerendered route has no live request at build time, so `ThemeService` always reads no explicit preference there, and a user's saved preference only gets applied after hydration corrects the `data-theme` attribute client-side — a single-frame flash, on every route, until real feature routes with `RenderMode.Server` exist. This is groundwork verified to work correctly, not a currently-active behavior end-to-end — it starts doing real work as soon as commits 11+ add server-rendered feature routes.

**`window.matchMedia` doesn't exist in jsdom at all**, discovered when `ThemeService`'s OS-preference fallback threw `matchMedia is not a function` in any spec that transitively constructed it (`MainToolbar` → `ThemeToggle` → `ThemeService`). Rather than stub it per-spec, `src/test-setup.ts` (wired via `@angular/build:unit-test`'s `setupFiles` option in `angular.json`, and added to `tsconfig.spec.json`'s `include` so it's actually type-checked) provides a default no-preference stub globally; specs that need to control the OS preference (`theme.service.spec.ts`) still override it locally per test.

**Auth-aware toolbar content (login/register links, later a `UserMenu`) is deferred to commit 10.** `MainToolbar` in this commit is wordmark + theme toggle + language switcher only — `AuthStore` doesn't exist yet, and `app.routes.ts` is still empty, so a `routerLink` to `/login` would point at a route that doesn't resolve to anything; a toolbar link that visibly does nothing on click is worse than no link at all.

**No `new Date()` in `SiteFooter`.** AGENTS.md's template rule against assuming globals like `new Date()` are available is partly an SSR-hydration-mismatch concern: a value computed once during SSR render and recomputed at client hydration is a mismatch risk in general, even though a copyright-year rollover is a vanishingly rare instance of it. The footer has no dynamic year as a result — a static tagline only.

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

**`AuthStore`** (`core/services/auth/auth.store.ts`, commit 10) composes `AccessTokenStore` rather than duplicating it, adding the user profile (`signal<UserProfile | null>`), `isAuthenticated`/`isOwner` computeds, and login/register/logout orchestration via `AuthApi` (`core/services/auth/auth.api.ts` — a thin `HttpClient` wrapper for `auth/register/`, `auth/login/`, `auth/logout/`, `users/me/`; `auth/refresh/` stays exclusively `TokenRefreshCoordinator`'s job).

**Session rehydration on reload was not specified anywhere in the original plan — decided during implementation, at the user's direction.** The access token is memory-only, so without extra work a page reload always starts logged out even with a still-valid `httpOnly` refresh cookie. On the browser, `AuthStore`'s constructor makes one silent attempt — `TokenRefreshCoordinator.refresh()` (reused, not duplicated) then `AuthApi.me()` — before setting an `initialized` signal, either way. On the server, `initialized` is set immediately, since there is no browser cookie jar to rehydrate from server-side (protected routes are client-rendered only, per the table above).

All three guards (`auth.guard.ts`, `owner.guard.ts`, `guest.guard.ts`) — functional `CanActivateFn`s, no class-based guard precedent exists in this codebase — wait for `AuthStore.initialized` (`toObservable(initialized).pipe(filter(Boolean), take(1))`) before deciding, so a reload doesn't redirect to `/login` before the rehydration attempt has resolved. `MainToolbar` gates its auth-aware content (login/register links vs. `UserMenu`) on the same `initialized()` signal, for the same reason — SSR/prerendered output always renders the logged-out branch, the same class of accepted single-frame post-hydration flash already documented for dark mode above.

A standing `effect()` inside `AuthStore` clears the user profile whenever `AccessTokenStore`'s token goes back to `null` — this is what makes `error.interceptor.ts`'s existing forced-logout-on-failed-refresh (`tokenStore.set(null)`) also clear the profile, with zero direct coupling between the interceptor and this store.

`role` on `UserProfile` is treated as UX convenience only, never a security boundary, since the backend enforces the same rule independently — `owner.guard.ts` exists to avoid rendering a dashboard shell the API would reject, not as the actual security boundary.

## Restaurant listing

`/restaurants` (`RestaurantListPage`) drives its filters and pagination entirely from the URL's query params — this is what makes `RenderMode.Server` on this route actually meaningful (each filter combination its own crawlable, server-rendered URL) rather than a client-only view of shared state. Wired via `withComponentInputBinding()`, added to `provideRouter()` in `app.config.ts` (first use in this project): verified against the real `@angular/router` source (`RoutedComponentInputBinder` in `_router-chunk.mjs`) before relying on it — it merges `queryParams`/`params`/`data` by key and calls `setInput()` on every matching declared `input()` of the routed component, including `undefined` when a param is absent (default `unmatchedInputBehavior: 'alwaysUndefined'`). Query-param values always arrive as strings; `page`/`minRating` use an `input(..., { transform })` with `numberAttribute` (coercing an absent/invalid value to a fallback, not `NaN`).

**Verified end-to-end against the live backend, not just a mocked test.** A `curl` against the built-and-served app returns `/en/restaurants` with the real restaurant list already in the server-rendered HTML; `?city=Guadalajara` correctly narrows the server-rendered result to the one matching restaurant; a filter matching nothing correctly server-renders `EmptyState`'s message. `RestaurantFilters` applies on an explicit "Apply" submit, not live-per-keystroke — a live-apply UX would trigger a new SSR navigation on every keystroke, defeating the reason this route is server-rendered rather than client-rendered.

**`PaginatorBar` is a hand-rolled prev/next control, not `mat-paginator` — reversed mid-implementation after a real build measured the cost.** First built as a thin wrapper translating `mat-paginator`'s 0-indexed `pageIndex` to this app's 1-indexed `page`. A real `npm run build` showed `MatPaginatorModule` alone added ~20kB to the initial bundle — `@angular/cdk`'s overlay/a11y/bidi machinery (the first would-be use of CDK Overlay in this project), almost entirely in service of a page-size picker this app doesn't expose (page size is fixed per resource — see `docs/API.md` — not a user control, so `PaginatorBar` isn't one either). Rewritten as two `mat-icon-button`s (`MatButtonModule`, already loaded elsewhere for `AuthCard`/`ErrorState`) plus a "Page X of Y" indicator; the `restaurant-list-page` lazy chunk dropped from 89.5kB to 59.75kB as a result. The remaining real weight — `RestaurantFilters`' `MatSelect`/`MatFormField`/`MatInput`/`ReactiveFormsModule`, the app's first real filter form — is unavoidable; `angular.json`'s bundle budget was raised `700kB` → `725kB` for that specifically, with the CDK-overlay cost deliberately engineered away rather than budgeted around.

`PriceRangeBadge` (not `PriceRange`, PLAN.md §2's original name) — a component named `PriceRange` would collide with `core/models/restaurant.model.ts`'s existing `PriceRange` type in any file needing both, e.g. `RestaurantCard`.

`RestaurantCard` doesn't yet link to `/restaurants/:id` — that route lands in commit 12; same reasoning as `MainToolbar` deferring auth links in commit 9 until `/login`/`/register` existed.
