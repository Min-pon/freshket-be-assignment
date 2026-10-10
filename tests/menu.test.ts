import { describe, expect, it } from 'vitest';
import { MENU, MENU_ITEMS, isMenuItem } from '../src/menu.js';

describe('MENU', () => {
  it('has the 7 sets with prices from the brief', () => {
    expect(MENU).toEqual({
      RED: 50,
      GREEN: 40,
      BLUE: 30,
      YELLOW: 50,
      PINK: 80,
      PURPLE: 90,
      ORANGE: 120,
    });
  });

  it('lists every item in MENU_ITEMS', () => {
    expect(MENU_ITEMS).toHaveLength(7);
    expect(MENU_ITEMS).toEqual(Object.keys(MENU));
  });
});

describe('isMenuItem', () => {
  it.each(MENU_ITEMS)('accepts %s', (item) => {
    expect(isMenuItem(item)).toBe(true);
  });

  it.each(['BLACK', 'red', '', 'toString', '__proto__'])('rejects %j', (value) => {
    expect(isMenuItem(value)).toBe(false);
  });
});
