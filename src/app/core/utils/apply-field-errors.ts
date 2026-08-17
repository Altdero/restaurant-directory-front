import { FormGroup } from '@angular/forms';
import { ApiError } from '@core/models/api-error.model';

/**
 * Maps a `'field'` `ApiError` onto a reactive form's controls, keyed by DRF
 * field name — a direct lookup, not a translation table, because form
 * control names in this codebase's auth/profile/owner forms are kept
 * snake_case to match the request DTO 1:1 specifically so this stays
 * correct without a mapping table. A field name the API returns that has no
 * matching control (or a non-`'field'` error) is a no-op — the caller is
 * expected to show a generic/top-level error for those cases.
 */
export function applyFieldErrors(form: FormGroup, error: ApiError): void {
  if (error.type !== 'field') {
    return;
  }
  for (const [field, messages] of Object.entries(error.errors)) {
    form.get(field)?.setErrors({ server: messages[0] });
  }
}
