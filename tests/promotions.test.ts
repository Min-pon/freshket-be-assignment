import { describe, expect, it } from 'vitest';
import { STORE_DISCOUNT_RULES } from '../src/promotions.js';
import type { DiscountRule } from '../src/types.js';

describe('STORE_DISCOUNT_RULES', () => {
  it('applies the pair discount before the member discount', () => {
    expect(STORE_DISCOUNT_RULES.map((rule) => rule.name)).toEqual([
      'Pair discount 5% (ORANGE, PINK, GREEN)',
      'Member discount 10%',
    ]);
  });

  it('cannot have rules added, removed or reordered at runtime', () => {
    const rules = STORE_DISCOUNT_RULES as DiscountRule[];
    expect(Object.isFrozen(STORE_DISCOUNT_RULES)).toBe(true);
    expect(() => rules.push({ name: 'free', discount: () => 0 })).toThrow(TypeError);
  });
});
