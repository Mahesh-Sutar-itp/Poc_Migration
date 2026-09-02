# The formulation chain

Most of the codebase is ordinary CRUD that ports cleanly. This is the part that
does not: a four-stage Chain of Responsibility over a self-referential bill of
materials, ending in an expression evaluated at runtime.

## Shape

```
Product + BOM (self-referential)
NutrientValues (per 100 g)
        |
        v
  Nutritional  ->  Cost  ->  Compliance  ->  Score  ->  FormulationResult
  12 nutrients    per kg     allergens       NutriScore   OK / WARNING / ERROR
  sum(nutrient    sum(cost   8 allergens     grade A-E,
   x fraction)     x frac)   total = 100%    then evaluate
                                                |
                                          SPEL expression
                                          (no Python equivalent)
```

On error the chain aborts and the result status is `ERROR`.

## Rules

1. **Each stage mutates one shared context object** rather than returning a
   value. Ordering is load-bearing and any stage can veto the rest of the chain.
   Port the context object as a mutable dataclass passed by reference. Do not
   "improve" this into a pipeline of pure functions.

2. **CRITICAL — the SPEL stage.** Products carry a per-product expression string
   evaluated at runtime with Spring's expression language. Python has no
   equivalent. Use `simpleeval` with an explicit allowlist of names and
   operators. **Never** `eval()` or `exec()`.

   In Java, a failing expression is swallowed into a warning, so a broken port
   is silent. Therefore: keep the swallow (behaviour parity) **but** log at
   ERROR with the expression text and the product code, and add an explicit
   pytest case asserting that a known-good seeded expression returns the
   expected value. The Java side lacks this test; write it anyway.

3. **The "fast" chain defect.** The fast path is supposed to run only the first
   two stages, but each handler also holds a pointer to the next and calls it
   directly, so the truncation never takes effect. **Port as-is.** Replicate the
   double-drive and mark the call site `# PORTED-AS-IS: fast chain truncation
   never takes effect in the source`. Do not fix it silently and do not
   "clarify" it into the intended behaviour.

4. Batch formulation runs under `@Async`; port to `BackgroundTasks` with its own
   DB session.

## Acceptance test

Run the seeded Chocolate Brownie through both services and diff: nutrient
values, total cost, NutriScore grade, and the SPEL formula result must match to
the same decimal places.
