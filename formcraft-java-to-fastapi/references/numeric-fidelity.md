# Numeric fidelity

## The rule

The source mixes types **deliberately**:

- money -> `BigDecimal` -> map to `decimal.Decimal`
- formulation maths -> `double` -> map to `float`

**CRITICAL: do not unify these.** Making everything `Decimal` (or everything
`float`) changes results. It is the kind of change that looks like a cleanup
and shows up as a one-cent or one-decimal drift in cost and NutriScore output.

## Rounding

Rounding happens at specific sites, not uniformly at the end. For each
`BigDecimal.setScale(...)` / `round(...)` call in the Java source:

- reproduce it at the same point in the same expression;
- match the scale and the rounding mode (`HALF_UP` in Java is **not**
  Python's default banker's rounding — use
  `Decimal.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)`);
- do not add rounding where Java has none, and do not move it earlier or later
  in an expression.

Python's built-in `round()` on floats uses banker's rounding. Do not use it as
a substitute for a Java `HALF_UP` rounding site.

## Verification

Diff computed values against the seeded data. Nutrient values, total cost and
NutriScore grade for the seeded product must match to the same decimal places
as the Java service, not merely be close.
