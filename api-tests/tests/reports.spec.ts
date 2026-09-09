import { test, expect } from "../fixtures/api";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED, MISSING_TOKEN_STATUS } from "../helpers/backend-config";

test.describe("reports", () => {
  test("dashboard summary", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/reports/dashboard-summary");
    expect(res.status()).toBe(200);
    saveShapeSample("reports-dashboard-summary", await res.json());
  });

  test("cost breakdown for a product", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/reports/cost-breakdown/${SEED.brownieProductId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    saveShapeSample("reports-cost-breakdown", Array.isArray(body) ? body[0] : body);
  });

  test("allergen matrix", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/reports/allergen-matrix");
    expect(res.status()).toBe(200);
    const body = await res.json();
    saveShapeSample("reports-allergen-matrix", Array.isArray(body) ? body[0] : body);
  });

  test("quality pass rate", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/reports/quality-pass-rate");
    expect(res.status()).toBe(200);
    saveShapeSample("reports-quality-pass-rate", await res.json());
  });

  test("recent activity feed", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/reports/activity?limit=20");
    expect(res.status()).toBe(200);
    const body = await res.json();
    saveShapeSample("reports-activity", Array.isArray(body) ? body[0] : body);
  });

  test("reports require authentication", async ({ asRole }) => {
    const ctx = await asRole("ANON");
    const res = await ctx.get("/api/reports/dashboard-summary");
    expect(res.status()).toBe(MISSING_TOKEN_STATUS);
  });
});
