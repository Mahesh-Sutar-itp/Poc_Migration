import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED } from "../helpers/backend-config";

const SUFFIX = Date.now();
const CODE = `TEST-SUP-${SUFFIX}`;
const LINKED_PRODUCT_ID = SEED.rawMaterialIds[1];

test.describe.serial("suppliers", () => {
  let supplierId: number;
  let linkId: number;

  test("PURCHASING can create a supplier", async ({ asRole }) => {
    const ctx = await asRole("PURCHASING");
    const res = await ctx.post("/api/suppliers", {
      data: { code: CODE, name: "API Test Supplier", contactName: "Jane Doe", contactEmail: "jane@example.com", phone: "555-0100", address: "1 Test St", rating: 4 },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    supplierId = body.id;
    saveShapeSample("suppliers-create", body);
  });

  test("any authenticated user can list suppliers", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/suppliers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((s: any) => s.id === supplierId)).toBe(true);
  });

  test("any authenticated user can get a supplier by id", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/suppliers/${supplierId}`);
    expect(res.status()).toBe(200);
  });

  test("PURCHASING can update a supplier", async ({ asRole }) => {
    const ctx = await asRole("PURCHASING");
    // Java's SupplierUpdateRequest validation requires code even on update, so send a full body.
    const res = await ctx.put(`/api/suppliers/${supplierId}`, {
      data: { code: CODE, name: "API Test Supplier (updated)", contactName: "Jane Doe", contactEmail: "jane@example.com", phone: "555-0100", address: "1 Test St", rating: 5 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("API Test Supplier (updated)");
  });

  test("PURCHASING can link the supplier to a product", async ({ asRole }) => {
    const ctx = await asRole("PURCHASING");
    const res = await ctx.post(`/api/suppliers/${supplierId}/products`, {
      data: { productId: LINKED_PRODUCT_ID, pricePerKg: 2.5, leadTimeDays: 7, moq: 100, preferred: true },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    // Java's SupplierProduct representation embeds {product} but not {supplier}
    // (it's already scoped by supplierId in the URL), so match on the link's
    // own id rather than assuming a supplierId/supplier field is present.
    linkId = body.id;
    saveShapeSample("suppliers-link-product", body);
  });

  test("any authenticated user can list a supplier's linked products", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/suppliers/${supplierId}/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((sp: any) => sp.id === linkId)).toBe(true);
  });

  test("any authenticated user can list suppliers for a product", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/suppliers/for-product/${LINKED_PRODUCT_ID}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((sp: any) => sp.id === linkId)).toBe(true);
  });

  test("PURCHASING can unlink the supplier from the product", async ({ asRole }) => {
    const ctx = await asRole("PURCHASING");
    const res = await ctx.delete(`/api/suppliers/${supplierId}/products/${LINKED_PRODUCT_ID}`);
    expect(res.status()).toBe(204);
  });

  test("PURCHASING can delete the supplier", async ({ asRole }) => {
    const ctx = await asRole("PURCHASING");
    const res = await ctx.delete(`/api/suppliers/${supplierId}`);
    expect(res.status()).toBe(204);
  });

  test("QUALITY_MANAGER and PLM_MANAGER cannot manage suppliers", async ({ asRole }) => {
    await expectGuarded(asRole, "post", "/api/suppliers", ["ADMIN", "PURCHASING"], {
      data: { code: `SHOULD-NOT-CREATE-${SUFFIX}`, name: "x" },
    });
  });
});
