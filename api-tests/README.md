# FormCraft PLM — migration coverage test suite

Playwright API tests that exercise the same 98 endpoints on both the Java/Spring Boot backend
(`formcraft-plm/formcraft-plm/`) and the migrated Python/FastAPI backend (repo root `app/`), to
measure how much of the migration actually works.

`tests/known-divergences.spec.ts` is a separate, deliberately-not-fixed-to-pass file: each test
there asserts Java's actual, verified behavior and is expected to keep failing against Python until
the underlying app bug is fixed. Don't edit these to pass — if one starts passing, the bug's been
fixed; delete or update the test to reflect that instead.

## One-time setup

```
cd api-tests
npm install
npx playwright install --with-deps chromium # not required for API-only tests, but harmless if run
```

(No browsers are actually needed — everything uses Playwright's `request` API context.)

## Running

The two backends can't run at the same time: both `docker-compose.yml` files bind Postgres to
host port 5432. Run one full pass, tear it down, then the other.

### Java pass (reference/oracle)

```
cd formcraft-plm/formcraft-plm
docker compose up -d --build postgres formcraft-app   # omit formcraft-frontend
# wait for http://localhost:8080/api/actuator/health to return 200
cd ../../api-tests
BACKEND=java npm test
cd ../formcraft-plm/formcraft-plm
docker compose down -v
```

### Python pass

```
cd <repo root>
docker compose up -d --build db app   # omit frontend
# seed the schema — see note below, alembic upgrade head does not work as-is
cd api-tests
BACKEND=python npm test
cd ..
docker compose down -v
```

### Report

```
cd api-tests
npm run compare   # results/migration-coverage-report.md
npm run parity    # results/parity-report.md
```

## Known bugs found in the migrated (Python) app

Nine confirmed, real divergences from Java's behavior — verified by running the exact same request
against both live backends, not assumed from reading code. Tracked as failing tests in
`tests/known-divergences.spec.ts` (see that file for full detail on each):

1. `POST /api/products/{id}/change-requests` requires a redundant `productId` in the body even
   though it's already in the URL — reported by a user hitting this live (422 on a normal request).
2. `POST /api/change-requests/{id}/decide` rejects Java's `{approve, comment}` body shape (Python
   requires `{status, decisionComment}` instead).
3. `QUALITY_MANAGER` cannot run formulation (`POST /products/{id}/formulate`) — allowed on Java.
4. `PURCHASING` cannot run quality checks (`POST /products/{id}/quality/run-all`) — allowed on Java.
5. The formulate response shape is entirely different (`{product, latestResult}` nested vs Java's
   flat `{result, chainId, productName, productId}`).
6. A request with no Authorization header gets 401 on Python, 403 on Java.
7. The product-list pagination envelope is missing `first`/`last`/`empty`/`numberOfElements`/`pageable`
   that Java's Spring Data `Page<>` includes.
8. `/products/stats` uses uppercase enum-name keys (`DRAFT`) instead of Java's lowercase (`draft`).
9. Raising a non-conformance with an invalid `qualityCheckId` succeeds (201) instead of 404 — the
   field is declared nowhere in Python's schema/router, so it's silently dropped regardless of validity.

Two more were found but can't be expressed as an HTTP test at all — see the "Known issues NOT
covered above" section that `npm run compare` appends to `results/migration-coverage-report.md`:

- **Alembic migrations can't locate the seed SQL.** `alembic/versions/0001_v1_init.py` and
  `0002_v2_plm_expansion.py` compute the Java project's SQL directory as
  `Path(__file__).resolve().parents[3] / "formcraft-plm" / "formcraft-plm" / ...`, which resolves
  one directory too high both on the host and in the app container as shipped. `alembic upgrade
  head` does not work as-is. Worked around here by applying `V1__init.sql` and
  `V2__plm_expansion.sql` directly via `psql` against the running `db` container.
- **Whether a *valid* `qualityCheckId` actually links** (bug #9 only proves an *invalid* one isn't
  validated) — unobservable via the API either way, since neither backend's non-conformance
  response schema exposes the link back to the client.
