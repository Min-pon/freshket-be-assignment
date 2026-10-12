import { describe, expect, it } from 'vitest';
import { PairDiscountRule } from '../../src/rules/pair-discount.rule.js';
import type { MenuItem, Order } from '../../src/types.js';

const rule = new PairDiscountRule({ items: ['ORANGE', 'PINK', 'GREEN'], percent: 5 });

const discountFor = (order: Order) => rule.discount({ order, hasMemberCard: false });

describe('PairDiscountRule', () => {
  it('gives no discount for a single eligible item', () => {
    expect(discountFor({ GREEN: 1 })).toBe(0);
  });

  it('takes 5% off one pair', () => {
    expect(discountFor({ ORANGE: 2 })).toBe(1200); // 240 * 5% = 12 THB
  });

  it('discounts only complete pairs (5 Orange = 2 pairs + 1)', () => {
    expect(discountFor({ ORANGE: 5 })).toBe(2400); // 4 * 120 * 5% = 24 THB
  });

  it('counts pairs per item, adding up across items', () => {
    expect(discountFor({ PINK: 2, GREEN: 3 })).toBe(800 + 400);
  });

  it('does not pair different items together', () => {
    expect(discountFor({ ORANGE: 1, PINK: 1 })).toBe(0);
  });

  it('ignores items that are not eligible', () => {
    expect(discountFor({ RED: 2, BLUE: 4 })).toBe(0);
  });

  it('gives no discount for an empty order', () => {
    expect(discountFor({})).toBe(0);
  });

  it('ignores the running total and member card', () => {
    const context = { order: { ORANGE: 2 }, hasMemberCard: true };
    expect(rule.discount(context)).toBe(1200);
  });

  it('counts a duplicated item in the options only once', () => {
    const duplicated = new PairDiscountRule({ items: ['ORANGE', 'ORANGE'], percent: 5 });
    expect(duplicated.discount({ order: { ORANGE: 2 }, hasMemberCard: false })).toBe(1200);
  });

  it('works with other items and percentages', () => {
    const custom = new PairDiscountRule({ items: ['RED'], percent: 10 });
    expect(custom.discount({ order: { RED: 4 }, hasMemberCard: false })).toBe(2000);
  });

  it('rejects a percent outside 0-100', () => {
    expect(() => new PairDiscountRule({ items: ['ORANGE'], percent: 150 })).toThrow(RangeError);
  });

  it.each(['BLACK', 'orange', 'toString'])('rejects %o as an item when built', (item) => {
    const items = [item] as unknown as MenuItem[];
    expect(() => new PairDiscountRule({ items, percent: 5 })).toThrow(
      `Unknown menu item in pair discount: ${item}`,
    );
  });

  it('describes itself', () => {
    expect(rule.name).toBe('Pair discount 5% (ORANGE, PINK, GREEN)');
  });
});
