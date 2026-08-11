/**
 * Parses an API timestamp into a `Date`. Timestamps are ISO-8601 with a
 * `-06:00` offset (`America/Mexico_City`, no DST) and microsecond precision
 * (e.g. `2026-08-07T21:30:32.680664-06:00`) — never assume a trailing `Z`.
 * The native `Date` constructor parses this correctly (offset-aware,
 * truncating sub-millisecond precision, which this app never needs).
 */
export function parseApiDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Expected an ISO-8601 timestamp, received "${value}"`);
  }
  return parsed;
}
