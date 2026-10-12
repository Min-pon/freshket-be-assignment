import { MENU, MENU_ITEMS } from './menu.js';
import { toBaht, toSatang } from './money.js';
import { STORE_DISCOUNT_RULES } from './promotions.js';
import { assertValidMemberFlag, parseOrder } from './validation.js';
import type {
  AppliedDiscount,
  DiscountRule,
  LineItem,
  Order,
  PriceBreakdown,
  PricingContext,
  Satang,
} from './types.js';

export interface CalculateOptions {
  readonly hasMemberCard?: boolean;
}

export class Calculator {
  constructor(private readonly rules: readonly DiscountRule[] = STORE_DISCOUNT_RULES) {}

  /**
   * Returns the price to pay in THB, e.g. `calculate({ RED: 1, GREEN: 1 })` → 90.
   * Throws `InvalidOrderError` for unknown items or invalid quantities.
   */
  calculate(order: Order, options: CalculateOptions = {}): number {
    return this.calculateBreakdown(order, options).total;
  }

  /**
   * Same as `calculate`, but returns each line, subtotal and discount
   * that led to the total.
   */
  calculateBreakdown(input: Order, { hasMemberCard = false }: CalculateOptions = {}): PriceBreakdown {
    const order = parseOrder(input);
    assertValidMemberFlag(hasMemberCard);

    const lines = this.lineItems(order);
    const subtotal = lines.reduce((total, line) => total + line.amount, 0);

    const context: PricingContext = { order, hasMemberCard };
    const discounts: AppliedDiscount[] = [];
    let total = subtotal;
    for (const rule of this.rules) {
      const amount = this.discountFrom(rule, context, total);
      if (amount > 0) {
        discounts.push({ name: rule.name, amount: toBaht(amount) });
      }
      total -= amount;
    }

    return {
      lines: lines.map((line) => ({
        ...line,
        unitPrice: toBaht(line.unitPrice),
        amount: toBaht(line.amount),
      })),
      subtotal: toBaht(subtotal),
      discounts,
      total: toBaht(total),
    };
  }

  /** Ordered items in menu order, with prices in satang. */
  private lineItems(order: Order): LineItem[] {
    return MENU_ITEMS.flatMap((item) => {
      const quantity = order[item] ?? 0;
      if (quantity === 0) {
        return [];
      }
      const unitPrice: Satang = toSatang(MENU[item]);
      return [{ item, quantity, unitPrice, amount: unitPrice * quantity }];
    });
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
