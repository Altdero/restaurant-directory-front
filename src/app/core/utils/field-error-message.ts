import { AbstractControl } from '@angular/forms';

/**
 * A single display message for one form control's current error, or
 * `undefined` when there's nothing to show — either the control is valid,
 * or it hasn't been touched yet (matches Material's own default
 * `ErrorStateMatcher`: invalid + touched). `server` (set by
 * `applyFieldErrors`) takes precedence since it's the most specific,
 * already-worded message available.
 */
export function fieldErrorMessage(control: AbstractControl | null | undefined): string | undefined {
  if (!control || !control.touched || control.valid) {
    return undefined;
  }
  if (control.hasError('server')) {
    return control.getError('server');
  }
  if (control.hasError('required')) {
    return $localize`:@@validation.required:This field is required.`;
  }
  if (control.hasError('email')) {
    return $localize`:@@validation.email:Enter a valid email address.`;
  }
  if (control.hasError('min')) {
    return $localize`:@@validation.min:Must be at least ${control.getError('min').min}:min:.`;
  }
  return undefined;
}
