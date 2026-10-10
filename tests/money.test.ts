import { describe, expect, it } from 'vitest';
import { assertValidPercent, percentOf, toBaht, toSatang } from '../src/money.js';

describe('toSatang / toBaht', () => {
  it('converts between baht and satang', () => {
    expect(toSatang(120)).toBe(12000);
    expect(toBaht(51840)).toBe(518.4);
  });

  it('rounds away floating point noise', () => {
    expect(toSatang(1.15)).toBe(115); // 1.15 * 100 = 114.99999999999999
  });
});

describe('percentOf', () => {
  it('returns whole satang', () => {
    expect(percentOf(26800, 10)).toBe(2680);
    expect(percentOf(24000, 5)).toBe(1200);
  });

  it('rounds half up', () => {
    expect(percentOf(1050, 5)).toBe(53); // 52.5
    expect(percentOf(1030, 5)).toBe(52); // 51.5
    expect(percentOf(1010, 5)).toBe(51); // 50.5
    expect(percentOf(1020, 5)).toBe(51); // 51
  });
});

describe('assertValidPercent', () => {
  it.each([0, 5, 10, 100])('accepts %d', (percent) => {
    expect(() => assertValidPercent(percent)).not.toThrow();
  });

  it.each([-1, 101, Number.NaN, Number.POSITIVE_INFINITY])('rejects %d', (percent) => {
    expect(() => assertValidPercent(percent)).toThrow(RangeError);
  });
});
