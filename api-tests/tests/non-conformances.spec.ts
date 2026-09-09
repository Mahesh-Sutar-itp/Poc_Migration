import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED, nonConformanceCreateBody } from "../helpers/backend-config";

const SUFFIX = Date.now();
const PRODUCT_ID = SEED.brownieProductId;

// State machine: OPEN -> IN_PROGRESS -> {CLOSED, OPEN}. Closing requires
// every corrective action to already be closed, so the flow below opens a
// CAPA action, transitions to IN_PROGRESS, closes the action, then closes
// the non-conformance itself.
test.describe.serial("non-conformances", () => {
  let ncId: number;
  let actionId: number;

  test("QUALITY_MANAGER can raise a non-conformance against a product", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/products/${PRODUCT_ID}/non-conformances`, {
      data: nonConformanceCreateBody(`API test NC ${SUFFIX}`, "Raised by Playwright migration-coverage suite", "MAJOR"),
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("OPEN");
    ncId = body.id;
    saveShapeSample("non-conformances-create", body);
  });

  test("any authenticated user can list all non-conformances", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/non-conformances");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((n: any) => n.id === ncId)).toBe(true);
  });

  test("any authenticated user can view non-conformance stats", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/non-conformances/stats");
    expect(res.status()).toBe(200);
    saveShapeSample("non-conformances-stats", await res.json());
  });

  test("any authenticated user can get a non-conformance by id", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/non-conformances/${ncId}`);
    expect(res.status()).toBe(200);
  });

  test("any authenticated user can list non-conformances for the product", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${PRODUCT_ID}/non-conformances`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((n: any) => n.id === ncId)).toBe(true);
  });

  test("QUALITY_MANAGER can add a corrective action", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/non-conformances/${ncId}/actions`, {
      data: { description: "Retrain line staff", owner: "quality", dueDate: "2030-01-01" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    actionId = body.id;
    saveShapeSample("non-conformances-action-create", body);
  });

  test("any authenticated user can list corrective actions", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/non-conformances/${ncId}/actions`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((a: any) => a.id === actionId)).toBe(true);
  });

  test("QUALITY_MANAGER can transition the non-conformance to IN_PROGRESS", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/non-conformances/${ncId}/transition?target=IN_PROGRESS`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("IN_PROGRESS");
  });

  test("closing is rejected while a corrective action is still open", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/non-conformances/${ncId}/close`);
    expect(res.status()).toBe(400);
  });

  test("QUALITY_MANAGER can close the corrective action", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/non-conformances/${ncId}/actions/${actionId}/close`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("DONE");
  });

  test("QUALITY_MANAGER can now close the non-conformance", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/non-conformances/${ncId}/close`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("CLOSED");
  });

  test("PLM_MANAGER and PURCHASING cannot raise non-conformances", async ({ asRole }) => {
    await expectGuarded(asRole, "post", `/api/products/${PRODUCT_ID}/non-conformances`, ["ADMIN", "QUALITY_MANAGER"], {
      data: nonConformanceCreateBody("should not be created", "x", "MINOR"),
    });
  });
});
