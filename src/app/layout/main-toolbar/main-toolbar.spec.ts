import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserProfile } from '@core/models/user-profile.model';
import { AuthStore } from '@core/services/auth/auth.store';

import { MainToolbar } from './main-toolbar';

const USER: UserProfile = {
  id: 'u-1',
  username: 'ana',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Ruiz',
  role: 'customer',
  phone: '',
  avatar: '',
  dateJoined: new Date('2026-08-07'),
};

describe('MainToolbar', () => {
  it('shows nothing auth-related before AuthStore is initialized', () => {
    configureWith({
      initialized: signal(false),
      isAuthenticated: signal(false),
      user: signal(null),
    });
    const fixture = TestBed.createComponent(MainToolbar);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-user-menu')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Log in');
  });

  it('shows login/register links once initialized and logged out', () => {
    configureWith({
      initialized: signal(true),
      isAuthenticated: signal(false),
      user: signal(null),
    });
    const fixture = TestBed.createComponent(MainToolbar);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-user-menu')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Log in');
    expect(fixture.nativeElement.textContent).toContain('Register');
  });

  it('shows the UserMenu once initialized and authenticated', () => {
    configureWith({ initialized: signal(true), isAuthenticated: signal(true), user: signal(USER) });
    const fixture = TestBed.createComponent(MainToolbar);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-user-menu')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Log in');
  });
});

function configureWith(authStore: Partial<AuthStore>): void {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthStore, useValue: authStore }],
  });
}
