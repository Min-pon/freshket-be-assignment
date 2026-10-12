import type { MenuItem } from './types.js';

/**
 * Price list in THB per set. Single source of truth for what the store sells:
 * adding an item here makes it orderable everywhere. Frozen, since `as const`
 * only protects it at compile time.
 */
export const MENU = Object.freeze({
  RED: 50,
  GREEN: 40,
  BLUE: 30,
  YELLOW: 50,
  PINK: 80,
  PURPLE: 90,
  ORANGE: 120,
} as const satisfies Record<string, number>);

export const MENU_ITEMS: readonly MenuItem[] = Object.freeze(Object.keys(MENU) as MenuItem[]);

export function isMenuItem(value: string): value is MenuItem {
  return Object.hasOwn(MENU, value);
}
