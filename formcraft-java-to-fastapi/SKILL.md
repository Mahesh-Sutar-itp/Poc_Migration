---
name: formcraft-java-to-fastapi
description: Migrates the FormCraft PLM Java 21 / Spring Boot 3.2.5 backend to Python 3.12 / FastAPI, preserving the HTTP JSON contract consumed by the React frontend and the existing PostgreSQL 15 schema. Use for Spring Boot to FastAPI language-to-language ports where the database and frontend are frozen.
---

# FormCraft PLM: Spring Boot to FastAPI

Port the Java backend of FormCraft PLM to Python 3.12 / FastAPI. The React 19
frontend and the PostgreSQL 15 schema are **out of scope and must not change**.
They are the two frozen contracts this transformation is validated against.

## CRITICAL constraints

- **CRITICAL:** Do not modify the database schema. No Alembic migration may alter
  an existing table. Alembic exists only to reproduce the current schema
  (`db/migration/V1`, `V2`) for a fresh environment.
- **CRITICAL:** Do not modify anything under the frontend directory. Read
  `src/types.ts` only — it is the reference for every response schema.
- **CRITICAL:** Every route must keep its existing path, method, status codes,
  and JSON body keys, including the `/api` prefix and the pagination envelope.
- **CRITICAL:** Never use `eval()` or `exec()` for the product formula strings.
  Use `simpleeval` in a sandbox. See `references/formulation-chain.md`.
- **IMPORTANT:** Services are synchronous and use blocking DB drivers. Define
  routes with `def`, not `async def`, so FastAPI runs them in the threadpool.
  Only genuinely awaitable code may use `async def`.

## Target layout

Mirror the source tree one-to-one. Emit exactly this structure:

```
app/
  main.py                  <- FormCraftApplication.java
  core/config.py           <- application.yml
  core/constants.py        <- RepoConsts.java
  core/exceptions.py       <- common/exception/ (3 classes)
  core/database.py         <- datasource + session factory
  core/security.py         <- JwtService + bcrypt
  models/                  <- model/entity/          (20 files)
  enums/                   <- model/enums/           (15 files)
  schemas/                 <- NET-NEW                (~22 files)
  repositories/            <- repo/jpa/              (20 files)
  services/                <- repo/* (everything except repo/jpa)
  api/deps.py              <- NET-NEW: RBAC guards
  api/errors.py            <- GlobalExceptionHandler
  api/routers/             <- web/controller/        (16 files)
alembic/versions/          <- db/migration/ V1, V2
tests/                     <- test/java/             (8 suites)
```

**IMPORTANT — package name trap:** the Java package `repo` is the *service*
layer, not persistence. Map by role, not by name:

- `repo/jpa/**` → `app/repositories/`
- `repo/*` (all other subpackages: `formulation`, `formula`, `search`, `audit`,
  `batch`, and the 12 `XService`/`XServiceImpl` modules) → `app/services/`

## Execution order

Do the phases in this order and validate after each. Do not begin a phase until
the previous one builds.

1. **Scaffold** — `pyproject.toml` (uv), `Dockerfile` (`python:3.12-slim`,
   single stage), `docker-compose.yml` (reuse the existing Postgres service
   unchanged), `alembic.ini`, `app/core/*`.
2. **Enums** — 15 files, verbatim. Port `canTransitionTo()` on the 3 state
   machines as methods on the Enum. Values must match the strings stored in
   Postgres exactly.
3. **Models** — 20 SQLAlchemy 2.0 mapped classes against the *existing* tables.
   Include `version_id_col` on Product, `JSONB` for FormulationResult values,
   and the Product self-reference. Read `references/domain-model.md`.
4. **Repositories** — 20 modules. Derived JPA query method names become explicit
   `select()` statements; the 12 hand-written JPQL queries with `LEFT JOIN FETCH`
   become `selectinload()` / `joinedload()`. `ProductQueryBuilder` (Criteria API
   + Specification) becomes a list of filter clauses; it ports close to 1:1.
5. **Schemas** — ~22 Pydantic v2 models. This layer has no Java counterpart.
   Read `references/response-schemas.md` before writing any of it.
6. **Security** — `core/security.py` and `api/deps.py`. Read
   `references/security-rules.md`. Port effective behaviour, not the declaration.
7. **Services** — collapse each `XService` interface + `XServiceImpl` pair into
   one module. Keep a `Protocol` only for the formulation handler chain. Read
   `references/formulation-chain.md` before touching `services/formulation/`.
8. **Routers** — 16 `APIRouter`s with `prefix="/api"`, plus `api/errors.py`
   emitting RFC 7807 bodies (the frontend reads `problem.detail` — keep the key).
9. **Tests** — translate the 8 JUnit 5 + Mockito suites to pytest +
   `unittest.mock`. These are the acceptance harness, not an afterthought.

## Rules that decide correctness

- **Numeric fidelity.** The source mixes `BigDecimal` (money) with `double`
  (formulation maths) deliberately. Map `BigDecimal` → `decimal.Decimal` and
  `double` → `float`. Do **not** unify them. Reproduce every rounding call at
  the same point in the same expression. See `references/numeric-fidelity.md`.
- **Lombok.** Getters and setters exist only after annotation processing. Never
  conclude an accessor is missing from reading source. Run the build command to
  work against compiled reality.
- **Transactions.** `@Transactional(REQUIRES_NEW)` on async audit writes must get
  its own session, not the request session. Review each `readOnly` annotation
  individually — some read-only methods mutate through cascade.
- **`@Async` + `CompletableFuture`** → `BackgroundTasks` for audit writes and
  batch formulation.
- **Drop, do not port:** `@EnableMethodSecurity` (enabled, never used),
  `@EnableScheduling` (declared, no `@Scheduled` method exists), the Principal
  wrapper, Spring Actuator (emit a plain `/health` route only).
- **Do not read the repo README.** It describes Basic Auth and 6 controllers.
  The application uses JWT and has 16. It is stale.

## Known defect in the source

The "fast" formulation chain is supposed to run only the first two stages, but
each handler also holds a pointer to the next and calls it directly, so the
truncation never takes effect. **Port this behaviour as-is** — replicate the
double-drive — and leave a `# PORTED-AS-IS:` comment at the call site naming
the defect. Do not silently fix it.

## Validation

Build command: `uv run pytest`

After the full port, report:

1. Which of the 8 translated suites pass.
2. Any route whose response body keys differ from `src/types.ts`.
3. Every place you had to guess a response shape.
4. Every `# PORTED-AS-IS:` marker you left.

Do not claim success on the basis of the service starting. A FastAPI app that
boots and returns wrong JSON is the specific failure mode this transformation
is guarding against.
