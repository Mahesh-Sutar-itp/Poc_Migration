import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED } from "../helpers/backend-config";

const PRODUCT_ID = SEED.ganacheProductId;

test.describe.serial("specifications", () => {
  let specId: number;

  test("QUALITY_MANAGER can create a specification", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/products/${PRODUCT_ID}/specifications`, {
      data: { parameter: "moisture", specType: "PHYSICAL", minValue: 1, maxValue: 5, targetValue: 3, unit: "%" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    specId = body.id;
    saveShapeSample("specifications-create", body);
  });

  test("any authenticated user can list specifications for a product", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${PRODUCT_ID}/specifications`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((s: any) => s.id === specId)).toBe(true);
  });

  test("QUALITY_MANAGER can update a specification", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.put(`/api/specifications/${specId}`, {
      data: { parameter: "moisture", specType: "PHYSICAL", minValue: 1, maxValue: 6, targetValue: 3, unit: "%" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Number(body.maxValue)).toBe(6);
  });

  test("QUALITY_MANAGER can delete a specification", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.delete(`/api/specifications/${specId}`);
    expect(res.status()).toBe(204);
  });

  test("PLM_MANAGER and PURCHASING cannot manage specifications", async ({ asRole }) => {
    await expectGuarded(asRole, "post", `/api/products/${PRODUCT_ID}/specifications`, ["ADMIN", "QUALITY_MANAGER"], {
      data: { parameter: "x", specType: "PHYSICAL" },
    });
  });
});
