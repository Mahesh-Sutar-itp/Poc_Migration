import { test, expect } from "../fixtures/api";
import { SEED } from "../helpers/backend-config";

/**
 * Regression tests for concrete bugs/divergences discovered while building
 * this suite. Unlike the rest of the suite -- which is written to pass
 * identically on both backends and measure endpoint coverage -- each test
 * here asserts the Java (reference) backend's actual, real behavior and is
 * EXPECTED TO FAIL against the migrated Python backend until the underlying
 * app issue is fixed. Do not "fix" these tests to pass; if one starts
 * passing, the underlying app bug has been fixed and the test (and this
 * comment) should be deleted or updated to reflect that.
 */
const SUFFIX = Date.now();

test.describe("known divergences (expected to fail on Python until fixed)", () => {
  test("creating a change request does not require a redundant productId in the body", async ({ asRole }) => {
    // Real user report: POST /api/products/3/change-requests with a normal
    // {title, description, reason, impact} body -> 422 "productId: Field
    // required". The product is already identified by the URL path
    // (/api/products/{product_id}/change-requests); Java's ChangeRequestController
    // doesn't need it repeated in the body. Python's ChangeRequestCreateRequest
    // (app/schemas/change_request.py) declares productId as a required field,
    // so any client that doesn't redundantly repeat the path param in the body
    // -- which is every real client, including this suite's other change-requests
    // tests before this was discovered -- gets rejected.
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${SEED.ganacheProductId}/change-requests`, {
      data: { title: `Known-divergence CR ${SUFFIX}`, description: "x", reason: "x", impact: "x" },
    });
    expect(res.status()).toBe(201);
  });

  test("change-request decide accepts Java's {approve, comment} body shape", async ({ asRole }) => {
    // Java: `record DecisionRequest(boolean approve, String comment) {}`
    // (ChangeRequestController.java) -- {approve: boolean, comment?: string}.
    // Python: `class DecisionRequest(BaseModel): status: str; decisionComment:
    // str | None = None` (app/schemas/change_request.py) -- a completely
    // different, required field name (`status`, not `approve`). A client
    // written against the original Java API sends a body Python's schema
    // validation rejects outright.
    const ctx = await asRole("PLM_MANAGER");
    const createRes = await ctx.post(`/api/products/${SEED.ganacheProductId}/change-requests`, {
      data: { productId: SEED.ganacheProductId, title: `Known-divergence CR decide ${SUFFIX}`, description: "x", reason: "x", impact: "x" },
    });
    const cr = await createRes.json();
    await ctx.post(`/api/change-requests/${cr.id}/submit`);

    const decideRes = await ctx.post(`/api/change-requests/${cr.id}/decide`, { data: { approve: true, comment: "Looks good" } });
    expect(decideRes.status()).toBe(200);
    const body = await decideRes.json();
    expect(body.status).toBe("APPROVED");
  });

  test("QUALITY_MANAGER can run the formulation chain, matching Java's permission fallback", async ({ asRole }) => {
    // Java's SecurityConfig (src/main/java/fr/formcraft/config/SecurityConfig.java)
    // has no endpoint-specific rule for POST /products/*/formulate, so its
    // generic fallback applies: .anyRequest().hasAnyRole(ADMIN, PLM_MANAGER,
    // QUALITY_MANAGER, PURCHASING). Python's formulation.py explicitly narrows
    // this endpoint to AdminOrPLM, so a QUALITY_MANAGER user -- who could run
    // formulation in the original app -- gets 403 in the migrated one.
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/products/${SEED.brownieProductId}/formulate`);
    expect(res.status()).toBe(200);
  });

  test("PURCHASING can run quality checks, matching Java's permission fallback", async ({ asRole }) => {
    // Same class of issue as the formulate case above, for POST
    // /products/*/quality/run-all: Java's fallback rule allows PURCHASING,
    // Python's quality.py explicitly narrows the endpoint to AdminOrQuality.
    const ctx = await asRole("PURCHASING");
    const res = await ctx.post(`/api/products/${SEED.brownieProductId}/quality/run-all`);
    expect(res.status()).toBe(200);
  });

  test("formulate response includes Java's flat productId/chainId/result fields", async ({ asRole }) => {
    // Java: {result, chainId, productName, productId} (flat, from
    // FormulationController). Python: {product: {id, code, name}, latestResult}
    // (nested, entirely different field names, from app/api/routers/formulation.py).
    // A client written against the original response shape can't read the
    // migrated one at all.
    const ctx = await asRole("PLM_MANAGER");
    const res = await ctx.post(`/api/products/${SEED.brownieProductId}/formulate`);
    const body = await res.json();
    expect(body).toHaveProperty("productId", SEED.brownieProductId);
    expect(body).toHaveProperty("chainId");
    expect(body).toHaveProperty("result");
  });

  test("a request with no Authorization header is rejected with 403, matching Java", async ({ asRole }) => {
    // Java (Spring Security's default access-denied path, no explicit
    // AuthenticationEntryPoint configured) returns 403 for a request with no
    // Authorization header at all. Python (FastAPI's HTTPBearer dependency in
    // app/api/deps.py) returns 401 for the same request. Confirmed by direct
    // testing against both live backends. A client that branches on status
    // code (401 -> redirect to login, 403 -> show "forbidden") behaves
    // differently against the two APIs for the exact same unauthenticated request.
    const ctx = await asRole("ANON");
    const res = await ctx.get("/api/reports/dashboard-summary");
    expect(res.status()).toBe(403);
  });

  test("product list pagination envelope matches Spring Data's Page<> shape", async ({ asRole }) => {
    // Java returns Spring Data's full Page<> JSON (content, totalElements,
    // totalPages, number, size, numberOfElements, first, last, empty, pageable,
    // sort). Python's hand-rolled envelope (app/api/routers/products.py
    // list_products) only returns a subset (content, totalElements, totalPages,
    // number, size). A client that checks `last` to decide whether to keep
    // paginating, or reads `pageable`/`sort`, breaks against the migrated API.
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/products?page=0&size=5");
    const body = await res.json();
    expect(body).toHaveProperty("first");
    expect(body).toHaveProperty("last");
    expect(body).toHaveProperty("empty");
    expect(body).toHaveProperty("numberOfElements");
    expect(body).toHaveProperty("pageable");
  });

  test("product stats use lowercase camelCase state keys, matching Java", async ({ asRole }) => {
    // Java: GET /products/stats -> {draft, inValidation, validated, archived}
    // (ProductController#stats builds this map with lowercase custom keys).
    // Python: {DRAFT, IN_VALIDATION, VALIDATED, ARCHIVED} (app/api/routers/
    // products.py builds it from `s.value for s in ProductState`, i.e. the raw
    // enum member names). Same counts, different key casing -- a client
    // reading body.draft gets undefined against the migrated API.
    const ctx = await asRole("VIEWER");
    const res = await ctx.get("/api/products/stats");
    const body = await res.json();
    expect(body).toHaveProperty("draft");
    expect(body).toHaveProperty("inValidation");
    expect(body).toHaveProperty("validated");
    expect(body).toHaveProperty("archived");
  });

  test("raising a non-conformance with a nonexistent qualityCheckId is rejected", async ({ asRole }) => {
    // Java: NonConformanceController accepts an optional qualityCheckId and
    // NonConformanceServiceImpl#raise validates it --
    // `qualityCheckRepository.findById(qualityCheckId).orElseThrow(() -> new
    // EntityNotFoundException("QualityCheck", qualityCheckId))` -- so a bad id
    // is rejected with 404. Python's NonConformanceCreateRequest (app/schemas/
    // non_conformance.py) never declares a qualityCheckId field at all, and
    // the router (app/api/routers/non_conformances.py raise_nc) never reads
    // one from the body even though non_conformance_service.raise_nc has a
    // quality_check_id parameter ready to receive it. The field is silently
    // dropped by Pydantic's default extra="ignore" behavior, so this succeeds
    // regardless of whether the id is real -- the whole
    // link-an-NC-to-a-quality-check feature is unreachable through the API.
    const ctx = await asRole("QUALITY_MANAGER");
    const res = await ctx.post(`/api/products/${SEED.brownieProductId}/non-conformances`, {
      data: { title: `Known-divergence NC ${SUFFIX}`, description: "x", severity: "MINOR", qualityCheckId: 999999999 },
    });
    expect(res.status()).toBe(404);
  });
});
