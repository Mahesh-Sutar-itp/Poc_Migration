import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED, ALLOWED_ROLES } from "../helpers/backend-config";

// Runs against the seeded Chocolate Brownie product (id 9), which has a
// formulaExpression and composition lines set up by the seed SQL.
const PRODUCT_ID = SEED.brownieProductId;

test.describe.serial("formulation", () => {
  test("PLM_MANAGER can check whether the product should be formulated", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.get(`/api/products/${PRODUCT_ID}/formulate/check`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("shouldFormulate");
    expect(body.shouldFormulate).toBe(true);
  });

  test("PLM_MANAGER can run the formulation chain", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${PRODUCT_ID}/formulate?chainId=default`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Response shape genuinely differs between backends: Java returns
    // {result, chainId, productName, productId} (flat), Python returns
    // {product: {id, code, name}, latestResult} (nested) -- a real
    // contract divergence, tracked here rather than asserted away.
    const returnedProductId = body.productId ?? body.product?.id;
    expect(returnedProductId).toBe(PRODUCT_ID);
    saveShapeSample("formulation-run", body);
  });

  test("any authenticated user can view formulation history", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${PRODUCT_ID}/formulate/history`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    saveShapeSample("formulation-history-item", body[0]);
  });

  test("roles outside the formulate guard are blocked", async ({ asRole }) => {
    // See helpers/backend-config.ts ALLOWED_ROLES.formulate: Java allows any
    // mutating role here, Python narrows it to ADMIN/PLM_MANAGER -- a real
    // migration divergence, not a test artifact.
    await expectGuarded(asRole, "post", `/api/products/${PRODUCT_ID}/formulate`, ALLOWED_ROLES.formulate);
  });
});
