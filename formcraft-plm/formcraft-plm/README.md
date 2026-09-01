# FormCraft PLM

A **complex Java 21 + Spring Boot 3 monolith** built as a POC sample for testing **AWS Transform** Java → Python (FastAPI) migration.

## Architecture

Mirrors beCPG's patterns:
- **Service/Interface pattern** — `ProductService`, `FormulationService`, `WorkflowService`, `QualityService`
- **Formulation Chain** (Chain of Responsibility) — 4 handlers: Nutritional → Cost → Compliance → Score
- **Spring SPEL formula evaluation** — per-product formula expressions evaluated at runtime
- **Workflow State Machine** — DRAFT → IN_VALIDATION → VALIDATED → ARCHIVED
- **JPA Specifications** (dynamic query builder)
- **Async audit logging**
- **Spring Security** (Basic Auth, role-based)

## Quick Start

```bash
docker-compose up --build
```

App starts at: `http://localhost:8080/api`  
Credentials: `admin` / `Passw0rd!` (seeded in `V2__plm_expansion.sql`; also valid for `plmmanager`, `quality`, `purchasing`, `viewer`)

Auth is JWT-based, not HTTP Basic — call `POST /api/auth/login` to get a token, then send it as `Authorization: Bearer <token>` on subsequent requests.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products (paginated) |
| GET | `/api/products/search?name=X&type=FINISHED_PRODUCT` | Search with filters |
| POST | `/api/products` | Create a product |
| GET | `/api/products/{id}` | Get product by ID |
| POST | `/api/products/{id}/composition` | Add ingredient to BOM |
| POST | `/api/products/{id}/formulate` | Run formulation chain |
| GET | `/api/products/{id}/formulate/history` | Get formulation history |
| POST | `/api/products/{id}/workflow/submit` | Submit for validation |
| POST | `/api/products/{id}/workflow/approve` | Approve product |
| POST | `/api/products/{id}/workflow/reject?reason=X` | Reject back to draft |
| POST | `/api/products/{id}/quality/run-all` | Run all quality checks |
| GET | `/api/products/stats` | Product counts by state |

## Example: Full Formulation Flow

```bash
# 0. Log in and grab a token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Passw0rd!"}' | jq -r .token)

# 1. Get a product (Chocolate Brownie is pre-seeded as id=9)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/products/9

# 2. Formulate it (runs Nutritional → Cost → Compliance → Score chain)
curl -H "Authorization: Bearer $TOKEN" -X POST "http://localhost:8080/api/products/9/formulate"

# 3. Submit for validation (creates workflow tasks)
curl -H "Authorization: Bearer $TOKEN" -X POST "http://localhost:8080/api/products/9/workflow/submit?assignee=admin"

# 4. Run quality checks
curl -H "Authorization: Bearer $TOKEN" -X POST http://localhost:8080/api/products/9/quality/run-all

# 5. Approve
curl -H "Authorization: Bearer $TOKEN" -X POST http://localhost:8080/api/products/9/workflow/approve
```

## Tech Stack (Source — Before AWS Transform)

| Component | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.2 |
| REST API | Spring MVC (`@RestController`) |
| Data Access | Spring Data JPA + Hibernate |
| Database | PostgreSQL 15 |
| DB Migrations | Flyway |
| Formula Engine | Spring SPEL |
| Security | Spring Security (JWT, DB-backed users) |
| Build | Maven |
| Tests | JUnit 5 + Mockito |
| Container | Docker + Docker Compose |

## Target Stack (After AWS Transform)

| Component | Technology |
|---|---|
| Language | Python 3.12 |
| Framework | FastAPI |
| Data Access | SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Formula Engine | `simpleeval` / Python `eval()` sandbox |
| Security | FastAPI HTTPBasic |
| Tests | pytest + pytest-asyncio |

## Project Structure

```
src/main/java/fr/formcraft/
├── FormCraftApplication.java
├── common/exception/          ← FormCraftException, EntityNotFoundException, FormulationException
├── common/constants/          ← RepoConsts (mirrors beCPG's RepoConsts)
├── model/entity/              ← JPA entities: Product, CompositionLine, NutrientValue, etc.
├── model/enums/               ← ProductType, ProductState, NutrientType, etc.
├── repo/
│   ├── jpa/                   ← Spring Data JPA repositories
│   ├── formulation/           ← FormulationService + 4 chain handlers (core complexity)
│   ├── formula/               ← SPEL FormulaEvaluationService
│   ├── product/               ← ProductService (interface + impl)
│   ├── workflow/              ← WorkflowService (state machine)
│   ├── quality/               ← QualityService (checks)
│   ├── search/                ← ProductQueryBuilder (JPA Specifications)
│   └── audit/                 ← AuditService (async)
├── web/controller/            ← REST controllers (6 controllers)
├── web/exception/             ← GlobalExceptionHandler
└── config/                    ← SecurityConfig
```
