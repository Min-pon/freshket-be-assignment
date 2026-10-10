import { MENU } from './menu.js';
import { toBaht, toSatang } from './money.js';
import { STORE_DISCOUNT_RULES } from './promotions.js';
import { assertValidMemberFlag, assertValidOrder } from './validation.js';
import type { DiscountRule, Order, PricingContext, Satang } from './types.js';

export interface CalculateOptions {
  readonly hasMemberCard?: boolean;
}

export class Calculator {
  constructor(private readonly rules: readonly DiscountRule[] = STORE_DISCOUNT_RULES) {}

  /**
   * Returns the price to pay in THB, e.g. `calculate({ RED: 1, GREEN: 1 })` → 90.
   * Throws `InvalidOrderError` for unknown items or invalid quantities.
   */
  calculate(order: Order, { hasMemberCard = false }: CalculateOptions = {}): number {
    assertValidOrder(order);
    assertValidMemberFlag(hasMemberCard);

    const context: PricingContext = { order, hasMemberCard };
    const total = this.rules.reduce(
      (runningTotal, rule) => runningTotal - this.discountFrom(rule, context, runningTotal),
      this.subtotal(order),
    );
    return toBaht(total);
  }

  private subtotal(order: Order): Satang {
    let total: Satang = 0;
    for (const [item, unitPrice] of Object.entries(MENU)) {
      total += toSatang(unitPrice) * (order[item as keyof Order] ?? 0);
    }
    return total;
  }

  /** Runs one rule, never letting the bill go below zero. */
  private discountFrom(rule: DiscountRule, context: PricingContext, runningTotal: Satang): Satang {
    const discount = rule.discount(context, runningTotal);
    if (!Number.isSafeInteger(discount) || discount < 0) {
      throw new Error(`${rule.name} returned an invalid discount: ${discount}`);
    }
    return Math.min(discount, runningTotal);
  }
}
