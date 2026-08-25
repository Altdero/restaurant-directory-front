import { FormControl, Validators } from '@angular/forms';

import { fieldErrorMessage } from './field-error-message';

describe('fieldErrorMessage', () => {
  it('returns undefined for a null/undefined control', () => {
    expect(fieldErrorMessage(null)).toBeUndefined();
    expect(fieldErrorMessage(undefined)).toBeUndefined();
  });

  it('returns undefined for a valid control', () => {
    const control = new FormControl('ok', Validators.required);
    control.markAsTouched();
    expect(fieldErrorMessage(control)).toBeUndefined();
  });

  it('returns undefined for an invalid but untouched control', () => {
    const control = new FormControl('', Validators.required);
    expect(fieldErrorMessage(control)).toBeUndefined();
  });

  it('returns a required message once touched', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    expect(fieldErrorMessage(control)).toBe('This field is required.');
  });

  it('returns an email message', () => {
    const control = new FormControl('not-an-email', Validators.email);
    control.markAsTouched();
    expect(fieldErrorMessage(control)).toBe('Enter a valid email address.');
  });

  it('returns a min message with the actual minimum interpolated', () => {
    const control = new FormControl(0, Validators.min(0.01));
    control.markAsTouched();
    expect(fieldErrorMessage(control)).toBe('Must be at least 0.01.');
  });

  it('prefers a server error over a client-side one', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    control.setErrors({ required: true, server: 'This email is already in use.' });
    expect(fieldErrorMessage(control)).toBe('This email is already in use.');
  });
});
