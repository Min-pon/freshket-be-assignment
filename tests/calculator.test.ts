import { describe, expect, it } from 'vitest';
import { Calculator } from '../src/calculator.js';
import { InvalidOrderError } from '../src/errors.js';
import type { DiscountRule, Order } from '../src/types.js';

const calculator = new Calculator();

describe('Calculator', () => {
  it('prices the example from the brief: Red + Green = 90', () => {
    expect(calculator.calculate({ RED: 1, GREEN: 1 })).toBe(90);
  });

  it('treats a missing member flag as no member card', () => {
    expect(calculator.calculate({ RED: 1 })).toBe(calculator.calculate({ RED: 1 }, { hasMemberCard: false }));
  });

  it('does not change the order passed in', () => {
    const order: Order = { ORANGE: 5 };
    calculator.calculate(order, { hasMemberCard: true });
    expect(order).toEqual({ ORANGE: 5 });
  });

  describe('custom rules', () => {
    it('charges full price with no rules', () => {
      expect(new Calculator([]).calculate({ ORANGE: 2 }, { hasMemberCard: true })).toBe(240);
    });

    it('runs rules in order, passing the running total', () => {
      const seen: number[] = [];
      const recordAndTake = (amount: number): DiscountRule => ({
        name: `take ${amount}`,
        discount: (_context, currentTotal) => {
          seen.push(currentTotal);
          return amount;
        },
      });

      const result = new Calculator([recordAndTake(1000), recordAndTake(500)]).calculate({ ORANGE: 1 });

      expect(seen).toEqual([12000, 11000]);
      expect(result).toBe(105);
    });

    it('never goes below zero', () => {
      const takeEverything: DiscountRule = { name: 'free', discount: () => 1_000_000 };
      expect(new Calculator([takeEverything]).calculate({ RED: 1 })).toBe(0);
    });

    it.each([-1, 1.5, Number.NaN])('rejects a rule that returns %d', (amount) => {
      const broken: DiscountRule = { name: 'broken', discount: () => amount };
      expect(() => new Calculator([broken]).calculate({ RED: 1 })).toThrow(/broken returned an invalid discount/);
    });
  });

  describe('validation', () => {
    const calculateUnchecked = (order: unknown, hasMemberCard?: unknown) =>
      calculator.calculate(order as Order, { hasMemberCard: hasMemberCard as boolean });

    it.each([null, undefined, 'RED', 5, ['RED']])('rejects %j as an order', (order) => {
      expect(() => calculateUnchecked(order)).toThrow(InvalidOrderError);
    });

    it('rejects an item that is not on the menu', () => {
      expect(() => calculateUnchecked({ BLACK: 1 })).toThrow('Unknown menu item: BLACK');
    });

    it('rejects a lowercase item name', () => {
      expect(() => calculateUnchecked({ red: 1 })).toThrow(InvalidOrderError);
    });

    it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '2', null])(
      'rejects quantity %j',
      (quantity) => {
        expect(() => calculateUnchecked({ ORANGE: quantity })).toThrow(InvalidOrderError);
      },
    );

    it('accepts a quantity of 0', () => {
      expect(calculator.calculate({ ORANGE: 0, RED: 1 })).toBe(50);
    });

    it.each(['yes', 1, null])('rejects member flag %j', (flag) => {
      expect(() => calculateUnchecked({ RED: 1 }, flag)).toThrow(InvalidOrderError);
    });
  });
});
