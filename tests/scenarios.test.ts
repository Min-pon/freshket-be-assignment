import { describe, expect, it } from 'vitest';
import { Calculator } from '../src/calculator.js';
import { InvalidOrderError } from '../src/errors.js';
import { STORE_DISCOUNT_RULES } from '../src/promotions.js';
import type { Order } from '../src/types.js';

/** End-to-end scenarios with the store's real menu and promotions. */
const calculator = new Calculator();

interface Scenario {
  readonly name: string;
  readonly order: Order;
  readonly hasMemberCard: boolean;
  readonly expected: number;
}

const scenarios: readonly Scenario[] = [
  { name: '#1 Red + Green (example from the brief)', order: { RED: 1, GREEN: 1 }, hasMemberCard: false, expected: 90 },
  { name: '#2 Red + Green with member card: 90 × 0.9', order: { RED: 1, GREEN: 1 }, hasMemberCard: true, expected: 81 },
  { name: '#3 5 Orange: 600 − 2 pairs × 240 × 5%', order: { ORANGE: 5 }, hasMemberCard: false, expected: 576 },
  { name: '#4 5 Orange with member card: 576 × 0.9', order: { ORANGE: 5 }, hasMemberCard: true, expected: 518.4 },
  { name: '#4b 3 Orange with member card: (360 − 12) × 0.9', order: { ORANGE: 3 }, hasMemberCard: true, expected: 313.2 },
  { name: '#5 single Green: no pair', order: { GREEN: 1 }, hasMemberCard: false, expected: 40 },
  { name: '#6 2 Pink + 3 Green: (160 − 8) + (120 − 4)', order: { PINK: 2, GREEN: 3 }, hasMemberCard: false, expected: 268 },
  { name: '#6b 2 Pink + 3 Green with member card: 268 × 0.9', order: { PINK: 2, GREEN: 3 }, hasMemberCard: true, expected: 241.2 },
  { name: '#7 Orange + Pink: different items do not pair', order: { ORANGE: 1, PINK: 1 }, hasMemberCard: false, expected: 200 },
  { name: '#8 2 Red: Red has no pair discount', order: { RED: 2 }, hasMemberCard: false, expected: 100 },
  { name: '#9 empty order', order: {}, hasMemberCard: true, expected: 0 },
  {
    name: 'one of every set with member card: (460 − 0) × 0.9',
    order: { RED: 1, GREEN: 1, BLUE: 1, YELLOW: 1, PINK: 1, PURPLE: 1, ORANGE: 1 },
    hasMemberCard: true,
    expected: 414,
  },
  {
    name: 'two of every set with member card: (920 − 12 − 8 − 4) × 0.9',
    order: { RED: 2, GREEN: 2, BLUE: 2, YELLOW: 2, PINK: 2, PURPLE: 2, ORANGE: 2 },
    hasMemberCard: true,
    expected: 806.4,
  },
];

describe('Calculator scenarios', () => {
  for (const { name, order, hasMemberCard, expected } of scenarios) {
    it(`${name} → ${expected} THB`, () => {
      expect(calculator.calculate(order, { hasMemberCard })).toBe(expected);
    });
  }

  const invalidOrders = [
    { name: '#10a negative quantity', order: { ORANGE: -1 } },
    { name: '#10b fractional quantity', order: { ORANGE: 1.5 } },
    { name: '#10c item not on the menu', order: { BLACK: 1 } },
  ];

  for (const { name, order } of invalidOrders) {
    it(`${name} → throws InvalidOrderError`, () => {
      expect(() => calculator.calculate(order as Order)).toThrow(InvalidOrderError);
    });
  }
});

describe('the other reading of "10% on Total" (README, assumption 1)', () => {
  it('both discounts from the subtotal: swapping the two store rules gives 600 − 24 − 60 = 516', () => {
    const memberFirst = new Calculator([...STORE_DISCOUNT_RULES].reverse());
    expect(memberFirst.calculate({ ORANGE: 5 }, { hasMemberCard: true })).toBe(516);
  });
});
