/** Thrown when the order or options passed to the calculator are not valid. */
export class InvalidOrderError extends Error {
  override readonly name = 'InvalidOrderError';
}
