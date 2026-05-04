/**
 * Build includes/fa-free-icon-names.json from Font Awesome Free icon packs (solid + regular).
 * Used by the admin icon picker without bundling every SVG definition in JS.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outFile = join(root, "includes/fa-free-icon-names.json");

const solid = await import("@fortawesome/free-solid-svg-icons");
const regular = await import("@fortawesome/free-regular-svg-icons");

/**
 * @param {Record<string, import('@fortawesome/fontawesome-common-types').IconDefinition>} pack
 */
function iconNamesFromPack(pack) {
  const seen = new Set();
  for (const def of Object.values(pack)) {
    if (def && typeof def === "object" && typeof def.iconName === "string") {
      seen.add(def.iconName);
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

const fas = solid.fas;
const far = regular.far;
if (!fas || !far) {
  console.error("[sync-fa-icon-names] Expected fas / far exports from FA Free packages.");
  process.exit(1);
}

const payload = {
  solid: iconNamesFromPack(fas),
  regular: iconNamesFromPack(far),
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(payload, null, 0) + "\n", "utf8");

console.log(
  `[sync-fa-icon-names] Wrote ${payload.solid.length} solid + ${payload.regular.length} regular names to includes/fa-free-icon-names.json`,
);
