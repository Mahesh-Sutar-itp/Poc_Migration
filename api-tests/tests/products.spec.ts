import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED } from "../helpers/backend-config";

const SUFFIX = Date.now();
const CODE = `TEST-PROD-${SUFFIX}`;

test.describe.serial("products", () => {
  let createdProductId: number;
  let compositionLineId: number;

  test("PLM_MANAGER can create a product", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post("/api/products", {
      data: {
        code: CODE,
        name: "API Test Product",
        description: "Created by Playwright migration-coverage suite",
        productType: "FINISHED_PRODUCT",
        unit: "kg",
        costPerKg: 1.5,
        allergenFlags: "GLUTEN",
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.code).toBe(CODE);
    expect(body.state).toBe("DRAFT");
    createdProductId = body.id;
    saveShapeSample("products-create", body);
  });

  test("any authenticated user can list products (paginated)", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/products?page=0&size=20&sortBy=name");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("content");
    expect(body).toHaveProperty("totalElements");
    expect(body).toHaveProperty("totalPages");
    saveShapeSample("products-list-page", body);
  });

  test("any authenticated user can search products", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/search?code=${CODE}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((p: any) => p.code === CODE)).toBe(true);
  });

  test("any authenticated user can get product stats by state", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/products/stats");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body).toBe("object");
    saveShapeSample("products-stats", body);
  });

  test("any authenticated user can get a product by id", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${createdProductId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdProductId);
  });

  test("getting a nonexistent product returns 404", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/products/999999999");
    expect(res.status()).toBe(404);
  });

  test("PLM_MANAGER can update the product", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    // Java's ProductUpdateRequest validation requires code/productType even on update, so send a full body.
    const res = await ctx.put(`/api/products/${createdProductId}`, {
      data: { code: CODE, name: "API Test Product (updated)", productType: "FINISHED_PRODUCT", unit: "kg", costPerKg: 1.5 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("API Test Product (updated)");
  });

  test("PLM_MANAGER can add a composition line using a seeded raw material", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${createdProductId}/composition`, {
      data: { ingredientId: SEED.rawMaterialIds[0], quantity: 42, unit: "%" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    saveShapeSample("products-composition-add", body);
  });

  test("any authenticated user can list the product's composition", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${createdProductId}/composition`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    compositionLineId = body[0].id;
    saveShapeSample("products-composition-list-item", body[0]);
  });

  test("PLM_MANAGER can remove the composition line", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.delete(`/api/products/${createdProductId}/composition/${compositionLineId}`);
    expect(res.status()).toBe(200);
  });

  test("any authenticated user can view the product's audit history", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${createdProductId}/audit-history`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("PLM_MANAGER can delete the product (still DRAFT)", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.delete(`/api/products/${createdProductId}`);
    expect(res.status()).toBe(204);
  });

  test("VIEWER is blocked from mutating products", async ({ asRole }) => {
    await expectGuarded(asRole, "post", "/api/products", ["ADMIN", "PLM_MANAGER", "QUALITY_MANAGER", "PURCHASING"], {
      data: { code: `SHOULD-NOT-CREATE-${SUFFIX}`, name: "x", productType: "RAW_MATERIAL" },
    });
  });
});
