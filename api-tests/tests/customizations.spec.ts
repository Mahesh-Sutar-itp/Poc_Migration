import { test, expect } from "../fixtures/api";
import { expectGuarded } from "../helpers/role-matrix";
import { SEED, decisionBody } from "../helpers/backend-config";

/**
 * Coverage for the Nordic Snacks customization repo (migrated from
 * Siemens-TeamCenter-POC-Java-Phase2-CustA into Python-Stable's
 * FORMCRAFT_CUSTOM_PATH-mounted customs/ repo) that no existing spec file
 * exercises. Two gates:
 *   Gate 1 -- app/sdk/workflow.py ChangeRequestTransitionHandler addons
 *             under customs/addons/nordic_snacks_*.py
 *   Gate 2 -- app/sdk/attributes.py custom Product columns declared in
 *             customs/custom-product-attributes.json
 *
 * These tests assume the app was started with FORMCRAFT_CUSTOM_PATH (or
 * --custom-path) pointing at the customs/ repo so the addons are actually
 * loaded and the manifest attributes are actually adopted (see app/main.py
 * load_addons() / custom_attribute_service.sync()) -- against a backend
 * started without that mount, every Gate 1 test below will fail as if the
 * customization were absent, and the Gate 2 tests will find nothing.
 */

const SUFFIX = Date.now();
// Raw material: no allergen_flags and not a finished product, so it trips
// neither the allergen-sign-off nor the high-impact-justification handler --
// isolates the minimum-review-window behavior from the other four Gate 1 rules.
const PLAIN_PRODUCT_ID = SEED.rawMaterialIds[0];
// Finished product seeded with allergen_flags='GLUTEN,EGGS,MILK' -- the only
// seed product that trips both the allergen-sign-off and the
// "touches a flagged finished product" branch of high-impact-justification.
const ALLERGEN_PRODUCT_ID = SEED.brownieProductId;

