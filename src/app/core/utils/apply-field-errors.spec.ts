import { FormControl, FormGroup } from '@angular/forms';

import { applyFieldErrors } from './apply-field-errors';

describe('applyFieldErrors', () => {
  it('sets a server error on each control named by a field ApiError', () => {
    const form = new FormGroup({
      username: new FormControl(''),
      email: new FormControl(''),
    });

    applyFieldErrors(form, {
      type: 'field',
      errors: { username: ['Already taken.'], email: ['Enter a valid email.'] },
    });

    expect(form.get('username')?.errors).toEqual({ server: 'Already taken.' });
    expect(form.get('email')?.errors).toEqual({ server: 'Enter a valid email.' });
  });

  it('ignores a field name with no matching control', () => {
    const form = new FormGroup({ username: new FormControl('') });

    applyFieldErrors(form, { type: 'field', errors: { nonexistent: ['x'] } });

    expect(form.get('username')?.errors).toBeNull();
  });

  it('is a no-op for a non-field ApiError', () => {
    const form = new FormGroup({ username: new FormControl('') });

    applyFieldErrors(form, { type: 'detail', status: 401, message: 'Bad credentials' });

    expect(form.get('username')?.errors).toBeNull();
  });
});
