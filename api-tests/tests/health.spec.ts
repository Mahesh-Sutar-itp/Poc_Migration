import { test, expect } from "../fixtures/api";
import { paths } from "../helpers/backend-config";

test.describe("health", () => {
  test("health endpoint reports UP", async ({ asRole }) => {
    const ctx = await asRole("ANON");
    const res = await ctx.get(paths.health);
    expect(res.status()).toBe(200);
  });

  test("info endpoint reports app metadata", async ({ asRole }) => {
    const ctx = await asRole("ANON");
    const res = await ctx.get(paths.info);
    expect(res.status()).toBe(200);
  });
});
