/**
 * Single source of truth for everything that differs between the two backends:
 * base URLs, seed users, and the handful of known request/response contract
 * differences uncovered while mapping the two APIs (health path, change-request
 * decide body shape). Specs should read from here rather than branching on
 * `process.env.BACKEND` inline.
 */

export type Backend = "java" | "python";

export const BACKEND: Backend = process.env.BACKEND === "java" ? "java" : "python";

export const BASE_URL = BACKEND === "java" ? "http://localhost:8080" : "http://localhost:8000";

export const SEED_PASSWORD = "Passw0rd!";

export const ROLES = ["ADMIN", "PLM_MANAGER", "QUALITY_MANAGER", "PURCHASING", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const SEED_USERS: Record<Role, string> = {
  ADMIN: "admin",
  PLM_MANAGER: "plmmanager",
  QUALITY_MANAGER: "quality",
  PURCHASING: "purchasing",
  VIEWER: "viewer",
};

export const tokenFilePath = `results/.tokens.${BACKEND}.json`;

// Seed fixture data present in both databases (from V1__init.sql / V2__plm_expansion.sql).
export const SEED = {
  rawMaterialIds: [1, 2, 3, 4, 5, 6, 7, 8],
  brownieProductId: 9, // FP-001, FINISHED_PRODUCT, DRAFT, has formulaExpression
  ganacheProductId: 10, // SF-001, SEMI_FINISHED, DRAFT
  supplierIds: [1, 2, 3],
};

// --- Known cross-backend divergences -------------------------------------

// Java exposes Spring Boot Actuator; Python exposes plain health/info routes.
export const paths = {
  health: BACKEND === "java" ? "/api/actuator/health" : "/api/health",
  info: BACKEND === "java" ? "/api/actuator/info" : "/api/info",
};

// Java's ChangeRequestController#decide takes {approve: boolean, comment?}.
// Python's DecisionRequest takes {status: string, decisionComment?} where
// status.upper() in ("APPROVED","TRUE","YES") is treated as approval.
export function decisionBody(approve: boolean, comment?: string): Record<string, unknown> {
  if (BACKEND === "java") {
    return { approve, comment };
  }
  return { status: approve ? "APPROVED" : "REJECTED", decisionComment: comment };
}

// Java's NonConformanceController accepts an optional qualityCheckId on create;
// Python's NonConformanceCreateRequest has no such field at all.
export function nonConformanceCreateBody(title: string, description: string, severity: string): Record<string, unknown> {
  return { title, description, severity };
}

// A request with no Authorization header at all is rejected before either
// backend's own role/user logic runs: Spring Security's default access-denied
// path returns 403 in Java; FastAPI's HTTPBearer dependency returns 401 in
// Python. Confirmed by direct testing -- a genuine, if minor, divergence.
export const MISSING_TOKEN_STATUS = BACKEND === "java" ? 403 : 401;

// Java's SecurityConfig has no endpoint-specific rule for POST /products/*/formulate
// or /products/*/quality/run*, so its fallback rule applies (anyRequest ->
// ADMIN/PLM_MANAGER/QUALITY_MANAGER/PURCHASING; only VIEWER is blocked).
// Python's formulation.py/quality.py explicitly narrow these via AdminOrPLM /
// AdminOrQuality. This is a genuine authorization-matrix divergence introduced
// during migration (Python is stricter than Java here), not a test bug --
// tracked explicitly rather than asserted away.
export const ALLOWED_ROLES = {
  formulate: (BACKEND === "java" ? ["ADMIN", "PLM_MANAGER", "QUALITY_MANAGER", "PURCHASING"] : ["ADMIN", "PLM_MANAGER"]) as Role[],
  qualityRun: (BACKEND === "java" ? ["ADMIN", "PLM_MANAGER", "QUALITY_MANAGER", "PURCHASING"] : ["ADMIN", "QUALITY_MANAGER"]) as Role[],
};
