// jsdom (the environment `@angular/build:unit-test` runs specs in) does not
// implement `window.matchMedia` at all — anything that transitively reads
// it (ThemeService's OS-preference fallback) throws `matchMedia is not a
// function` unless it's stubbed globally. Defaults to "no preference"
// (`matches: false`); specs that need to control it override this per test.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
