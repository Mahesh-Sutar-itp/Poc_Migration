import { test as base, request, APIRequestContext } from "@playwright/test";
import fs from "fs";
import { BACKEND, BASE_URL, Role, tokenFilePath } from "../helpers/backend-config";

let tokensCache: Record<string, string> | null = null;
function loadTokens(): Record<string, string> {
  if (!tokensCache) {
    tokensCache = JSON.parse(fs.readFileSync(tokenFilePath, "utf-8"));
  }
  return tokensCache;
}

type AsRole = (role: Role | "ANON") => Promise<APIRequestContext>;

type Fixtures = {
  backend: typeof BACKEND;
  asRole: AsRole;
};

export const test = base.extend<Fixtures>({
  backend: async ({}, use) => {
    await use(BACKEND);
  },

  asRole: async ({}, use) => {
    const opened: APIRequestContext[] = [];
    const tokens = loadTokens();

    const factory: AsRole = async (role) => {
      const headers: Record<string, string> = {};
      if (role !== "ANON") {
        headers["Authorization"] = `Bearer ${tokens[role]}`;
      }
      const ctx = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: headers });
      opened.push(ctx);
      return ctx;
    };

    await use(factory);

    for (const ctx of opened) await ctx.dispose();
  },
});

export { expect } from "@playwright/test";
