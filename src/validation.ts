import { InvalidOrderError } from './errors.js';
import { isMenuItem } from './menu.js';
import type { Order } from './types.js';

/**
 * Checks input at runtime, since callers from plain JavaScript or JSON
 * bypass the TypeScript types.
 */
export function assertValidOrder(order: unknown): asserts order is Order {
  if (typeof order !== 'object' || order === null || Array.isArray(order)) {
    throw new InvalidOrderError('Order must be an object of item quantities, e.g. { RED: 1 }');
  }

  for (const [item, quantity] of Object.entries(order)) {
    if (!isMenuItem(item)) {
      throw new InvalidOrderError(`Unknown menu item: ${item}`);
    }
    if (!Number.isSafeInteger(quantity) || (quantity as number) < 0) {
      throw new InvalidOrderError(
        `Quantity of ${item} must be a whole number of 0 or more, got ${String(quantity)}`,
      );
    }
  }
}

export function assertValidMemberFlag(hasMemberCard: unknown): asserts hasMemberCard is boolean {
  if (typeof hasMemberCard !== 'boolean') {
    throw new InvalidOrderError(`hasMemberCard must be true or false, got ${String(hasMemberCard)}`);
  }
}
