import { mapApiError } from './error-mapper';

describe('mapApiError', () => {
  it('maps field validation errors (400)', () => {
    const body = { email: ['This field is required.'], price: ['Price must be greater than 0.'] };
    expect(mapApiError(400, body)).toEqual({ type: 'field', errors: body });
  });

  it('maps non-field validation errors (400)', () => {
    const body = { non_field_errors: ['You have already reviewed this restaurant.'] };
    expect(mapApiError(400, body)).toEqual({
      type: 'non-field',
      messages: body.non_field_errors,
    });
  });

  it('maps a flat detail error (403)', () => {
    const body = { detail: 'You do not have permission to perform this action.' };
    expect(mapApiError(403, body)).toEqual({
      type: 'detail',
      status: 403,
      message: body.detail,
      code: undefined,
    });
  });

  it('maps a not-found detail error (404) without matching on its wording', () => {
    const body = { detail: 'No Restaurant matches the given query.' };
    expect(mapApiError(404, body)).toEqual({
      type: 'detail',
      status: 404,
      message: body.detail,
      code: undefined,
    });
  });

  it('maps an invalid/expired JWT error (401) and preserves its code', () => {
    const body = { detail: 'Token is invalid or expired', code: 'token_not_valid' };
    expect(mapApiError(401, body)).toEqual({
      type: 'detail',
      status: 401,
      message: body.detail,
      code: 'token_not_valid',
    });
  });

  it('maps a failed login (401, not 400) as a detail error', () => {
    const body = { detail: 'No active account found with the given credentials' };
    expect(mapApiError(401, body)).toEqual({
      type: 'detail',
      status: 401,
      message: body.detail,
      code: undefined,
    });
  });

  it('maps a throttled response (429) and extracts the retry delay', () => {
    const body = { detail: 'Request was throttled. Expected available in 42 seconds.' };
    expect(mapApiError(429, body)).toEqual({
      type: 'throttled',
      message: body.detail,
      retryAfterSeconds: 42,
    });
  });

  it('maps a throttled response (429) without a parseable delay', () => {
    const body = { detail: 'Request was throttled.' };
    expect(mapApiError(429, body)).toEqual({
      type: 'throttled',
      message: body.detail,
      retryAfterSeconds: undefined,
    });
  });

  it('falls back to unknown for an unrecognized body shape', () => {
    expect(mapApiError(500, { unexpected: 'shape' })).toEqual({ type: 'unknown', status: 500 });
  });

  it('falls back to unknown for a null body', () => {
    expect(mapApiError(500, null)).toEqual({ type: 'unknown', status: 500 });
  });
});
