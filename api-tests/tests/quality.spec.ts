import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED, ALLOWED_ROLES } from "../helpers/backend-config";

const PRODUCT_ID = SEED.brownieProductId;

test.describe.serial("quality", () => {
  test("QUALITY_MANAGER can run all quality checks", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/products/${PRODUCT_ID}/quality/run-all`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    saveShapeSample("quality-run-all-item", body[0]);
  });

  test("QUALITY_MANAGER can run a single check type", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/products/${PRODUCT_ID}/quality/run/ALLERGEN_CHECK`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.checkType ?? body.check_type).toBeDefined();
    saveShapeSample("quality-run-one", body);
  });

  test("any authenticated user can list quality checks for a product", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${PRODUCT_ID}/quality`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("any authenticated user can view the pass/fail status summary", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${PRODUCT_ID}/quality/status`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("allPassed");
    saveShapeSample("quality-status", body);
  });

  test("roles outside the quality-run guard are blocked", async ({ asRole }) => {
    // See helpers/backend-config.ts ALLOWED_ROLES.qualityRun: Java allows any
    // mutating role here, Python narrows it to ADMIN/QUALITY_MANAGER -- a real
    // migration divergence, not a test artifact.
    await expectGuarded(asRole, "post", `/api/products/${PRODUCT_ID}/quality/run-all`, ALLOWED_ROLES.qualityRun);
  });
});
