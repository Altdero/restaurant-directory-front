import { ApiError } from '@core/models/api-error.model';

/**
 * A single top-level message for an `ApiError`, for forms that show one
 * error banner alongside per-field errors (see `apply-field-errors.ts`).
 * `'field'` deliberately has no top-level text here — those errors belong
 * on their controls, not in a banner a caller would show alongside them.
 */
export function apiErrorMessage(error: ApiError): string | undefined {
  switch (error.type) {
    case 'detail':
    case 'non-field':
      return error.type === 'detail' ? error.message : error.messages[0];
    case 'throttled':
      return error.message;
    case 'unknown':
      return $localize`:@@error.generic:Something went wrong. Please try again.`;
    case 'field':
      return undefined;
  }
}
