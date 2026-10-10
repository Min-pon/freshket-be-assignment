import type { MENU } from './menu.js';

export type MenuItem = keyof typeof MENU;

/** Quantity ordered per item. Items not ordered can be omitted. */
export type Order = Partial<Record<MenuItem, number>>;

/**
 * Money in satang (1 THB = 100 satang). All calculation is done in whole
 * satang to avoid floating point errors; convert to THB only at the edge.
 */
export type Satang = number;

export interface PricingContext {
  readonly order: Readonly<Order>;
  readonly hasMemberCard: boolean;
}

/**
 * A pricing rule that takes money off the bill. Rules run in order, and each
 * one sees the total left after the rules before it.
 */
export interface DiscountRule {
  readonly name: string;
  /** Returns the discount to subtract from `currentTotal`, never negative. */
  discount(context: PricingContext, currentTotal: Satang): Satang;
}

/** One row of the bill. Amounts in THB. */
export interface LineItem {
  readonly item: MenuItem;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly amount: number;
}

/** A discount that took money off the bill. Amount in THB. */
export interface AppliedDiscount {
  readonly name: string;
  readonly amount: number;
}

/** How the price was reached, like a receipt. Amounts in THB. */
export interface PriceBreakdown {
  readonly lines: readonly LineItem[];
  readonly subtotal: number;
  /** Discounts in the order they were applied; rules that took nothing off are left out. */
  readonly discounts: readonly AppliedDiscount[];
  readonly total: number;
}
