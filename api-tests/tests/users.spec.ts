import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";

const SUFFIX = Date.now();
const USERNAME = `test.user.${SUFFIX}`;

test.describe.serial("users (ADMIN only)", () => {
  let createdUserId: number;

  test("ADMIN can list users", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.get("/api/users");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    saveShapeSample("users-list-item", body[0]);
  });

  test("ADMIN can create a user", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.post("/api/users", {
      data: {
        username: USERNAME,
        password: "Passw0rd!",
        fullName: "API Test User",
        email: `${USERNAME}@example.com`,
        role: "VIEWER",
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.username).toBe(USERNAME);
    createdUserId = body.id;
    saveShapeSample("users-create", body);
  });

  test("ADMIN can get the created user by id", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.get(`/api/users/${createdUserId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdUserId);
  });

  test("ADMIN can update the created user", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    // Java's UserUpdateRequest validation requires role even on update, so send a full body.
    const res = await ctx.put(`/api/users/${createdUserId}`, { data: { fullName: "Updated Test User", email: `${USERNAME}@example.com`, role: "VIEWER", enabled: true } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.fullName).toBe("Updated Test User");
  });

  test("ADMIN can reset the created user's password", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.post(`/api/users/${createdUserId}/reset-password`, { data: { newPassword: "NewPassw0rd!" } });
    expect(res.status()).toBe(204);
  });

  test("ADMIN can delete the created user", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.delete(`/api/users/${createdUserId}`);
    expect(res.status()).toBe(204);
  });

  test("non-admins and anonymous callers are blocked from user management", async ({ asRole }) => {
    await expectGuarded(asRole, "get", "/api/users", ["ADMIN"]);
  });
});
