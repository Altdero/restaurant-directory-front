import { parseApiDate } from './date';

describe('parseApiDate', () => {
  it('parses a -06:00 offset timestamp with microsecond precision', () => {
    const parsed = parseApiDate('2026-08-07T21:30:32.680664-06:00');
    expect(parsed.toISOString()).toBe('2026-08-08T03:30:32.680Z');
  });

  it('parses a timestamp at the -06:00/UTC day boundary correctly', () => {
    const parsed = parseApiDate('2026-01-01T18:00:00.000000-06:00');
    expect(parsed.getUTCDate()).toBe(2);
  });

  it('parses a plain Z-suffixed ISO timestamp too', () => {
    const parsed = parseApiDate('2026-08-07T21:30:32.000Z');
    expect(parsed.toISOString()).toBe('2026-08-07T21:30:32.000Z');
  });

  it('throws on an invalid timestamp instead of returning an Invalid Date', () => {
    expect(() => parseApiDate('not-a-timestamp')).toThrow();
  });
});
