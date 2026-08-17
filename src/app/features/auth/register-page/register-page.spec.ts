import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApiError } from '@core/models/api-error.model';
import { AuthStore } from '@core/services/auth/auth.store';

import { RegisterPage } from './register-page';

const VALID_VALUE = {
  username: 'ana',
  email: 'ana@example.com',
  first_name: 'Ana',
  last_name: 'Ruiz',
  password: 'secret123',
  password_confirm: 'secret123',
};

describe('RegisterPage', () => {
  let register: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  function createFixture() {
    register = vi.fn();

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: { register } }],
    });

    navigateByUrl = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true) as unknown as ReturnType<typeof vi.fn>;

    return TestBed.createComponent(RegisterPage);
  }

  it('flags a password/confirm mismatch and does not submit', async () => {
    const fixture = createFixture();
    fixture.componentInstance.form.setValue({ ...VALID_VALUE, password_confirm: 'different' });

    expect(fixture.componentInstance.form.errors).toEqual({ passwordMismatch: true });

    await fixture.componentInstance.submit();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers and navigates home on success', async () => {
    register.mockResolvedValue(undefined);
    const fixture = createFixture();
    fixture.componentInstance.form.setValue(VALID_VALUE);

    await fixture.componentInstance.submit();

    expect(register).toHaveBeenCalledWith(VALID_VALUE);
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('applies server field errors and shows no top-level message for them', async () => {
    const error: ApiError = { type: 'field', errors: { username: ['Already taken.'] } };
    const fixture = createFixture();
    register.mockRejectedValue(error);
    fixture.componentInstance.form.setValue(VALID_VALUE);

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.form.get('username')?.errors).toEqual({
      server: 'Already taken.',
    });
    expect(fixture.componentInstance.topLevelError()).toBeUndefined();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
