import { InvalidOrderError } from './errors.js';
import { isMenuItem } from './menu.js';
import type { Order } from './types.js';

/**
 * Checks an order at runtime, since callers from plain JavaScript or JSON
 * bypass the TypeScript types, and returns a clean copy of it.
 *
 * Only the order's own keys are read. Pricing uses the returned copy, so a
 * quantity inherited through the prototype can never skip the checks.
 */
export function parseOrder(input: unknown): Order {
  if (!isPlainObject(input)) {
    throw new InvalidOrderError('Order must be a plain object of item quantities, e.g. { RED: 1 }');
  }

  const order: Order = {};
  for (const [item, quantity] of Object.entries(input)) {
    if (!isMenuItem(item)) {
      throw new InvalidOrderError(`Unknown menu item: ${item}`);
    }
    if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 0) {
      throw new InvalidOrderError(
        `Quantity of ${item} must be a whole number of 0 or more, got ${String(quantity)}`,
      );
    }
    order[item] = quantity;
  }
  return order;
}

/**
 * Checks the calculate options. Left out or `null` means no member card.
 * Unknown keys are rejected, so a typo such as `hasMembercard` cannot
 * silently drop the member discount.
 */
export function parseOptions(input: unknown): { hasMemberCard: boolean } {
  if (input === undefined || input === null) {
    return { hasMemberCard: false };
  }
  if (!isPlainObject(input)) {
    throw new InvalidOrderError('Options must be an object, e.g. { hasMemberCard: true }');
  }

  for (const key of Object.keys(input)) {
    if (key !== 'hasMemberCard') {
      throw new InvalidOrderError(`Unknown option: ${key}`);
    }
  }

  const { hasMemberCard = false } = input;
  if (typeof hasMemberCard !== 'boolean') {
    throw new InvalidOrderError(`hasMemberCard must be true or false, got ${String(hasMemberCard)}`);
  }
  return { hasMemberCard };
}

/** An object literal or `Object.create(null)`; not an array, Map, class instance or object with a custom prototype. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
