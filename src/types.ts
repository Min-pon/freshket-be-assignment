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
