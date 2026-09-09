import fs from "fs";
import path from "path";
import { BACKEND } from "./backend-config";

/**
 * Reduces a JSON value to its structural "shape": key names and primitive
 * type names, recursively, with arrays reduced to their first element.
 * Two backends' shape dumps for the same test name can be diffed without
 * false positives from differing ids, timestamps, or row ordering.
 */
function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.length ? [shapeOf(value[0])] : [];
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      out[key] = shapeOf((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  if (value === null) return "null";
  return typeof value;
}

/** Saves the shape of a JSON response body under results/<backend>/<name>.json for later parity diffing. */
export function saveShapeSample(name: string, body: unknown): void {
  const dir = path.join("results", BACKEND);
  fs.mkdirSync(dir, { recursive: true });
  const safeName = name.replace(/[^a-z0-9_-]/gi, "_");
  fs.writeFileSync(path.join(dir, `${safeName}.json`), JSON.stringify(shapeOf(body), null, 2));
}
