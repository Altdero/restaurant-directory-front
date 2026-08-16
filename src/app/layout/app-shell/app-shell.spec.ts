import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('renders the toolbar, a router outlet inside main, and the footer', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });

    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('app-main-toolbar')).toBeTruthy();
    expect(element.querySelector('main router-outlet')).toBeTruthy();
    expect(element.querySelector('app-site-footer')).toBeTruthy();
  });
});
