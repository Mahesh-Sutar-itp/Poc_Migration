import { test, expect } from "../fixtures/api";
import { saveShapeSample } from "../helpers/shape-sample";
import { MISSING_TOKEN_STATUS } from "../helpers/backend-config";

test.describe("auth", () => {
  test("login succeeds with valid seed credentials", async ({ asRole }) => {
    const ctx = await asRole("ANON");
    const res = await ctx.post("/api/auth/login", { data: { username: "admin", password: "Passw0rd!" } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(body.user).toMatchObject({ username: "admin", role: "ADMIN" });
    saveShapeSample("auth-login", body);
  });

  test("login rejects a wrong password", async ({ asRole }) => {
    const ctx = await asRole("ANON");
    const res = await ctx.post("/api/auth/login", { data: { username: "admin", password: "definitely-wrong" } });
    // Java's global exception handler maps bad credentials to 400; both backends must reject, not the same code.
    expect(res.status(), "wrong password must not authenticate").not.toBe(200);
  });

  test("login rejects an unknown username", async ({ asRole }) => {
    const ctx = await asRole("ANON");
    const res = await ctx.post("/api/auth/login", { data: { username: "no-such-user", password: "Passw0rd!" } });
    expect(res.status(), "unknown username must not authenticate").not.toBe(200);
  });

  test("me requires a token", async ({ asRole }) => {
    const ctx = await asRole("ANON");
    const res = await ctx.get("/api/auth/me");
    // Missing Authorization header -> 403 on Java, 401 on Python (see backend-config.ts).
    expect(res.status()).toBe(MISSING_TOKEN_STATUS);
  });

  test("me returns the current user when authenticated", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.get("/api/auth/me");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.username).toBe("admin");
    expect(body.role).toBe("ADMIN");
    saveShapeSample("auth-me", body);
  });
});
