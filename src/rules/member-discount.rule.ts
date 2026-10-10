import { assertValidPercent, percentOf } from '../money.js';
import type { DiscountRule, PricingContext, Satang } from '../types.js';

export interface MemberDiscountOptions {
  readonly percent: number;
}

/**
 * Takes `percent`% off the running total for customers with a member card.
 * Place it after per-item rules so it applies to the already discounted total.
 */
export class MemberDiscountRule implements DiscountRule {
  readonly name: string;
  private readonly percent: number;

  constructor({ percent }: MemberDiscountOptions) {
    assertValidPercent(percent);
    this.percent = percent;
    this.name = `Member discount ${percent}%`;
  }

  discount(context: PricingContext, currentTotal: Satang): Satang {
    return context.hasMemberCard ? percentOf(currentTotal, this.percent) : 0;
  }
}