async function createCr(asRole: any, productId: number, overrides: Record<string, unknown> = {}) {
  const ctx = await asRole("PLM_MANAGER");
  const res = await ctx.post(`/api/products/${productId}/change-requests`, {
    data: {
      productId,
      title: `Customization coverage CR ${SUFFIX}-${Math.random().toString(36).slice(2)}`,
      description: "Playwright customization-coverage suite",
      reason: "Routine update",
      impact: "Low",
      ...overrides,
    },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

test.describe("Gate 1 -- extensions registry (read-only visibility)", () => {
  test("ADMIN can list deployed ChangeRequest transition handlers, including all 6 Nordic Snacks handlers", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.get("/api/extensions/change-request-transition-handlers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    const classNames = body.map((h: any) => h.className);
    expect(classNames).toEqual(
      expect.arrayContaining([
        "NordicSnacksAllergenSignOffHandler",
        "NordicSnacksAuditTrailHandler",
        "NordicSnacksCommentOnRejectionHandler",
        "NordicSnacksHighImpactJustificationHandler",
        "NordicSnacksImpactNotesHandler",
        "NordicSnacksMinimumReviewWindowHandler",
      ])
    );
  });

  test("only ADMIN may view the extensions registry", async ({ asRole }) => {
    await expectGuarded(asRole, "get", "/api/extensions/change-request-transition-handlers", ["ADMIN"]);
  });
});

test.describe("Gate 2 -- custom attribute definitions and manifest", () => {
  test("ADMIN can read the manifest and it reflects the migrated batch_no/test_3 attributes", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.get("/api/attribute-definitions/manifest");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.path).not.toBeNull();
    const keys = body.attributes.map((a: any) => a.attributeKey);
    expect(keys).toEqual(expect.arrayContaining(["batch_no", "test_3"]));
  });

  test("ADMIN can list adopted attribute definitions and they carry a real column name", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.get("/api/attribute-definitions");
    expect(res.status()).toBe(200);
    const body = await res.json();
    const batchNo = body.find((d: any) => d.attributeKey === "batch_no");
    expect(batchNo).toBeTruthy();
    expect(batchNo.columnName).toBe("x_batch_no");
    expect(batchNo.dataType).toBe("STRING");
    expect(batchNo.required).toBe(true);
  });

  test("ADMIN can define a new custom attribute and it is immediately visible in the manifest", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const attributeKey = `storage_temp_c_${SUFFIX}`;
    const res = await ctx.post("/api/attribute-definitions", {
      data: { attributeKey, label: "Storage Temperature (C)", dataType: "NUMBER", required: false },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.columnName).toBe(`x_${attributeKey}`);

    const manifestRes = await ctx.get("/api/attribute-definitions/manifest");
    const manifestBody = await manifestRes.json();
    expect(manifestBody.attributes.map((a: any) => a.attributeKey)).toContain(attributeKey);
  });

  test("defining an attribute with a key already in use is rejected", async ({ asRole }) => {
    const ctx = await asRole("ADMIN");
    const res = await ctx.post("/api/attribute-definitions", {
      data: { attributeKey: "batch_no", label: "Duplicate", dataType: "STRING", required: false },
    });
    expect(res.status()).toBe(400);
  });

  test("defining an attribute with a camelCase or otherwise invalid key is rejected", async ({ asRole }) => {
    // app/sdk/attributes.py::_KEY_RE only accepts lower-case letters, digits and
    // underscores starting with a letter -- the physical column name is derived
    // directly from this key, so a Java-style camelCase key (e.g. from a
    // customization repo that hasn't been translated yet) must not silently
    // become a column.
    const ctx = await asRole("ADMIN");
    const res = await ctx.post("/api/attribute-definitions", {
      data: { attributeKey: "batchNumber", label: "camelCase key", dataType: "STRING", required: false },
    });
    expect(res.status()).toBe(400);
  });

  test("only ADMIN may view or define attribute definitions", async ({ asRole }) => {
    await expectGuarded(asRole, "get", "/api/attribute-definitions", ["ADMIN"]);
    await expectGuarded(asRole, "get", "/api/attribute-definitions/manifest", ["ADMIN"]);
    await expectGuarded(asRole, "post", "/api/attribute-definitions", ["ADMIN"], {
      data: { attributeKey: `should_not_be_created_${SUFFIX}`, label: "x", dataType: "STRING", required: false },
    });
  });
});

test.describe("Gate 1 -- NordicSnacksImpactNotesHandler (submit)", () => {
  test("submitting a change request with no impact documented is rejected", async ({ asRole }) => {
    const cr = await createCr(asRole, PLAIN_PRODUCT_ID, { impact: "" });
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/change-requests/${cr.id}/submit`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("must document their impact");
  });
});

test.describe("Gate 1 -- NordicSnacksHighImpactJustificationHandler (submit)", () => {
  test("a change request flagged High impact with a short reason cannot be submitted", async ({ asRole }) => {
    const cr = await createCr(asRole, PLAIN_PRODUCT_ID, { impact: "High", reason: "too short" });
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/change-requests/${cr.id}/submit`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("at least");
  });

  test("a change request flagged High impact with a sufficiently detailed reason can be submitted", async ({ asRole }) => {
    const cr = await createCr(asRole, PLAIN_PRODUCT_ID, {
      impact: "High",
      reason: "This changes the finished-product recipe ratios and needs full re-validation.",
    });
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/change-requests/${cr.id}/submit`);
    expect(res.status()).toBe(200);
  });

  test("any change request touching an allergen-flagged finished product needs a detailed reason, even with Low impact", async ({ asRole }) => {
    const cr = await createCr(asRole, ALLERGEN_PRODUCT_ID, { impact: "Low", reason: "minor tweak" });
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/change-requests/${cr.id}/submit`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("at least");
  });
});

