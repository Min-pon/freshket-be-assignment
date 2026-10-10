import type { Satang } from './types.js';

const SATANG_PER_BAHT = 100;

export function toSatang(baht: number): Satang {
  return Math.round(baht * SATANG_PER_BAHT);
}

export function toBaht(amount: Satang): number {
  return amount / SATANG_PER_BAHT;
}

/**
 * `percent`% of `amount`, rounded to the nearest whole satang
 * (half rounds up, in the customer's favour for discounts).
 */
export function percentOf(amount: Satang, percent: number): Satang {
  return Math.round((amount * percent) / 100);
}

export function assertValidPercent(percent: number): void {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new RangeError(`Percent must be between 0 and 100, got ${percent}`);
  }
}
