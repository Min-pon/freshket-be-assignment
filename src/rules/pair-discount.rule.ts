import { MENU } from '../menu.js';
import { assertValidPercent, percentOf, toSatang } from '../money.js';
import type { DiscountRule, MenuItem, PricingContext, Satang } from '../types.js';

const ITEMS_PER_PAIR = 2;

export interface PairDiscountOptions {
  /** Items that get the discount when ordered in pairs of the same item. */
  readonly items: readonly MenuItem[];
  readonly percent: number;
}

/**
 * Takes `percent`% off every complete pair of the same eligible item.
 * Leftover single items pay full price, e.g. 5 Orange = 2 pairs + 1.
 */
export class PairDiscountRule implements DiscountRule {
  readonly name: string;
  private readonly items: ReadonlySet<MenuItem>;
  private readonly percent: number;

  constructor({ items, percent }: PairDiscountOptions) {
    assertValidPercent(percent);
    this.items = new Set(items);
    this.percent = percent;
    this.name = `Pair discount ${percent}% (${[...this.items].join(', ')})`;
  }

  discount(context: PricingContext): Satang {
    let pairedAmount: Satang = 0;
    for (const item of this.items) {
      const quantity = context.order[item] ?? 0;
      const pairs = Math.floor(quantity / ITEMS_PER_PAIR);
      pairedAmount += pairs * ITEMS_PER_PAIR * toSatang(MENU[item]);
    }
    return percentOf(pairedAmount, this.percent);
  }
}
