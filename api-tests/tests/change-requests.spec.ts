import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED, decisionBody } from "../helpers/backend-config";

const SUFFIX = Date.now();
const PRODUCT_ID = SEED.ganacheProductId;

// State machine: DRAFT -> SUBMITTED -> UNDER_REVIEW -> {APPROVED, REJECTED} -> IMPLEMENTED.
// /submit performs both DRAFT->SUBMITTED and SUBMITTED->UNDER_REVIEW server-side.
test.describe.serial("change-requests", () => {
  let crId: number;

  test("PLM_MANAGER can create a change request", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${PRODUCT_ID}/change-requests`, {
      // Python's ChangeRequestCreateRequest also requires productId in the body
      // even though it's already in the URL path (Java's does not) -- harmless
      // extra field for Java, required for Python.
      data: { productId: PRODUCT_ID, title: `API test ECR ${SUFFIX}`, description: "Playwright migration-coverage suite", reason: "Cost reduction", impact: "Low" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("DRAFT");
    crId = body.id;
    saveShapeSample("change-requests-create", body);
  });

  test("any authenticated user can list all change requests", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/change-requests");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((cr: any) => cr.id === crId)).toBe(true);
  });

  test("any authenticated user can get a change request by id", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/change-requests/${crId}`);
    expect(res.status()).toBe(200);
  });

  test("any authenticated user can list change requests for the product", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${PRODUCT_ID}/change-requests`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((cr: any) => cr.id === crId)).toBe(true);
  });

  test("PLM_MANAGER can submit the change request for review", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/change-requests/${crId}/submit`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("UNDER_REVIEW");
    saveShapeSample("change-requests-submit", body);
  });

  test("PLM_MANAGER can approve the change request", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/change-requests/${crId}/decide`, { data: decisionBody(true, "Looks good") });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("APPROVED");
    saveShapeSample("change-requests-decide", body);
  });

  test("PLM_MANAGER can implement the approved change request", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/change-requests/${crId}/implement`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("IMPLEMENTED");
  });

  test("a second decide call on an already-implemented CR is rejected", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/change-requests/${crId}/decide`, { data: decisionBody(false, "too late") });
    expect(res.status()).toBe(400);
  });

  test("VIEWER cannot create change requests", async ({ asRole }) => {
    await expectGuarded(asRole, "post", `/api/products/${PRODUCT_ID}/change-requests`, ["ADMIN", "PLM_MANAGER", "QUALITY_MANAGER", "PURCHASING"], {
      data: { title: "should not be created", description: "x", reason: "x", impact: "x" },
    });
  });
});

// Note: the productId-in-body quirk this file works around (see the create
// test above) is tracked as a real regression in known-divergences.spec.ts,
// asserted against Java's actual (no-productId-required) contract instead of
// silently adapted to pass on both backends.
