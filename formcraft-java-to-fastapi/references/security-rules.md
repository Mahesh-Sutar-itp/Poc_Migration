# Security: 9 ordered rules -> per-route guards

`SecurityConfig` declares nine URL matchers evaluated in order, **first match
wins**. Two of them never fire as written because an earlier, broader matcher
already caught the request.

## CRITICAL

**Port the effective behaviour, not the declaration.** Walk the matcher list in
order for each of the 16 routers and work out which rule actually applies to
each route. A faithful-looking transcription of the nine rules into nine
dependencies will quietly widen access.

Concretely: VIEWER cannot actually mark a notification read, even though a
literal reading of the rules suggests otherwise. Any route where the declared
rule and the effective rule differ must carry a comment naming both.

## Mechanics

- `OncePerRequestFilter` -> `HTTPBearer` dependency.
- jjwt 0.12.6 HS256 -> PyJWT. Claims `sub`, `role`, `fullName`; 24 h expiry.
  Keep the claim names and the algorithm identical — existing tokens and the
  frontend both depend on them.
- `BCryptPasswordEncoder` -> `passlib[bcrypt]`. The seeded `$2b$` hashes in the
  database must keep verifying. Test this explicitly before anything else.
- `UserDetailsService` -> a `get_current_user` dependency returning the User
  model. The Spring Principal wrapper disappears.
- CORS: allow origins `http://localhost:5173` and `http://localhost:3000`.
- Drop `@EnableMethodSecurity` — enabled but never used.

## Acceptance test

Log in as each of the 5 roles and confirm the same set of routes is permitted
and refused as in the Java service. All five, every route. This is a table
test, not a spot check.
