# AGENTS.md

Instructions for Claude Code and any AI coding assistant working in this repository. Follow every rule here without exception. If a request conflicts with a rule in this file, point out the conflict before proceeding.

## 1. Project context

This is the Angular frontend for a Restaurant Directory application — the client layer of a fullstack project whose backend is a Django REST Framework API (JWT auth, Cloudinary uploads, three pagination styles). Code quality, architecture, and adherence to Angular best practices are treated as first-class requirements, not secondary concerns.

Key facts that shape every decision in this codebase:

- **Angular 22** with SSR (`ng new --ssr`), Angular Material 22, TypeScript strict mode.
- **Bilingual by URL prefix**: every page is served at `/es/...` or `/en/...` via native `@angular/localize`, compiled once and inlined per locale at build time. Spanish is the default; English is the source locale. SEO is a primary requirement — this is why locales are separate crawlable URLs rather than a runtime-switched single page.
- **Two interchangeable data-layer implementations** (`httpResource()` and TanStack Query) sit behind one shared interface, switchable via `environment.dataLayer` without touching a single component.
- **The access token lives in memory only**; the refresh token is an `httpOnly` cookie the frontend never reads. This is why every protected route renders client-side — SSR cannot see the refresh cookie and would only ever render a logged-out shell for those pages.

Detailed API request/response shapes, endpoints, and pagination envelopes live in `docs/API.md`. Read it before touching `core/models/` or any data-layer service.

## 2. Angular & TypeScript conventions

_(Preserved from the project's original Angular conventions — these apply to every file without exception.)_

### TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

### Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

### Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

#### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

### Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

### Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## 3. Architectural decisions

- **Apply DRY, SOLID, and Clean Code principles throughout.**
- **Single Responsibility**: one service per resource, one component per responsibility.
- **Open/Closed**: a new resource gets a new interface and two new implementations — no existing file changes.
- **Dependency Inversion**: components inject the resource's `InjectionToken` (e.g. `RESTAURANT_DATA`) and depend on the interface in `core/interfaces/`, never on `HttpResourceService` or the TanStack implementation directly. A component must not be able to tell which implementation it received.
- **No logic in components.** Business logic — filtering, mapping, validation beyond template-driven form validators — belongs in a service.
- **No `any`.** Use `unknown` and narrow explicitly.
- Presentational components never inject a data service, never perform HTTP, and communicate only through `input()`/`output()`/`model()`.
- Every list page owns exactly one query for its primary resource.
- **Import style**: use the path aliases (`@core/*`, `@shared/*`, `@features/*`, `@layout/*`, `@environments/*`) when crossing into another top-level directory; use plain relative imports (`./`) for same-folder siblings. Don't mix — a cross-directory relative import (`../../../core/models/x`) should always be an alias instead.
- **Never reference `process.env.*` in code that ships to the browser.** `@types/node`'s ambient `process` typing makes this compile, but `process` doesn't exist client-side and the reference will crash at runtime unless esbuild's `define` statically replaces it — and only `environment.prod.ts` is wired for that (see `NG_APP_API_BASE_URL` in `environments/ng-app-globals.d.ts`, injected by `scripts/build.mjs`). Server-only code (`server.ts`, interceptors that only run there) is the one place `process.env` is safe to read directly.

## 4. API contract rules

The backend is documented in full in `docs/API.md`. The rules below are the ones most likely to be silently violated:

- **Every resource id is a UUID string.** Never type an `id` as `number`.
- **Decimal fields are JSON strings**, not numbers: `price`, `average_rating`, `latitude`, `longitude`. Parse explicitly (`core/utils/decimal.ts`) before arithmetic or comparison — never coerce with `+` or assume the API will send a number.
- **Timestamps carry a `-06:00` offset** (`America/Mexico_City`, no DST), not `Z`/UTC. Format for display accordingly.
- **Nested-read / flat-write pairs are separate types.** `restaurants.categories` (nested, read-only, full `Category` objects) pairs with `category_ids` (flat, write-only). `favorites.restaurant` (nested) pairs with `restaurant_id` (write-only). Every resource with this pattern gets a `*Read` and a `*Write` interface in `core/models/` — never one interface with optional fields covering both directions.
- **Three pagination envelopes, chosen per resource** — do not assume one shape fits all:
  - Page-number (categories, restaurants, favorites): `{ count, next, previous, results }`.
  - Limit/offset (menu items): same shape, `limit`/`offset` query params.
  - Cursor (reviews): `{ next, previous, results }` — **no `count` field**. Never build UI that needs a total for reviews; this is "load more" only, never page-number UI.
- **Error shapes are structural, not string-matched.** Branch on HTTP status code and object shape (`{ field: [msg] }` vs. `{ non_field_errors: [msg] }` vs. `{ detail: msg }`), never on the text of a `detail` message — it varies by endpoint (e.g. `restaurants/{id}/` 404 returns `"No Restaurant matches the given query."`, not `"Not found."`).
- **A failed login/register returns `401`, not `400`.** `{"detail": "No active account found with the given credentials"}` on bad credentials is a `401`. Because of this, `error.interceptor.ts`'s 401-retry pattern must explicitly exclude `auth/login/`, `auth/register/`, and `auth/refresh/` — otherwise a wrong password triggers a spurious refresh attempt and a forced logout redirect.
- **`withCredentials: true` on every request.** Required for the `refresh_token` cookie flow; omitting it on any single request silently breaks refresh/logout for that call.
- **`role` on `UserProfile` is UX convenience only**, never a security boundary. The backend enforces role/ownership independently and returns `403` regardless of what the UI shows — a hidden "Add restaurant" button does not replace the corresponding route guard.

## 5. i18n rules

- **Author all template text, `i18n` descriptions, code, and comments in English** — English is the source locale (`en`), consistent with the project-wide English-only rule. Spanish exists only as translated content in `src/locale/messages.es.xlf`, never in source.
- **The Angular route table is locale-agnostic.** `subPath` sets the per-locale base href; the router operates below the prefix. Do not add a `:locale` route parameter, fork `app.routes.server.ts` per locale, or build a locale-aware `routerLink` wrapper.
- **The language switcher is a real document navigation** (`<a href>`), never `routerLink` or `Router.navigate()`. Each locale is a separately compiled bundle — switching requires a full page load.
- **Translations ship with their feature**, in the same commit as the strings they translate. `ng build`'s production configuration sets `i18nMissingTranslation: "error"`, so a feature commit with untranslated strings fails its own build — this is enforced, not just a convention.
- Use explicit stable IDs (`@@custom-id`) for any string whose source wording is likely to be reworded later, so the translation survives a copy edit.
- Angular does not translate route path segments — `/es/restaurants` and `/en/restaurants` share the same path, only the prefix differs. Translated slugs are out of scope.

## 6. Workflow rules

- **Commit forward, as each unit completes.** Never batch changes and reconstruct atomic commits at the end by partially staging a large diff — this produces commits describing a state that never existed and may not build.
- **Each commit is a vertical slice**, not a layer: component/service code, its `i18n` strings and Spanish translations, its unit tests, and its E2E spec land together. Avoid horizontal commits ("all translations", "all tests", "all docs").
- **Stage whole files, never hunks.** If something isn't ready to commit, it isn't part of the slice.
- **Conventional Commits**: `type(scope): description` — `feat`, `chore`, `refactor`, `test`, `docs`. Each commit must represent a stable, complete unit of work; never commit partial or work-in-progress code.
- Every commit must pass `ng lint && ng build` on its own — the `pre-push` hook enforces this, but verify locally before committing, not just before pushing.
- A later commit modifying files from an earlier one is normal history, not a defect to avoid.
