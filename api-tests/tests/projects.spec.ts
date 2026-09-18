import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED } from "../helpers/backend-config";

const SUFFIX = Date.now();
const LINKED_PRODUCT_ID = SEED.brownieProductId;

test.describe.serial("projects", () => {
  let projectId: number;
  let milestoneId: number;

  test("PLM_MANAGER can create a project", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post("/api/projects", {
      data: { name: `API Test Project ${SUFFIX}`, description: "Playwright migration-coverage suite", owner: "plmmanager", targetLaunchDate: "2030-01-01" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("PLANNING");
    projectId = body.id;
    saveShapeSample("projects-create", body);
  });

  test("any authenticated user can list projects", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/projects");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((p: any) => p.id === projectId)).toBe(true);
  });

  test("any authenticated user can get a project by id", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/projects/${projectId}`);
    expect(res.status()).toBe(200);
  });

  test("PLM_MANAGER can update the project status", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.put(`/api/projects/${projectId}/status?status=IN_PROGRESS`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("IN_PROGRESS");
  });

  test("PLM_MANAGER can link a product to the project", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/projects/${projectId}/products/${LINKED_PRODUCT_ID}`);
    expect(res.status()).toBe(204);
  });

  test("PLM_MANAGER can add a milestone", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/projects/${projectId}/milestones`, {
      data: { name: "Gate 1 review", gateNumber: 1, dueDate: "2030-02-01" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    milestoneId = body.id;
    saveShapeSample("projects-milestone-create", body);
  });

  test("PLM_MANAGER can update a milestone's status", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.put(`/api/projects/${projectId}/milestones/${milestoneId}/status?status=DONE`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("DONE");
  });

  test("PLM_MANAGER can unlink the product from the project", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.delete(`/api/projects/${projectId}/products/${LINKED_PRODUCT_ID}`);
    expect(res.status()).toBe(204);
  });

  test("PLM_MANAGER can delete the project", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    // Deletion is only allowed from PLANNING or CANCELLED; this project was moved to IN_PROGRESS earlier.
    const revert = await ctx.put(`/api/projects/${projectId}/status?status=PLANNING`);
    expect(revert.status()).toBe(200);
    const res = await ctx.delete(`/api/projects/${projectId}`);
    expect(res.status()).toBe(204);
  });

  test("VIEWER cannot create projects", async ({ asRole }) => {
    await expectGuarded(asRole, "post", "/api/projects", ["ADMIN", "PLM_MANAGER", "QUALITY_MANAGER", "PURCHASING"], {
      data: { name: "should not be created", description: "x", owner: "x", targetLaunchDate: "2030-01-01" },
    });
  });
});
