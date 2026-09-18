import { test, expect } from "../fixtures/api";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED, nonConformanceCreateBody, MISSING_TOKEN_STATUS } from "../helpers/backend-config";

const SUFFIX = Date.now();

// Notifications aren't seeded, so this file manufactures its own precondition:
// raising a non-conformance notifies every QUALITY_MANAGER (notify_role), so
// logging in as the seeded "quality" user and raising one guarantees at least
// one unread notification to exercise list/unread/read/read-all against.
test.describe.serial("notifications", () => {
  test("setup: raise a non-conformance to generate a notification for QUALITY_MANAGER", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/products/${SEED.brownieProductId}/non-conformances`, {
      data: nonConformanceCreateBody(`Notification trigger ${SUFFIX}`, "Playwright migration-coverage suite", "MINOR"),
    });
    expect(res.status()).toBe(201);
  });

  test("QUALITY_MANAGER sees a positive unread count", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.get("/api/notifications/unread-count");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(0);
    saveShapeSample("notifications-unread-count", body);
  });

  test("QUALITY_MANAGER can list unread notifications", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.get("/api/notifications/unread");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    saveShapeSample("notifications-unread-item", body[0]);
  });

  test("QUALITY_MANAGER can list all of their notifications", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.get("/api/notifications");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    saveShapeSample("notifications-list-item", body[0]);
  });

  test("QUALITY_MANAGER can mark a single notification read", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const unread = await (await ctx.get("/api/notifications/unread")).json();
    const target = unread[0];
    const res = await ctx.post(`/api/notifications/${target.id}/read`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.read).toBe(true);
  });

  test("QUALITY_MANAGER can mark all notifications read", async ({ asRole }) => {
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post("/api/notifications/read-all");
    expect(res.status()).toBe(204);

    const after = await (await ctx.get("/api/notifications/unread-count")).json();
    expect(after.count).toBe(0);
  });

  test("notifications require authentication", async ({ asRole }) => {
    const ctx = await asRole("ANON");
    const res = await ctx.get("/api/notifications");
    expect(res.status()).toBe(MISSING_TOKEN_STATUS);
  });
});
