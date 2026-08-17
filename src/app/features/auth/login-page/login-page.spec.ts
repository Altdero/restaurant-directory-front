import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { ApiError } from '@core/models/api-error.model';
import { AuthStore } from '@core/services/auth/auth.store';

import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let login: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  function createFixture(returnUrl: string | null = null) {
    login = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { login } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => returnUrl } } },
        },
      ],
    });

    navigateByUrl = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true) as unknown as ReturnType<typeof vi.fn>;

    return TestBed.createComponent(LoginPage);
  }

  it('does not call AuthStore.login when the form is invalid', async () => {
    const fixture = createFixture();
    await fixture.componentInstance.submit();

    expect(login).not.toHaveBeenCalled();
  });

  it('logs in and navigates to the returnUrl on success', async () => {
    login.mockResolvedValue(undefined);
    const fixture = createFixture('/favorites');
    fixture.componentInstance.form.setValue({ username: 'ana', password: 'secret' });

    await fixture.componentInstance.submit();

    expect(login).toHaveBeenCalledWith({ username: 'ana', password: 'secret' });
    expect(navigateByUrl).toHaveBeenCalledWith('/favorites');
  });

  it('navigates home when there is no returnUrl', async () => {
    login.mockResolvedValue(undefined);
    const fixture = createFixture(null);
    fixture.componentInstance.form.setValue({ username: 'ana', password: 'secret' });

    await fixture.componentInstance.submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows a top-level error and does not navigate on a failed login', async () => {
    const error: ApiError = { type: 'detail', status: 401, message: 'Bad credentials' };
    const fixture = createFixture();
    login.mockRejectedValue(error);
    fixture.componentInstance.form.setValue({ username: 'ana', password: 'wrong' });

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.topLevelError()).toBe('Bad credentials');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
