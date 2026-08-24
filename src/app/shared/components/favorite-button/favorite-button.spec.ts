import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FavoriteButton } from './favorite-button';

describe('FavoriteButton', () => {
  function createFixture() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    return TestBed.createComponent(FavoriteButton);
  }

  it('renders a login link, not a toggle button, for an anonymous visitor', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('isFavorited', false);
    fixture.componentRef.setInput('isAuthenticated', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('renders a toggle button with aria-pressed for an authenticated visitor', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('isFavorited', true);
    fixture.componentRef.setInput('isAuthenticated', true);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('emits toggle when the authenticated button is clicked', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('isFavorited', false);
    fixture.componentRef.setInput('isAuthenticated', true);
    fixture.detectChanges();
    const emitted = vi.fn();
    fixture.componentInstance.toggled.subscribe(emitted);

    fixture.nativeElement.querySelector('button').click();

    expect(emitted).toHaveBeenCalled();
  });
});
