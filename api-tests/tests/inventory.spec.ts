import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED } from "../helpers/backend-config";

const SUFFIX = Date.now();
const PRODUCT_ID = SEED.rawMaterialIds[2];
const LOT_NUMBER = `TEST-LOT-${SUFFIX}`;

test.describe.serial("inventory", () => {
  let lotId: number;

  test("PURCHASING can receive a new stock lot", async ({ asRole }) => {
    const ctx = await asRole("PURCHASING");
    const res = await ctx.post(`/api/inventory/products/${PRODUCT_ID}/lots`, {
      data: { lotNumber: LOT_NUMBER, quantity: 100, unit: "kg" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    lotId = body.id;
    saveShapeSample("inventory-receive-lot", body);
  });

  test("any authenticated user can list all lots", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/inventory/lots");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((l: any) => l.id === lotId)).toBe(true);
  });

  test("any authenticated user can get a lot by id", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/inventory/lots/${lotId}`);
    expect(res.status()).toBe(200);
  });

  test("any authenticated user can list lots for a product", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/inventory/products/${PRODUCT_ID}/lots`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((l: any) => l.id === lotId)).toBe(true);
  });

  test("PURCHASING can receive additional quantity into the lot", async ({ asRole }) => {
    const ctx = await asRole("PURCHASING");
    const res = await ctx.post(`/api/inventory/lots/${lotId}/receive`, { data: { quantity: 10, reference: "PO-1" } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.movementType ?? body.type).toBeDefined();
    saveShapeSample("inventory-movement", body);
  });

  test("PURCHASING can consume quantity from the lot", async ({ asRole }) => {
    const ctx = await asRole("PURCHASING");
    const res = await ctx.post(`/api/inventory/lots/${lotId}/consume`, { data: { quantity: 5, reference: "WO-1" } });
    expect(res.status()).toBe(200);
  });

  test("PURCHASING can adjust the lot quantity", async ({ asRole }) => {
    const ctx = await asRole("PURCHASING");
    const res = await ctx.post(`/api/inventory/lots/${lotId}/adjust`, { data: { delta: 1, reference: "count correction" } });
    expect(res.status()).toBe(200);
  });

  test("any authenticated user can view the lot's movement history", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/inventory/lots/${lotId}/movements`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(3);
  });

  test("any authenticated user can view low-stock lots", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/inventory/low-stock?threshold=1000000");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("PLM_MANAGER and QUALITY_MANAGER cannot manage inventory", async ({ asRole }) => {
    await expectGuarded(asRole, "post", `/api/inventory/products/${PRODUCT_ID}/lots`, ["ADMIN", "PURCHASING"], {
      data: { lotNumber: `SHOULD-NOT-CREATE-${SUFFIX}`, quantity: 1 },
    });
  });
});
