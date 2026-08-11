/**
 * Parses a DRF DecimalField JSON string (e.g. `"12.50"`) into a number.
 * Decimal fields (`price`, `average_rating`, `latitude`, `longitude`) are
 * always serialized as strings by this API — never coerce with `+` or
 * assume a JSON number, or a valid response can silently produce `NaN`.
 */
export function parseDecimal(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected a decimal string, received "${value}"`);
  }
  return parsed;
}
