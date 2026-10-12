/**
 * Prints the price breakdown of a few sample orders.
 * Run with `npm run demo`.
 */
import { Calculator, type Order, type PriceBreakdown } from '../src/index.js';

const calculator = new Calculator();

const samples: ReadonlyArray<{ title: string; order: Order; hasMemberCard: boolean }> = [
  { title: 'Red + Green (example from the brief)', order: { RED: 1, GREEN: 1 }, hasMemberCard: false },
  { title: 'Red + Green with a member card', order: { RED: 1, GREEN: 1 }, hasMemberCard: true },
  { title: '5 Orange with a member card', order: { ORANGE: 5 }, hasMemberCard: true },
  { title: '2 Pink + 3 Green with a member card', order: { PINK: 2, GREEN: 3 }, hasMemberCard: true },
];

const baht = (amount: number): string => amount.toFixed(2).padStart(10);

function printReceipt({ lines, subtotal, discounts, total }: PriceBreakdown): void {
  for (const line of lines) {
    console.log(`  ${`${line.item} × ${line.quantity}`.padEnd(40)}${baht(line.amount)}`);
  }
  console.log(`  ${'Subtotal'.padEnd(40)}${baht(subtotal)}`);
  for (const discount of discounts) {
    console.log(`  ${discount.name.padEnd(40)}${baht(-discount.amount)}`);
  }
  console.log(`  ${'Total (THB)'.padEnd(40)}${baht(total)}`);
}

for (const { title, order, hasMemberCard } of samples) {
  console.log(`\n${title}`);
  printReceipt(calculator.calculateBreakdown(order, { hasMemberCard }));
}
