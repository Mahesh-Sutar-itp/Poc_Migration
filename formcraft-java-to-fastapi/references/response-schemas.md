# The schema layer (NET-NEW, ~22 files)

## Why this is the highest risk in the migration

There is no DTO layer in the source. Controllers return Hibernate entities
directly, and the response shape emerges at serialization time from
`Hibernate6Module` with `FORCE_LAZY_LOADING` plus whatever `@JsonIgnore` /
`@JsonIgnoreProperties` annotations happen to be on the entity graph.

So there is nothing to translate. Every response shape has to be
**reconstructed from scratch**, and a wrong reconstruction produces a service
that starts, responds 200, and returns subtly wrong JSON.

## Source of truth

**Drive every response schema from the frontend's `src/types.ts`**, not from
the entity classes. The frontend is out of transformation scope but it pins the
HTTP contract. For each interface in `types.ts`, produce the matching Pydantic
v2 model with the same field names, the same optionality, and the same nesting
depth.

Where an entity exposes a relation that `types.ts` does not mention, the field
is excluded — `FORCE_LAZY_LOADING` inflates the graph in Java, so entity
inspection over-reports. Where `types.ts` shows a field the entity does not
have, it is computed in the controller or service; find it there.

## Rules

- Request-side models map cleanly from the nested Java records. Validation
  annotations (`@NotBlank`, `@Positive`, `@Size`) become `Field` constraints.
- Cycle-breaking that Jackson did with `@JsonIgnore` becomes explicit field
  selection. Product's self-reference is the main one — decide the depth
  `types.ts` implies and stop there.
- `Page<T>` -> a hand-rolled generic `Page[T]`. The envelope key names are part
  of the contract; copy them from a live response, not from Spring's docs.
- Errors: RFC 7807 bodies. The frontend reads `problem.detail` — keep that key
  spelled exactly that way.
- Report every response shape you had to guess. A listed guess is cheap; an
  unlisted one is the failure this whole POC exists to detect.

## Acceptance test

Point the unmodified React frontend at the Python service against the same
seeded Postgres. Every page that renders correctly is a response schema
reconstructed correctly. This is the cheapest available test of the hardest
problem in the migration.
