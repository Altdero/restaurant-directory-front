import { parseDecimal } from './decimal';

describe('parseDecimal', () => {
  it('parses a whole-number decimal string', () => {
    expect(parseDecimal('12')).toBe(12);
  });

  it('parses a fractional decimal string', () => {
    expect(parseDecimal('9.99')).toBe(9.99);
  });

  it('parses "0.00" as zero, not falsy-and-skipped', () => {
    expect(parseDecimal('0.00')).toBe(0);
  });

  it('parses a negative decimal string (e.g. longitude)', () => {
    expect(parseDecimal('-99.133209')).toBeCloseTo(-99.133209);
  });

  it('throws on a non-numeric string instead of silently returning NaN', () => {
    expect(() => parseDecimal('not-a-number')).toThrow();
  });

  it('throws on a string with trailing non-numeric characters', () => {
    expect(() => parseDecimal('12.5kg')).toThrow();
  });
});
