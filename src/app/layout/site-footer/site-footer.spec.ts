import { TestBed } from '@angular/core/testing';

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('renders a footer element with a tagline', () => {
    const fixture = TestBed.createComponent(SiteFooter);
    fixture.detectChanges();

    const footer: HTMLElement = fixture.nativeElement.querySelector('footer');
    expect(footer).toBeTruthy();
    expect(footer.textContent?.trim()).toBe('Discover restaurants near you.');
  });
});
