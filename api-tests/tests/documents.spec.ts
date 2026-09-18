import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { saveShapeSample } from "../helpers/shape-sample";
import { SEED } from "../helpers/backend-config";

const ENTITY_TYPE = "PRODUCT";
const ENTITY_ID = SEED.ganacheProductId;
const FILE_CONTENT = Buffer.from("Playwright migration-coverage test document\n");

test.describe.serial("documents", () => {
  let documentId: number;

  test("PLM_MANAGER can upload a document", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post("/api/documents", {
      multipart: {
        entityType: ENTITY_TYPE,
        entityId: String(ENTITY_ID),
        file: { name: "test-doc.txt", mimeType: "text/plain", buffer: FILE_CONTENT },
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    documentId = body.id;
    saveShapeSample("documents-upload", body);
  });

  test("any authenticated user can list documents for an entity", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/documents?entityType=${ENTITY_TYPE}&entityId=${ENTITY_ID}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.some((d: any) => d.id === documentId)).toBe(true);
  });

  test("any authenticated user can download the document", async ({ asRole }) => {
    const ctx = await asRole("VIEWER");
    const res = await ctx.get(`/api/documents/${documentId}/download`);
    expect(res.status()).toBe(200);
    const body = await res.body();
    expect(body.toString("utf-8")).toContain("Playwright migration-coverage test document");
  });

  test("PLM_MANAGER can delete the document", async ({ asRole }) => {
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.delete(`/api/documents/${documentId}`);
    expect(res.status()).toBe(204);
  });

  test("VIEWER cannot upload or delete documents", async ({ asRole }) => {
    await expectGuarded(asRole, "post", "/api/documents", ["ADMIN", "PLM_MANAGER", "QUALITY_MANAGER", "PURCHASING"], {
      multipart: {
        entityType: ENTITY_TYPE,
        entityId: String(ENTITY_ID),
        file: { name: "should-not-upload.txt", mimeType: "text/plain", buffer: FILE_CONTENT },
      },
    });
  });
});
