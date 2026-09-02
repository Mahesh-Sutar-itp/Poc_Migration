# Domain model

Twenty tables in five clusters. `Product` is the hub and it is
**self-referential**: finished goods, semi-finished, raw materials and
packaging all live in the same table, so a Product can appear inside another
Product's recipe. Recipes nest, and formulation has to walk that graph.

## Clusters

**Formulation** — `CompositionLine` (the BOM line: quantity, position),
`NutrientValue` (per 100 g, one row per nutrient type), `FormulationResult`
(JSONB values, NutriScore, cost).

**Sourcing and inventory** — `Supplier` (code, contact, rating) 1:N
`SupplierProduct` (M:N join carrying price, lead time, MOQ);
`StockLot` (lot no, qty on hand, expiry) 1:N `StockMovement`
(RECEIVE / CONSUME / ADJUST).

**Quality** — `Specification` (min / max / target, 5 spec types),
`QualityCheck` (composition, allergen, cost) 0..1 `NonConformance`
(severity; OPEN -> IN_PROGRESS -> CLOSED) 1:N `CorrectiveAction`
(CAPA, owner, due date). A NonConformance cannot be closed until all its
CorrectiveActions are done.

**Change and delivery** — `ChangeRequest` (ECR/ECO, 6 states, decision log),
`Project` (stage-gate NPD, M:N with Product) 1:N `ProjectMilestone`
(gates 1-4), `WorkflowTask` (assignee, due date, 4 states).

**Platform — attaches without a foreign key** — `User` (5 roles, bcrypt hash),
`Notification` (`recipient_username`, read flag), `AuditLog`
(`entity_type` + `entity_id`), `Document` (`entity_type` + `entity_id`, BYTEA).

## IMPORTANT for the port

- `AuditLog` and `Document` reference any entity by type + id with **no foreign
  key**. Do not invent a relationship or a polymorphic association in
  SQLAlchemy. Store the two columns as they are and resolve in the service.
- `Notification` links to `User` by `recipient_username`, not by id.
- Product's self-reference must be mapped with an explicit `remote_side` so
  recursive BOM traversal works.
- Product has 4 types (finished, semi, raw, packaging) and 4 states.
