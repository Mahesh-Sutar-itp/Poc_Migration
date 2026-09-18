// Diffs the response-shape samples captured under results/java/*.json and
// results/python/*.json (written by helpers/shape-sample.ts during the two
// test passes) to surface contract drift: fields added, removed, or
// retyped between the two backends for equivalent operations.
const fs = require("fs");
const path = require("path");

function deepEqualPrimitive(a, b) {
  return a === b;
}

function diffKeys(a, b, prefix) {
  const diffs = [];
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

  if (isObj(a) && isObj(b)) {
    const keysA = new Set(Object.keys(a));
    const keysB = new Set(Object.keys(b));
    for (const k of keysA) if (!keysB.has(k)) diffs.push(`${prefix}${k}: present in Java, missing in Python`);
    for (const k of keysB) if (!keysA.has(k)) diffs.push(`${prefix}${k}: present in Python, missing in Java`);
    for (const k of keysA) if (keysB.has(k)) diffs.push(...diffKeys(a[k], b[k], `${prefix}${k}.`));
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length && b.length) diffs.push(...diffKeys(a[0], b[0], `${prefix}[].`));
  } else if (typeof a === "string" && typeof b === "string" && a !== "null" && b !== "null" && !deepEqualPrimitive(a, b)) {
    diffs.push(`${prefix}: type mismatch (java=${a} vs python=${b})`);
  }
  return diffs;
}

const javaDir = path.join("results", "java");
const pythonDir = path.join("results", "python");

let md = "# Response-Shape Parity Report\n\n";

if (!fs.existsSync(javaDir) || !fs.existsSync(pythonDir)) {
  md += "One or both shape-sample directories are missing -- run both backend passes first.\n";
} else {
  const files = fs.readdirSync(javaDir).sort();
  let anyDiff = false;
  for (const f of files) {
    const javaShape = JSON.parse(fs.readFileSync(path.join(javaDir, f), "utf-8"));
    const pythonPath = path.join(pythonDir, f);
    if (!fs.existsSync(pythonPath)) {
      md += `## ${f}\n- No Python sample captured (endpoint likely failing -- see migration-coverage-report.md)\n\n`;
      anyDiff = true;
      continue;
    }
    const pythonShape = JSON.parse(fs.readFileSync(pythonPath, "utf-8"));
    const diffs = diffKeys(javaShape, pythonShape, "");
    if (diffs.length) {
      anyDiff = true;
      md += `## ${f}\n` + diffs.map((d) => `- ${d}`).join("\n") + "\n\n";
    }
  }
  if (!anyDiff) md += "No response-shape differences found across all captured samples.\n";
}

fs.writeFileSync(path.join("results", "parity-report.md"), md);
console.log("Wrote results/parity-report.md");