test.describe("Gate 1 -- NordicSnacksCommentOnRejectionHandler (decide/reject)", () => {
  test("rejecting a change request without a decision comment is rejected", async ({ asRole }) => {
    const cr = await createCr(asRole, PLAIN_PRODUCT_ID);
    const ctx = await asRole("PLM_MANAGER");
    await ctx.post(`/api/change-requests/${cr.id}/submit`);
    const res = await ctx.post(`/api/change-requests/${cr.id}/decide`, { data: decisionBody(false, "") });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("decision comment is required");
  });

  test("rejecting with a decision comment succeeds", async ({ asRole }) => {
    const cr = await createCr(asRole, PLAIN_PRODUCT_ID);
    const ctx = await asRole("PLM_MANAGER");
    await ctx.post(`/api/change-requests/${cr.id}/submit`);
    const res = await ctx.post(`/api/change-requests/${cr.id}/decide`, { data: decisionBody(false, "Not needed right now") });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("REJECTED");
  });
});

test.describe("Gate 1 -- NordicSnacksAllergenSignOffHandler (decide/approve)", () => {
  test("approving a change request on an allergen-flagged product without the QA sign-off token is rejected", async ({ asRole }) => {
    const cr = await createCr(asRole, ALLERGEN_PRODUCT_ID, {
      reason: "This changes the finished-product recipe ratios and needs full re-validation.",
    });
    const ctx = await asRole("PLM_MANAGER");
    await ctx.post(`/api/change-requests/${cr.id}/submit`);
    const res = await ctx.post(`/api/change-requests/${cr.id}/decide`, { data: decisionBody(true, "Looks fine") });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("ALLERGEN-REVIEWED");
  });

  // Note: there is no positive ("approved with the sign-off token") test here.
  // NordicSnacksMinimumReviewWindowHandler also vetoes any approval within 4
  // hours of ChangeRequest.requested_at, and every change request created by
  // this suite is approved (if at all) within seconds of being created -- so
  // an approval attempt made with the sign-off token present would still be
  // rejected, just for the review-window reason instead. Exercising the
  // allowed path for real would need either a seed CR whose requested_at is
  // already >4h in the past, or a way to fast-forward it in the test setup.
});

test.describe("Gate 1 -- NordicSnacksMinimumReviewWindowHandler (decide/approve)", () => {
  test("approving a change request less than 4 hours after it was requested is rejected", async ({ asRole }) => {
    const cr = await createCr(asRole, PLAIN_PRODUCT_ID);
    const ctx = await asRole("PLM_MANAGER");
    await ctx.post(`/api/change-requests/${cr.id}/submit`);
    const res = await ctx.post(`/api/change-requests/${cr.id}/decide`, { data: decisionBody(true, "Approved") });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.detail).toContain("4-hour review window");
  });

  // This also means the pre-existing happy-path test "PLM_MANAGER can approve
  // the change request" in change-requests.spec.ts will start failing once
  // this handler is actually loaded (it approves immediately after creation).
  // That test will need a >4h-old seed change request, or this handler's
  // window needs to be reduced for the test environment -- tracked here
  // rather than silently reconciled, since it's a real behavioral consequence
  // of wiring the customization repo in, not a test bug.
});

test.describe.skip("Gate 1 -- NordicSnacksAuditTrailHandler (after_transition)", () => {
  // Not testable through the HTTP API as it stands: the handler logs via
  // audit_service.log_action(entity_type="ChangeRequest", entity_id=cr.id),
  // fired on a background thread into its own DB session (app/services/
  // audit_service.py::_fire_and_forget). The only exposed audit endpoint,
  // GET /api/products/{id}/audit-history (app/api/routers/products.py), filters
  // on entity_type="Product" -- it can never surface a ChangeRequest-entity
  // audit row. There is currently no API route that calls
  // audit_service.get_history(db, cr_id, "ChangeRequest") to expose these
  // entries. Skipped rather than asserted against the database directly,
  // which would break this suite's black-box, HTTP-only design.
  test("submitting a change request writes a Nordic Snacks audit entry", async () => {});
});
