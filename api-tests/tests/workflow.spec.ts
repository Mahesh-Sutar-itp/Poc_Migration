import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED_USERS } from "../helpers/backend-config";

const SUFFIX = Date.now();
const CODE = `TEST-WF-${SUFFIX}`;

// Full DRAFT -> IN_VALIDATION -> VALIDATED -> ARCHIVED lifecycle, plus a
// separate reject branch, on a product created fresh for this file so the
// seeded products (9/10) are left untouched for other domains to use.
test.describe.serial("workflow", () => {
  let productId: number;
  let rejectableProductId: number;

  test("setup: create two fresh DRAFT products for the lifecycle", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res1 = await ctx.post("/api/products", { data: { code: CODE, name: "Workflow Test Product", productType: "FINISHED_PRODUCT" } });
    expect(res1.status()).toBe(201);
    productId = (await res1.json()).id;

    const res2 = await ctx.post("/api/products", { data: { code: `${CODE}-R`, name: "Workflow Reject Product", productType: "FINISHED_PRODUCT" } });
    expect(res2.status()).toBe(201);
    rejectableProductId = (await res2.json()).id;
  });

  test("PLM_MANAGER can submit a product for validation", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${productId}/workflow/submit?assignee=${SEED_USERS.ADMIN}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.state).toBe("IN_VALIDATION");
    saveShapeSample("workflow-submit", body);
  });

  test("any authenticated user can list the product's workflow tasks", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/products/${productId}/workflow/tasks`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    saveShapeSample("workflow-tasks-item", body[0]);
  });

  test("ADMIN sees the assigned task in my-tasks", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.get("/api/workflow/my-tasks");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    // Java's my-tasks items omit productId entirely (Python's include it) --
    // match on taskName+assignee instead, which both backends expose.
    expect(body.some((t: any) => t.assignee === SEED_USERS.ADMIN && t.taskName === "Review Product Specification")).toBe(true);
    saveShapeSample("workflow-my-tasks-item", body[0]);
  });

  test("PLM_MANAGER can complete a workflow task", async ({ asRole }) => {
    const listCtx = await asRole("VIEWER");
    const tasks = await (await listCtx.get(`/api/products/${productId}/workflow/tasks`)).json();
    const pending = tasks.find((t: any) => t.status === "PENDING");
    expect(pending).toBeTruthy();

    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${productId}/workflow/tasks/${pending.id}/complete`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("COMPLETED");
  });

  test("PLM_MANAGER can approve the product", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${productId}/workflow/approve`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.state).toBe("VALIDATED");
  });

  test("PLM_MANAGER can archive the validated product", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${productId}/workflow/archive`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.state).toBe("ARCHIVED");
  });

  test("PLM_MANAGER can reject a submitted product back to DRAFT", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const submitRes = await ctx.post(`/api/products/${rejectableProductId}/workflow/submit`);
    expect(submitRes.status()).toBe(200);

    const res = await ctx.post(`/api/products/${rejectableProductId}/workflow/reject?reason=needs+more+detail`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.state).toBe("DRAFT");
  });

  test("PLM_MANAGER can use the generic transition endpoint", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${rejectableProductId}/workflow/transition?targetState=IN_VALIDATION&comment=retry`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.state).toBe("IN_VALIDATION");
  });

  test("an invalid state transition is rejected", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    // Already IN_VALIDATION; jumping straight to ARCHIVED is not a legal transition.
    const res = await ctx.post(`/api/products/${rejectableProductId}/workflow/transition?targetState=ARCHIVED`);
    expect(res.status()).toBe(400);
  });

  test("QUALITY_MANAGER and PURCHASING cannot mutate workflow state", async ({ asRole }) => {
    await expectGuarded(asRole, "post", `/api/products/${rejectableProductId}/workflow/approve`, ["ADMIN", "PLM_MANAGER"]);
  });
});
