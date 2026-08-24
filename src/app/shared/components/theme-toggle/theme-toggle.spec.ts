import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from '@core/services/theme/theme.service';

import { ThemeToggle } from './theme-toggle';

function createComponent(resolved: 'light' | 'dark') {
  TestBed.configureTestingModule({
    providers: [
      { provide: ThemeService, useValue: { resolved: signal(resolved), toggle: vi.fn() } },
    ],
  });

  const fixture = TestBed.createComponent(ThemeToggle);
  fixture.detectChanges();
  return fixture;
}

describe('ThemeToggle', () => {
  it('shows an unpressed state and a "switch to dark" label when currently light', () => {
    const fixture = createComponent('light');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
  });

  it('shows a pressed state and a "switch to light" label when currently dark', () => {
    const fixture = createComponent('dark');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
  });
});
