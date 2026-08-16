import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LanguageSwitcher } from './language-switcher';

function createComponent(locale: string, pathname: string, search = ''): HTMLElement {
  // `document.location` is non-configurable (matches real browsers), so it
  // can't be stubbed directly — pushState actually navigates jsdom's URL,
  // which is the supported way to change what `document.location` reports.
  window.history.pushState({}, '', pathname + search);

  TestBed.configureTestingModule({
    providers: [{ provide: LOCALE_ID, useValue: locale }],
  });

  const fixture = TestBed.createComponent(LanguageSwitcher);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('LanguageSwitcher', () => {
  it('links to the English equivalent of a Spanish path, preserving the query string', () => {
    const element = createComponent('es', '/es/restaurants', '?page=2');
    const anchor = element.querySelector('a')!;

    expect(anchor.getAttribute('href')).toBe('/en/restaurants?page=2');
    expect(anchor.getAttribute('hreflang')).toBe('en');
    expect(anchor.textContent?.trim()).toBe('English');
  });

  it('links to the Spanish equivalent of an English path', () => {
    const element = createComponent('en', '/en/categories/tacos');
    const anchor = element.querySelector('a')!;

    expect(anchor.getAttribute('href')).toBe('/es/categories/tacos');
    expect(anchor.textContent?.trim()).toBe('Español');
  });

  it('links to the alternate locale root when the current path is the locale root', () => {
    const element = createComponent('es', '/es');
    const anchor = element.querySelector('a')!;

    expect(anchor.getAttribute('href')).toBe('/en');
  });

  it('is a real anchor, never a routerLink, so switching locales does a full navigation', () => {
    const element = createComponent('es', '/es/restaurants');
    const anchor = element.querySelector('a')!;

    expect(anchor.hasAttribute('routerLink')).toBe(false);
  });
});
