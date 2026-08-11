import { ApiError } from '@core/models/api-error.model';

interface DetailErrorBody {
  readonly detail: string;
  readonly code?: string;
}

interface NonFieldErrorBody {
  readonly non_field_errors: readonly string[];
}

type FieldErrorBody = Record<string, readonly string[]>;

function isDetailErrorBody(body: unknown): body is DetailErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Record<string, unknown>)['detail'] === 'string'
  );
}

function isNonFieldErrorBody(body: unknown): body is NonFieldErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as Record<string, unknown>)['non_field_errors'])
  );
}

function isFieldErrorBody(body: unknown): body is FieldErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    Object.values(body as Record<string, unknown>).every((value) => Array.isArray(value))
  );
}

const RETRY_AFTER_PATTERN = /available in (\d+) seconds/i;

/**
 * Normalizes a DRF error response into an `ApiError`. Branches on response
 * shape and status code, never on the text of a `detail` message — wording
 * varies by endpoint (see docs/API.md).
 */
export function mapApiError(status: number, body: unknown): ApiError {
  if (status === 429 && isDetailErrorBody(body)) {
    const match = RETRY_AFTER_PATTERN.exec(body.detail);
    return {
      type: 'throttled',
      message: body.detail,
      retryAfterSeconds: match ? Number(match[1]) : undefined,
    };
  }

  if (isDetailErrorBody(body)) {
    return { type: 'detail', status, message: body.detail, code: body.code };
  }

  if (isNonFieldErrorBody(body)) {
    return { type: 'non-field', messages: body.non_field_errors };
  }

  if (isFieldErrorBody(body)) {
    return { type: 'field', errors: body };
  }

  return { type: 'unknown', status };
}
