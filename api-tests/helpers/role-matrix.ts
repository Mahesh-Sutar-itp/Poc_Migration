import { APIRequestContext, expect } from "@playwright/test";
import { ROLES, Role, MISSING_TOKEN_STATUS } from "./backend-config";

type Method = "get" | "post" | "put" | "delete";
type AsRole = (role: Role | "ANON") => Promise<APIRequestContext>;

/**
 * Verifies the negative space of a role guard: anonymous callers (no
 * Authorization header at all) get MISSING_TOKEN_STATUS (403 on Java, 401
 * on Python -- see backend-config.ts), and every role NOT in
 * `allowedRoles` gets 403. Deliberately never calls with an allowed role
 * (that would perform the real mutation a second time and could corrupt
 * state already exercised by the happy-path test) -- the happy-path test
 * already proves the allowed role can do the action.
 */
export async function expectGuarded(
  asRole: AsRole,
  method: Method,
  url: string,
  allowedRoles: Role[],
  options?: { data?: unknown; multipart?: unknown }
): Promise<void> {
  const anonCtx = await asRole("ANON");
  const anonRes = await anonCtx[method](url, options);
  expect(anonRes.status(), `ANON ${method.toUpperCase()} ${url} should be ${MISSING_TOKEN_STATUS}`).toBe(MISSING_TOKEN_STATUS);

  for (const role of ROLES.filter((r) => !allowedRoles.includes(r))) {
    const ctx = await asRole(role);
    const res = await ctx[method](url, options);
    expect(res.status(), `${role} ${method.toUpperCase()} ${url} should be 403`).toBe(403);
  }
}
