import { isPlatformBrowser } from '@angular/common';
import {
  DOCUMENT,
  PLATFORM_ID,
  REQUEST,
  Service,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

export type ThemePreference = 'light' | 'dark';

const COOKIE_NAME = 'theme';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const COOKIE_PATTERN = /(?:^|;\s*)theme=(light|dark)(?:;|$)/;

/**
 * Holds the user's explicit light/dark preference, `undefined` meaning "defer
 * to the OS" (the `color-scheme: light dark` default in `styles/_theme.scss`).
 * Applies the choice via a `data-theme` attribute on `<html>` — outside
 * Angular's own component tree, so `DOCUMENT` injection is the only way to
 * reach it — and persists it in a plain (non-httpOnly) cookie so SSR can
 * render the right scheme on the first paint instead of flashing the default
 * and correcting it after hydration.
 *
 * Reading the initial preference is SSR-request-scoped: it comes from the
 * `REQUEST` cookie header on the server and `document.cookie` in the
 * browser. Prerendered routes have no live request at build time, so they
 * always prerender with no explicit preference; a user with a saved
 * preference gets a corrected `data-theme` attribute the moment the app
 * hydrates, a single-frame flash on those routes specifically. Verified
 * against a real built-and-served response (`curl` with a `Cookie: theme=…`
 * header) with `app.routes.server.ts` temporarily set to `RenderMode.Server`
 * — with today's actual `**` → `RenderMode.Prerender` catch-all (no client
 * routes exist yet to be more specific about, per `app.routes.ts`), every
 * route is prerendered right now, so this mechanism has no observable effect
 * in the app as it stands. It starts doing real work once feature commits
 * add server-rendered routes (see docs/ARCHITECTURE.md's rendering-strategy
 * table) — this is groundwork verified end-to-end, not a currently-active
 * behavior.
 */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });

  private readonly preference = signal<ThemePreference | undefined>(this.readInitialPreference());
  readonly current = this.preference.asReadonly();
  /**
   * The scheme actually in effect: the explicit preference if one is set,
   * otherwise the OS preference read once at evaluation time. Recomputes
   * whenever `toggle()` changes `preference`, but does not live-track OS
   * theme changes made mid-session while no explicit preference exists —
   * an accepted scope limit, not a bug.
   */
  readonly resolved = computed<ThemePreference>(() => this.preference() ?? this.systemScheme());

  constructor() {
    effect(() => {
      const preference = this.preference();
      if (preference) {
        this.document.documentElement.setAttribute('data-theme', preference);
      } else {
        this.document.documentElement.removeAttribute('data-theme');
      }
    });
  }

  /** Flips away from whatever scheme is currently in effect (explicit or OS-derived). */
  toggle(): void {
    const next: ThemePreference = this.resolved() === 'dark' ? 'light' : 'dark';
    this.preference.set(next);
    this.persist(next);
  }

  private systemScheme(): ThemePreference {
    const prefersDark =
      isPlatformBrowser(this.platformId) &&
      (this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false);
    return prefersDark ? 'dark' : 'light';
  }

  private readInitialPreference(): ThemePreference | undefined {
    const cookieHeader = isPlatformBrowser(this.platformId)
      ? this.document.cookie
      : (this.request?.headers.get('cookie') ?? '');
    return COOKIE_PATTERN.exec(cookieHeader)?.[1] as ThemePreference | undefined;
  }

  private persist(preference: ThemePreference): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const secure = this.document.defaultView?.location.protocol === 'https:' ? '; Secure' : '';
    this.document.cookie = `${COOKIE_NAME}=${preference}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  }
}
