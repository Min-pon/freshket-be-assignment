import { describe, expect, it } from 'vitest';
import { Calculator } from '../src/calculator.js';
import { InvalidOrderError } from '../src/errors.js';
import type { DiscountRule, Order } from '../src/types.js';

const calculator = new Calculator();

describe('Calculator', () => {
  it('prices the example from the brief: Red + Green = 90', () => {
    expect(calculator.calculate({ RED: 1, GREEN: 1 })).toBe(90);
  });

  it('treats null options from plain JavaScript as no options', () => {
    expect(calculator.calculate({ RED: 1 }, null as unknown as undefined)).toBe(50);
  });

  it('rejects an order too large to price exactly', () => {
    expect(() => calculator.calculate({ ORANGE: 1e13 }, { hasMemberCard: true })).toThrow(
      new InvalidOrderError('Order is too large to price exactly'),
    );
  });

  it('prices orders right up to the limit', () => {
    // Limit: floor(MAX_SAFE_INTEGER / 100) = 90_071_992_547_409 satang.
    // 7_505_999_378 Orange = 90_071_992_536_000 satang, minus 5% on 3_752_999_689 pairs.
    expect(calculator.calculate({ ORANGE: 7_505_999_378 })).toBe(855_683_929_092);
    expect(() => calculator.calculate({ ORANGE: 7_505_999_379 })).toThrow(InvalidOrderError);
  });

  it('treats a missing member flag as no member card', () => {
    expect(calculator.calculate({ RED: 1 })).toBe(calculator.calculate({ RED: 1 }, { hasMemberCard: false }));
  });

  it('does not change the order passed in, so a frozen order works', () => {
    const order: Order = Object.freeze({ ORANGE: 5 });
    expect(calculator.calculate(order, { hasMemberCard: true })).toBe(518.4);
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

    // Labelled tuples: it.each would spread a bare ['RED'] into arguments instead of passing the array.
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['a string', 'RED'],
      ['a number', 5],
      ['an array', ['RED']],
    ])('rejects %s as an order', (_label, order) => {
      expect(() => calculateUnchecked(order)).toThrow(InvalidOrderError);
    });

    describe('only prices what was checked', () => {
      it.each([
        ['an inherited string quantity', Object.create({ RED: '2' })],
        ['an inherited negative quantity', Object.create({ PINK: -3 })],
        ['a __proto__ literal', { __proto__: { RED: 5 } }],
        ['a Map', new Map([['RED', 1]])],
        ['a Date', new Date()],
        ['a class instance', new (class Order { RED = 1; })()],
      ])('rejects %s', (_label, order) => {
        expect(() => calculateUnchecked(order)).toThrow(InvalidOrderError);
      });

      it('accepts an object with no prototype', () => {
        const order = Object.assign(Object.create(null), { RED: 1, ORANGE: 2 });
        expect(calculateUnchecked(order)).toBe(278);
      });

      it('ignores own keys that are not enumerable', () => {
        const order = Object.defineProperty({ RED: 1 }, 'ORANGE', { value: 2, enumerable: false });
        expect(calculator.calculate(order)).toBe(50);
      });

      it('gives rules a checked copy of the order, not the input', () => {
        const input: Order = { ORANGE: 2 };
        let seen: unknown;
        const spy: DiscountRule = {
          name: 'spy',
          discount: (context) => {
            seen = context.order;
            return 0;
          },
        };

        new Calculator([spy]).calculate(input);

        expect(seen).toEqual({ ORANGE: 2 });
        expect(seen).not.toBe(input);
      });
    });

    it('rejects an item that is not on the menu', () => {
      expect(() => calculateUnchecked({ BLACK: 1 })).toThrow('Unknown menu item: BLACK');
    });

    it('rejects a lowercase item name', () => {
      expect(() => calculateUnchecked({ red: 1 })).toThrow(InvalidOrderError);
    });

    it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '2', null])(
      'rejects quantity %o',
      (quantity) => {
        expect(() => calculateUnchecked({ ORANGE: quantity })).toThrow(InvalidOrderError);
      },
    );

    it('accepts a quantity of 0', () => {
      expect(calculator.calculate({ ORANGE: 0, RED: 1 })).toBe(50);
    });

    it.each(['yes', 1, null])('rejects member flag %o', (flag) => {
      expect(() => calculateUnchecked({ RED: 1 }, flag)).toThrow(InvalidOrderError);
    });
  });
});
