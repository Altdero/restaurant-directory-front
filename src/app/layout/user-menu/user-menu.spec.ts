import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserProfile } from '@core/models/user-profile.model';

import { UserMenu } from './user-menu';

const BASE_USER: UserProfile = {
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

describe('UserMenu', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('hides the owner-dashboard link for a customer', () => {
    const fixture = TestBed.createComponent(UserMenu);
    fixture.componentRef.setInput('user', BASE_USER);
    fixture.detectChanges();

    expect(fixture.componentInstance.isOwner()).toBe(false);
  });

  it('shows the owner-dashboard link for an owner', () => {
    const fixture = TestBed.createComponent(UserMenu);
    fixture.componentRef.setInput('user', { ...BASE_USER, role: 'owner' });
    fixture.detectChanges();

    expect(fixture.componentInstance.isOwner()).toBe(true);
  });
});
