import { apiErrorMessage } from './api-error-message';

describe('apiErrorMessage', () => {
  it('returns the detail message for a detail error', () => {
    expect(apiErrorMessage({ type: 'detail', status: 401, message: 'Bad credentials' })).toBe(
      'Bad credentials',
    );
  });

  it('returns the first message for a non-field error', () => {
    expect(apiErrorMessage({ type: 'non-field', messages: ['First', 'Second'] })).toBe('First');
  });

  it('returns the throttled message', () => {
    expect(apiErrorMessage({ type: 'throttled', message: 'Slow down' })).toBe('Slow down');
  });

  it('returns undefined for a field error, since those render per-control', () => {
    expect(apiErrorMessage({ type: 'field', errors: { username: ['required'] } })).toBeUndefined();
  });

  it('returns a generic fallback for an unknown error', () => {
    expect(apiErrorMessage({ type: 'unknown', status: 500 })).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
