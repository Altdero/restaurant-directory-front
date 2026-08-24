import { TestBed } from '@angular/core/testing';
import { UserProfile } from '@core/models/user-profile.model';

import { ProfileForm } from './profile-form';

const USER: UserProfile = {
  id: 'u-1',
  username: 'ana',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Ruiz',
  role: 'customer',
  phone: '555-0100',
  avatar: 'https://res.cloudinary.com/demo/image/upload/ana.jpg',
  dateJoined: new Date('2026-01-01'),
};

describe('ProfileForm', () => {
  function createFixture() {
    return TestBed.createComponent(ProfileForm);
  }

  it('prefills the form from the user input', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('user', USER);
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].getRawValue()).toEqual({
      email: 'ana@example.com',
      first_name: 'Ana',
      last_name: 'Ruiz',
      phone: '555-0100',
    });
  });

  it('does not emit when the form is invalid', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('user', USER);
    fixture.detectChanges();
    fixture.componentInstance['form'].patchValue({ email: 'not-an-email' });
    const emitted = vi.fn();
    fixture.componentInstance.save.subscribe(emitted);

    fixture.componentInstance.submit();

    expect(emitted).not.toHaveBeenCalled();
  });

  it('emits the snake_case payload, including the tracked avatar url, on a valid submit', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('user', USER);
    fixture.componentRef.setInput(
      'avatarUrl',
      'https://res.cloudinary.com/demo/image/upload/new.jpg',
    );
    fixture.detectChanges();
    fixture.componentInstance['form'].patchValue({ first_name: 'Ana Maria' });
    const emitted = vi.fn();
    fixture.componentInstance.save.subscribe(emitted);

    fixture.componentInstance.submit();

    expect(emitted).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Ana Maria',
        avatar: 'https://res.cloudinary.com/demo/image/upload/new.jpg',
      }),
    );
  });

  it('applies a field-level server error to the matching control', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('user', USER);
    fixture.detectChanges();

    fixture.componentRef.setInput('error', {
      type: 'field',
      errors: { email: ['This email is already in use.'] },
    });
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].get('email')?.errors).toEqual({
      server: 'This email is already in use.',
    });
  });
});
