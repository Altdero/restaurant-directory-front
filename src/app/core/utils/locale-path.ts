/**
 * Strips a leading `/es` or `/en` locale segment from a pathname, leaving a
 * locale-agnostic path always starting with `/` (the bare locale root
 * becomes `/`, never `''`). Shared by `LanguageSwitcher` (building the
 * alternate-locale link) and `SeoService` (building hreflang alternates and
 * the canonical URL) — both need exactly this "current path without its
 * locale" value.
 */
export function stripLocalePrefix(pathname: string): string {
  const withoutLocale = pathname.replace(/^\/(?:es|en)(\/|$)/, '/');
  return withoutLocale === '' ? '/' : withoutLocale;
}
