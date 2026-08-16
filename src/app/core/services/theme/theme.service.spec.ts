import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

function setPrefersDark(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' && prefersDark,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
}

describe('ThemeService', () => {
  afterEach(() => {
    document.cookie = 'theme=; path=/; max-age=0';
    document.documentElement.removeAttribute('data-theme');
  });

  it('applies no data-theme attribute when no cookie and no explicit preference exist', () => {
    setPrefersDark(false);
    TestBed.configureTestingModule({});

    const service = TestBed.inject(ThemeService);
    TestBed.tick();

    expect(service.current()).toBeUndefined();
    expect(TestBed.inject(DOCUMENT).documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('reads an existing cookie as the initial preference and applies data-theme', () => {
    setPrefersDark(false);
    document.cookie = 'theme=dark; path=/';
    TestBed.configureTestingModule({});

    const service = TestBed.inject(ThemeService);
    TestBed.tick();

    expect(service.current()).toBe('dark');
    expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggle() flips away from the OS-derived scheme when no explicit preference is set', () => {
    setPrefersDark(true);
    TestBed.configureTestingModule({});

    const service = TestBed.inject(ThemeService);
    service.toggle();
    TestBed.tick();

    expect(service.current()).toBe('light');
    expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.cookie).toContain('theme=light');
  });

  it('toggle() flips an explicit preference and persists it', () => {
    setPrefersDark(false);
    document.cookie = 'theme=light; path=/';
    TestBed.configureTestingModule({});

    const service = TestBed.inject(ThemeService);
    service.toggle();
    TestBed.tick();

    expect(service.current()).toBe('dark');
    expect(document.cookie).toContain('theme=dark');
  });
});
