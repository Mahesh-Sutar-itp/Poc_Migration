package fr.formcraft.common.constants;

/**
 * Global repository constants for FormCraft PLM.
 * Mirrors beCPG's RepoConsts pattern.
 */
public final class RepoConsts {

    private RepoConsts() {
        // Utility class — not instantiable
    }

    // ── Product states ──────────────────────────────────────────────────────
    public static final String STATE_DRAFT         = "DRAFT";
    public static final String STATE_IN_VALIDATION = "IN_VALIDATION";
    public static final String STATE_VALIDATED     = "VALIDATED";
    public static final String STATE_ARCHIVED      = "ARCHIVED";

    // ── Formulation chain IDs ───────────────────────────────────────────────
    public static final String DEFAULT_CHAIN_ID    = "default";
    public static final String FAST_CHAIN_ID       = "fastFormulationChain";

    // ── Formulation result statuses ─────────────────────────────────────────
    public static final String FORMULATION_OK      = "OK";
    public static final String FORMULATION_ERROR   = "ERROR";
    public static final String FORMULATION_WARNING = "WARNING";

    // ── NutriScore grades ───────────────────────────────────────────────────
    public static final String NUTRI_SCORE_A = "A";
    public static final String NUTRI_SCORE_B = "B";
    public static final String NUTRI_SCORE_C = "C";
    public static final String NUTRI_SCORE_D = "D";
    public static final String NUTRI_SCORE_E = "E";

    // ── Allergen types ──────────────────────────────────────────────────────
    public static final String ALLERGEN_GLUTEN     = "GLUTEN";
    public static final String ALLERGEN_EGGS       = "EGGS";
    public static final String ALLERGEN_MILK       = "MILK";
    public static final String ALLERGEN_NUTS       = "NUTS";
    public static final String ALLERGEN_SOY        = "SOY";
    public static final String ALLERGEN_FISH       = "FISH";
    public static final String ALLERGEN_SHELLFISH  = "SHELLFISH";
    public static final String ALLERGEN_SESAME     = "SESAME";

    // ── Audit actions ───────────────────────────────────────────────────────
    public static final String AUDIT_CREATE        = "CREATE";
    public static final String AUDIT_UPDATE        = "UPDATE";
    public static final String AUDIT_DELETE        = "DELETE";
    public static final String AUDIT_FORMULATE     = "FORMULATE";
    public static final String AUDIT_TRANSITION    = "WORKFLOW_TRANSITION";
    public static final String AUDIT_QUALITY_CHECK = "QUALITY_CHECK";

    // ── Quality check types ─────────────────────────────────────────────────
    public static final String CHECK_COMPOSITION   = "COMPOSITION_VALIDATION";
    public static final String CHECK_ALLERGEN      = "ALLERGEN_CHECK";
    public static final String CHECK_NUTRIENT      = "NUTRIENT_COMPLIANCE";
    public static final String CHECK_COST          = "COST_VALIDATION";

    // ── Batch processing ────────────────────────────────────────────────────
    public static final int    DEFAULT_PAGE_SIZE   = 20;
    public static final int    MAX_PAGE_SIZE       = 100;

    // ── Report types ────────────────────────────────────────────────────────
    public static final String REPORT_PRODUCT_SHEET   = "PRODUCT_SHEET";
    public static final String REPORT_NUTRITION_FACTS = "NUTRITION_FACTS";
    public static final String REPORT_ALLERGEN_SUMMARY = "ALLERGEN_SUMMARY";
}
