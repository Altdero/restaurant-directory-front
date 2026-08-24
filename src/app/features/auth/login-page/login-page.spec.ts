import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { AuthStore } from '@core/services/auth/auth.store';

import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let login: ReturnType<typeof vi.fn>;

  function createFixture() {
    login = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { login } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    });

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    return TestBed.createComponent(LoginPage);
  }

  // The happy/failure paths (returnUrl navigation, home navigation, 401
  // error banner) are now proven end-to-end by e2e/specs/auth.spec.ts with
  // equal precision (exact resulting URL, exact error text) — kept only
  // the one scenario no E2E test exercises: submitting an invalid form via
  // Enter (reachable despite the submit button being disabled, since a
  // native form submission event isn't gated by that button's state).
  it('does not call AuthStore.login when the form is invalid', async () => {
    const fixture = createFixture();
    await fixture.componentInstance.submit();

    expect(login).not.toHaveBeenCalled();
  });
});
