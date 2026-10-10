import { describe, expect, it } from 'vitest';
import { MemberDiscountRule } from '../../src/rules/member-discount.rule.js';

const rule = new MemberDiscountRule({ percent: 10 });

describe('MemberDiscountRule', () => {
  it('takes 10% off the running total for members', () => {
    expect(rule.discount({ order: {}, hasMemberCard: true }, 9000)).toBe(900);
  });

  it('applies to the total after earlier discounts (5 Orange -> 576 THB)', () => {
    expect(rule.discount({ order: { ORANGE: 5 }, hasMemberCard: true }, 57600)).toBe(5760);
  });

  it('gives no discount without a member card', () => {
    expect(rule.discount({ order: {}, hasMemberCard: false }, 9000)).toBe(0);
  });

  it('gives no discount on a zero total', () => {
    expect(rule.discount({ order: {}, hasMemberCard: true }, 0)).toBe(0);
  });

  it('rounds to whole satang', () => {
    expect(rule.discount({ order: {}, hasMemberCard: true }, 1005)).toBe(101); // 100.5
  });

  it('rejects a percent outside 0-100', () => {
    expect(() => new MemberDiscountRule({ percent: -5 })).toThrow(RangeError);
  });

  it('describes itself', () => {
    expect(rule.name).toBe('Member discount 10%');
  });
});
