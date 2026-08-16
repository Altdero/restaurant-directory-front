import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainToolbar } from './main-toolbar';

describe('MainToolbar', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('renders the wordmark as a routerLink to home', () => {
    const fixture = TestBed.createComponent(MainToolbar);
    fixture.detectChanges();

    const wordmark: HTMLAnchorElement = fixture.nativeElement.querySelector('.wordmark');
    expect(wordmark.textContent?.trim()).toBe('Restaurant Directory');
    expect(wordmark.getAttribute('href')).toBe('/');
  });

  it('renders the theme toggle and language switcher', () => {
    const fixture = TestBed.createComponent(MainToolbar);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-theme-toggle')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-language-switcher')).toBeTruthy();
  });
});
