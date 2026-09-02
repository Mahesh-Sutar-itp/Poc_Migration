# Construct mapping: Spring Boot 3.2.5 -> FastAPI

Authoritative one-to-one mapping. Where the third column says NET-NEW or
NO EQUIVALENT, a mechanical translation is not possible and the named
reference file governs.

## Runtime and build

| Java / Spring | Python / FastAPI | Note |
|---|---|---|
| Java 21 (Temurin) | Python 3.12 | |
| Spring Boot 3.2.5 | FastAPI + Uvicorn | ASGI replaces the servlet container |
| Embedded Tomcat, blocking | Uvicorn workers | Services are sync — use `def` routes, never `async def` |
| Maven `pom.xml` | uv `pyproject.toml` | |
| Lombok | not needed | accessors become implicit |
| `eclipse-temurin:21-jre` | `python:3.12-slim` | multi-stage build no longer needed |

## Web and serialization

| Java / Spring | Python / FastAPI | Note |
|---|---|---|
| `@RestController` | `APIRouter` | 16 controllers -> 16 routers |
| context-path `/api` | `APIRouter(prefix="/api")` | frontend and nginx both assume it |
| nested record DTOs | Pydantic v2 `BaseModel` | request side maps cleanly |
| `@NotBlank` `@Positive` `@Size` | Pydantic `Field` constraints | |
| Jackson + Hibernate6Module FORCE_LAZY_LOADING | explicit response schemas | **NET-NEW** — see response-schemas.md |
| `@JsonIgnore` / `@JsonIgnoreProperties` | field selection in the schema | cycle-breaking becomes explicit |
| `ProblemDetail` (RFC 7807) | `@app.exception_handler` | frontend reads `problem.detail` — keep the key |
| `Page<T>` | hand-rolled `Page[T]` | envelope keys are part of the contract |

## Security

| Java / Spring | Python / FastAPI | Note |
|---|---|---|
| `SecurityConfig` URL matchers | per-route `Depends()` | 9 ordered rules — see security-rules.md |
| `OncePerRequestFilter` | `HTTPBearer` dependency | |
| jjwt 0.12.6, HS256 | PyJWT | claims `sub` / `role` / `fullName`, 24 h — keep identical |
| `BCryptPasswordEncoder` | `passlib[bcrypt]` | seeded `$2b$` hashes must keep verifying |
| `UserDetailsService` | `get_current_user` dependency | Principal wrapper disappears |
| CORS config bean | `CORSMiddleware` | origins `:5173` and `:3000` |
| `@EnableMethodSecurity` | drop | enabled but never used |

## Persistence

| Java / Spring | Python / FastAPI | Note |
|---|---|---|
| Spring Data JPA + Hibernate 6 | SQLAlchemy 2.0 | 20 entities -> 20 mapped classes |
| `JpaRepository<T,ID>` | repository modules | derived query names become explicit `select()` |
| `@Query` JPQL + `LEFT JOIN FETCH` | `selectinload()` / `joinedload()` | 12 hand-written queries |
| Criteria API + Specification | list of filter clauses | `ProductQueryBuilder` ports almost 1:1 |
| `@Transactional(REQUIRES_NEW)` | separate session scope | async audit writes need their own session |
| `@Version` | `version_id_col` | optimistic lock on Product |
| `@JdbcTypeCode(SqlTypes.JSON)` | JSONB column | formulation computed values |
| HikariCP | SQLAlchemy `QueuePool` | pool 10 / idle 2 |
| Flyway V1 + V2 | Alembic | or run the same SQL unchanged |
| PostgreSQL 15 | PostgreSQL 15 | **unchanged — the schema does not move** |

## Domain logic

| Java / Spring | Python / FastAPI | Note |
|---|---|---|
| Spring SPEL `SpelExpressionParser` | `simpleeval` | **NO EQUIVALENT** — must stay sandboxed, never `eval()` |
| Chain of Responsibility (interface + `setNext`) | `Protocol` + handler list | 4 handlers; the source double-drives the chain |
| `enum canTransitionTo()` | Enum with method | 3 state machines, port verbatim |
| `BigDecimal` vs `double` | `Decimal` vs `float` | mixed deliberately — see numeric-fidelity.md |
| `@Async` + `CompletableFuture` | `BackgroundTasks` | audit writes and batch formulation |
| Apache Commons Logging | `logging` / `structlog` | |
| Spring Actuator | plain `/health` route | only health/info/metrics were exposed |
| `@EnableScheduling` | drop | declared, but no `@Scheduled` method exists |

## Testing

| Java / Spring | Python / FastAPI | Note |
|---|---|---|
| JUnit 5 + Mockito | pytest + `unittest.mock` | 8 suites, 800 LOC — the acceptance harness |
| `@ExtendWith(MockitoExtension)` | fixtures | |
| H2 in PostgreSQL mode | SQLite or testcontainers | Flyway disabled in the test profile either way |
| spring-security-test | `TestClient` | |
