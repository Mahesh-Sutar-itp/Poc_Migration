import fs from "fs";
import path from "path";
import { BACKEND, BASE_URL, ROLES, SEED_USERS, SEED_PASSWORD, tokenFilePath } from "./helpers/backend-config";

/**
 * Logs in as each of the 5 seed users once per run and caches the JWTs to a
 * file, so individual spec files/fixtures don't each pay the login round-trip.
 */
export default async function globalSetup(): Promise<void> {
  const tokens: Record<string, string> = {};

  for (const role of ROLES) {
    const username = SEED_USERS[role];
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: SEED_PASSWORD }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `global-setup: login failed for seed user "${username}" (role ${role}) against ${BACKEND} backend at ${BASE_URL} ` +
          `(status ${res.status}). Is the ${BACKEND} stack up and seeded? Response: ${text}`
      );
    }
    const data = (await res.json()) as { token: string };
    tokens[role] = data.token;
  }

  fs.mkdirSync(path.dirname(tokenFilePath), { recursive: true });
  fs.writeFileSync(tokenFilePath, JSON.stringify(tokens, null, 2));
}
