# Food Store Calculator

A TypeScript `Calculator` class that prices an order from a food store with 7 set menus, applying a pair discount and a member card discount.

## Contents

- [Quick start](#quick-start)
- [Usage](#usage)
- [Pricing rules](#pricing-rules)
- [Assumptions](#assumptions)
- [Design](#design)
- [Extending](#extending)
- [Tests](#tests)
- [Project structure](#project-structure)

## Quick start

Requires Node.js 20.19 or later (Node.js 24 LTS recommended).

```bash
npm install
npm test            # run all unit tests
npm run coverage    # tests with a coverage report
npm run typecheck   # TypeScript strict type check
npm run build       # compile src/ to dist/
```

## Usage

```ts
import { Calculator, InvalidOrderError } from './src/index.js';

const calculator = new Calculator();

calculator.calculate({ RED: 1, GREEN: 1 });                    // 90
calculator.calculate({ RED: 1, GREEN: 1 }, { hasMemberCard: true }); // 81
calculator.calculate({ ORANGE: 5 });                           // 576
calculator.calculate({ ORANGE: 5 }, { hasMemberCard: true });  // 518.4
```

- **Input:** an object of quantities per menu item. Items not ordered can be left out.
- **Output:** the price to pay in THB, as a `number`.
- **Errors:** an unknown item, a quantity that is not a whole number of 0 or more, or a member flag that is not a boolean throws `InvalidOrderError`.

```ts
try {
  calculator.calculate({ BLACK: 1 });
} catch (error) {
  if (error instanceof InvalidOrderError) {
    console.log(error.message); // "Unknown menu item: BLACK"
  }
}
```

### Price breakdown

`calculateBreakdown` takes the same arguments and returns how the price was reached, like a receipt. `calculate` returns its `total`.

```ts
calculator.calculateBreakdown({ ORANGE: 5 }, { hasMemberCard: true });
// {
//   lines: [{ item: 'ORANGE', quantity: 5, unitPrice: 120, amount: 600 }],
//   subtotal: 600,
//   discounts: [
//     { name: 'Pair discount 5% (ORANGE, PINK, GREEN)', amount: 24 },
//     { name: 'Member discount 10%', amount: 57.6 },
//   ],
//   total: 518.4,
// }
```

- `lines` follow menu order and leave out sets with a quantity of 0.
- `discounts` are in the order they were applied, and leave out rules that took nothing off.
- All amounts are in THB.

## Pricing rules

| Set    | THB / set | Pair discount |
| ------ | --------: | :-----------: |
| Red    |        50 |               |
| Green  |        40 |      5%       |
| Blue   |        30 |               |
| Yellow |        50 |               |
| Pink   |        80 |      5%       |
| Purple |        90 |               |
| Orange |       120 |      5%       |

1. **Pair discount:** every complete pair of the same Orange, Pink or Green set gets 5% off that pair. Leftover single sets pay full price, so 5 Orange sets get the discount on 4 of them (2 pairs).
2. **Member discount:** customers with a member card get 10% off the total.

## Assumptions

The brief leaves some points open. These are the choices this implementation makes:

1. **Discount order.** Pair discounts are applied first, then the member discount takes 10% off what is left. "10% on Total" is read as the total after per-item discounts.
2. **Pairs are of the same set.** One Orange and one Pink do not make a pair; the brief's example only talks about Orange with Orange.
3. **Number of pairs** per set is `floor(quantity / 2)`.
4. **Input is quantities per set** (`{ ORANGE: 5 }`) rather than a list of names. It is easier to validate and cannot contain typos that pass silently.
5. **A quantity of 0 is allowed** and means the set was not ordered.
6. **An empty order costs 0.**
7. **Rounding.** Each discount is rounded to the nearest satang, with half rounding up (in the customer's favour). With the current prices no discount has a fraction of a satang, so this only matters if prices or percentages change.

## Design

### Calculation flow

```
validate order → subtotal (satang) → pair discount 5% → member discount 10% → THB
```

`Calculator` does not know about any specific promotion. It runs a list of `DiscountRule`s in order, passing each rule the total left after the rules before it:

```ts
interface DiscountRule {
  readonly name: string;
  discount(context: PricingContext, currentTotal: Satang): Satang;
}
```

The store's current promotions are defined in one place, `src/promotions.ts`, and used by default:

```ts
export const STORE_DISCOUNT_RULES: readonly DiscountRule[] = [
  new PairDiscountRule({ items: ['ORANGE', 'PINK', 'GREEN'], percent: 5 }),
  new MemberDiscountRule({ percent: 10 }),
];
```

### Money in satang

All calculation is done in whole satang (1 THB = 100 satang) and converted to THB only when the result is returned. JavaScript numbers are binary floating point, so decimal amounts drift. A case from this store shows the problem: 2 Pink + 3 Green comes to 268 THB after pair discounts, and with a member card

```js
268 * 0.9   // 241.20000000000002, not 241.2
```

In satang every amount is an integer. Integer addition and subtraction are exact, and each percentage is rounded once, at a known point:

```js
26800 - Math.round(26800 * 10 / 100)   // 24120 → 241.2 THB
```

This is the same approach payment systems use: store money in the currency's smallest unit. A decimal library such as `decimal.js` would also work, but this problem only needs addition, subtraction and percentages, so integers are enough and add no dependency.

### Validation

The types already describe a valid order, but callers using plain JavaScript or parsed JSON bypass them, so `Calculator` also checks its input at runtime:

- the order is an object (not `null` or an array);
- every key is a menu item (`Object.hasOwn`, so keys such as `toString` are rejected);
- every quantity passes `Number.isSafeInteger` and is 0 or more. This rejects fractions, `NaN`, `Infinity` and strings such as `'2'`;
- `hasMemberCard` is a boolean.

The calculator also guards against faulty rules: a rule that returns a negative or fractional discount throws an `Error`, since that is a bug in the rule rather than bad input. A discount larger than the remaining total is capped, so the price never goes below 0.

### TypeScript settings

`strict` is on, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns` and `noUnusedLocals`/`noUnusedParameters`. `MenuItem` is derived from the `MENU` object (`keyof typeof MENU`), so the price list is the only place a menu item is defined.

## Extending

**Add or change a menu item.** Edit `MENU` in `src/menu.ts`. The `MenuItem` type, validation and subtotal follow automatically.

**Change a promotion.** Edit `src/promotions.ts`, for example to add Purple to the pair discount or raise the member discount to 15%.

**Use different promotions** without touching `Calculator`, by passing rules to the constructor:

```ts
const calculator = new Calculator([
  new PairDiscountRule({ items: ['ORANGE'], percent: 5 }),
  new MemberDiscountRule({ percent: 20 }),
]);

calculator.calculate({ ORANGE: 5 }, { hasMemberCard: true }); // 460.8
```

**Add a new kind of promotion** by implementing `DiscountRule`. For example, a fixed amount off orders over a threshold:

```ts
import { toSatang } from './src/money.js';
import type { DiscountRule, PricingContext, Satang } from './src/index.js';

class SpendOverRule implements DiscountRule {
  readonly name = 'Spend over 500 THB, get 50 THB off';

  discount(_context: PricingContext, currentTotal: Satang): Satang {
    return currentTotal >= toSatang(500) ? toSatang(50) : 0;
  }
}
```

## Tests

96 unit tests with [Vitest](https://vitest.dev), 100% statement, branch, function and line coverage.

| File | What it covers |
| --- | --- |
| `tests/scenarios.test.ts` | End-to-end pricing with the real menu and promotions: every example from the brief, plus edge cases |
| `tests/calculator.test.ts` | `Calculator` behaviour: rule order, custom rules, the zero floor, faulty rules, input validation |
| `tests/breakdown.test.ts` | `calculateBreakdown`: lines, applied discounts, totals that add up and match `calculate` |
| `tests/rules/*.test.ts` | Each discount rule on its own |
| `tests/money.test.ts` | Satang/THB conversion, percentage rounding |
| `tests/menu.test.ts` | Menu prices and `isMenuItem` |

Scenarios checked end to end:

| # | Order | Member | Expected (THB) | Why |
| - | ----- | :----: | -------------: | --- |
| 1 | Red, Green | no | 90 | Example from the brief |
| 2 | Red, Green | yes | 81 | 90 × 0.9 |
| 3 | 5 Orange | no | 576 | 600 − 2 pairs × 240 × 5% |
| 4 | 5 Orange | yes | 518.4 | 576 × 0.9 |
| 5 | 1 Green | no | 40 | No pair |
| 6 | 2 Pink, 3 Green | no | 268 | (160 − 8) + (120 − 4) |
| 6b | 2 Pink, 3 Green | yes | 241.2 | 268 × 0.9, the floating point case |
| 7 | Orange, Pink | no | 200 | Different sets do not pair |
| 8 | 2 Red | no | 100 | Red has no pair discount |
| 9 | (empty) | yes | 0 | Empty order |
| 10 | −1 Orange / 1.5 Orange / Black | – | throws | Invalid input |
| 11 | 1 of every set | yes | 414 | 460 × 0.9 |
| 12 | 2 of every set | yes | 806.4 | (920 − 12 − 8 − 4) × 0.9 |

## Project structure

```
src/
  calculator.ts              Calculator class: calculate and calculateBreakdown
  promotions.ts              The store's current discount rules, in order
  rules/
    pair-discount.rule.ts    Percent off each complete pair of eligible sets
    member-discount.rule.ts  Percent off the total for member card holders
  menu.ts                    Price list and isMenuItem
  money.ts                   Satang/THB conversion and percentages
  validation.ts              Runtime checks for the order and member flag
  errors.ts                  InvalidOrderError
  types.ts                   MenuItem, Order, Satang, DiscountRule, PriceBreakdown, ...
  index.ts                   Public exports
tests/                       Vitest unit tests (see above)
```
