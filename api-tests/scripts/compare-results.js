// Merges results/java-results.json and results/python-results.json (Playwright's
// JSON reporter output) into a single migration-coverage markdown report.
const fs = require("fs");
const path = require("path");

function flattenSuite(suite, titlePath, out) {
  for (const spec of suite.specs || []) {
    const title = [...titlePath, spec.title].join(" > ");
    const test = spec.tests?.[0];
    const result = test?.results?.[0];
    out.push({ file: spec.file, title, status: result?.status || "unknown" });
  }
  for (const child of suite.suites || []) {
    flattenSuite(child, [...titlePath, child.title], out);
  }
}

function loadResults(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const out = [];
  for (const suite of raw.suites || []) {
    flattenSuite(suite, [], out);
  }
  return out;
}

const javaPath = path.join("results", "java-results.json");
const pythonPath = path.join("results", "python-results.json");

for (const p of [javaPath, pythonPath]) {
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p} -- run both "BACKEND=java npm test" and "BACKEND=python npm test" first.`);
    process.exit(1);
  }
}

const java = loadResults(javaPath);
const python = loadResults(pythonPath);
const pythonByKey = new Map(python.map((t) => [`${t.file}::${t.title}`, t]));

function verdict(javaStatus, pythonStatus) {
  if (javaStatus !== "passed") return "oracle-test-broken (fix the test, not the app)";
  if (pythonStatus === "passed") return "migrated";
  if (pythonStatus === "unknown") return "missing (test not found on Python run)";
  return "gap";
}

const rows = java.map((jt) => {
  const key = `${jt.file}::${jt.title}`;
  const pt = pythonByKey.get(key);
  return { file: jt.file, title: jt.title, java: jt.status, python: pt ? pt.status : "unknown", verdict: verdict(jt.status, pt?.status) };
});

const total = rows.length;
const migrated = rows.filter((r) => r.verdict === "migrated").length;
const javaPassing = java.filter((t) => t.status === "passed").length;

let md = "# Migration Coverage Report\n\n";
md += `Generated ${new Date().toISOString()}\n\n`;
md += `**${migrated}/${total} test cases pass against the migrated Python backend** `;
md += `(Java reference backend: ${javaPassing}/${java.length} passing).\n\n`;

const byFile = new Map();
for (const row of rows) {
  if (!byFile.has(row.file)) byFile.set(row.file, []);
  byFile.get(row.file).push(row);
}

md += "## Summary by file\n\n| File | Migrated | Total |\n|---|---|---|\n";
for (const [file, fileRows] of byFile) {
  const ok = fileRows.filter((r) => r.verdict === "migrated").length;
  md += `| ${file} | ${ok} | ${fileRows.length} |\n`;
}

md += "\n## Full detail\n\n| File | Test | Java | Python | Verdict |\n|---|---|---|---|---|\n";
for (const row of rows) {
  md += `| ${row.file} | ${row.title} | ${row.java} | ${row.python} | ${row.verdict} |\n`;
}

md += "\n## Known issues NOT covered above (can't be expressed as an HTTP test)\n\n";
md += "These were found during investigation/testing but aren't runnable Playwright assertions, so they don't show up as rows in the table above -- listed here so they aren't lost.\n\n";
md += "- **Alembic migrations can't locate their seed SQL.** `alembic/versions/0001_v1_init.py` and `0002_v2_plm_expansion.py` compute the Java project's SQL directory as `Path(__file__).resolve().parents[3] / \"formcraft-plm\" / \"formcraft-plm\" / ...`, which resolves one directory too high both on the host and in the app container as currently built/shipped. `alembic upgrade head` does not work as-is; this repo's Postgres has to be seeded by applying `V1__init.sql`/`V2__plm_expansion.sql` directly. This is a deployment/tooling failure, not an HTTP endpoint, so no Playwright test can assert it -- see api-tests/README.md for the workaround used to seed the DB for this suite.\n";
md += "- **Non-conformance-to-quality-check link is unreachable, but only partially testable.** Java lets a non-conformance be raised against a specific QualityCheck via an optional `qualityCheckId`; Python's schema/router drop that field entirely (tested and confirmed as a gap above, via an invalid id producing 404 on Java vs 201 on Python). Whether a *valid* qualityCheckId actually gets linked can't be asserted here either way, though: neither backend's non-conformance response schema exposes the link back to the client, so a valid-id case has no observable difference to assert on.\n";

fs.writeFileSync(path.join("results", "migration-coverage-report.md"), md);
console.log(`Wrote results/migration-coverage-report.md (${migrated}/${total} migrated)`);
