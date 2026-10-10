import { describe, expect, it } from 'vitest';
import { Calculator } from '../src/calculator.js';
import { InvalidOrderError } from '../src/errors.js';
import type { DiscountRule, Order } from '../src/types.js';

const calculator = new Calculator();

describe('Calculator.calculateBreakdown', () => {
  it('shows every step for 5 Orange with a member card', () => {
    expect(calculator.calculateBreakdown({ ORANGE: 5 }, { hasMemberCard: true })).toEqual({
      lines: [{ item: 'ORANGE', quantity: 5, unitPrice: 120, amount: 600 }],
      subtotal: 600,
      discounts: [
        { name: 'Pair discount 5% (ORANGE, PINK, GREEN)', amount: 24 },
        { name: 'Member discount 10%', amount: 57.6 },
      ],
      total: 518.4,
    });
  });

  it('leaves out rules that took nothing off', () => {
    expect(calculator.calculateBreakdown({ RED: 1, GREEN: 1 })).toEqual({
      lines: [
        { item: 'RED', quantity: 1, unitPrice: 50, amount: 50 },
        { item: 'GREEN', quantity: 1, unitPrice: 40, amount: 40 },
      ],
      subtotal: 90,
      discounts: [],
      total: 90,
    });
  });

  it('lists lines in menu order and skips quantities of 0', () => {
    const { lines } = calculator.calculateBreakdown({ ORANGE: 1, BLUE: 0, RED: 2 });
    expect(lines.map((line) => line.item)).toEqual(['RED', 'ORANGE']);
  });

  it('returns an empty bill for an empty order', () => {
    expect(calculator.calculateBreakdown({}, { hasMemberCard: true })).toEqual({
      lines: [],
      subtotal: 0,
      discounts: [],
      total: 0,
    });
  });

  it('shows a discount capped at the remaining total', () => {
    const takeEverything: DiscountRule = { name: 'Free meal', discount: () => 1_000_000 };
    const { discounts, total } = new Calculator([takeEverything]).calculateBreakdown({ RED: 1 });
    expect(discounts).toEqual([{ name: 'Free meal', amount: 50 }]);
    expect(total).toBe(0);
  });

  it('adds up: subtotal − discounts = total', () => {
    const breakdown = calculator.calculateBreakdown({ PINK: 2, GREEN: 3, BLUE: 1 }, { hasMemberCard: true });
    const lineTotal = breakdown.lines.reduce((sum, line) => sum + line.amount, 0);
    const discountTotal = breakdown.discounts.reduce((sum, discount) => sum + discount.amount, 0);

    expect(lineTotal).toBe(breakdown.subtotal);
    // Summed here in THB, so allow float noise from this test's own arithmetic.
    expect(breakdown.subtotal - discountTotal).toBeCloseTo(breakdown.total, 10);
  });

  it.each<[Order, boolean]>([
    [{ RED: 1, GREEN: 1 }, false],
    [{ ORANGE: 5 }, true],
    [{ PINK: 2, GREEN: 3 }, true],
  ])('has the same total as calculate() for %j (member: %s)', (order, hasMemberCard) => {
    expect(calculator.calculateBreakdown(order, { hasMemberCard }).total).toBe(
      calculator.calculate(order, { hasMemberCard }),
    );
  });

  it('validates the order like calculate()', () => {
    expect(() => calculator.calculateBreakdown({ BLACK: 1 } as Order)).toThrow(InvalidOrderError);
  });
});
