import { MemberDiscountRule } from './rules/member-discount.rule.js';
import { PairDiscountRule } from './rules/pair-discount.rule.js';
import type { DiscountRule } from './types.js';

/**
 * The store's current promotions, applied in this order: pair discounts
 * first, then the member discount on what is left. Frozen so no caller can
 * change the defaults that every `new Calculator()` uses.
 */
export const STORE_DISCOUNT_RULES: readonly DiscountRule[] = Object.freeze([
  new PairDiscountRule({ items: ['ORANGE', 'PINK', 'GREEN'], percent: 5 }),
  new MemberDiscountRule({ percent: 10 }),
]);
