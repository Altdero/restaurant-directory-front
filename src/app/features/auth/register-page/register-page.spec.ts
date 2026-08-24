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

  // The password-mismatch case is now proven end-to-end (equal precision)
  // by e2e/specs/auth.spec.ts's identical test. These two survive because
  // no E2E test exercises a successful registration or a server-side field
  // error — auth.spec.ts's other cases are all login/mismatch/logout.
  it('registers and navigates home on success', async () => {
    const fixture = createFixture();
    register.mockResolvedValue(undefined);
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
