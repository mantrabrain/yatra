/**
 * Copy Font Awesome Free CSS + webfonts into assets/vendor/fontawesome for WordPress enqueue
 * (paths in all.min.css are ../webfonts/*.woff2).
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcRoot = join(root, "node_modules/@fortawesome/fontawesome-free");
const destRoot = join(root, "assets/vendor/fontawesome");

if (!existsSync(srcRoot)) {
  console.error(
    "[sync-fontawesome-vendor] Missing package @fortawesome/fontawesome-free. Run npm install.",
  );
  process.exit(1);
}

mkdirSync(join(destRoot, "css"), { recursive: true });
mkdirSync(join(destRoot, "webfonts"), { recursive: true });

cpSync(join(srcRoot, "css/all.min.css"), join(destRoot, "css/all.min.css"));
cpSync(join(srcRoot, "webfonts"), join(destRoot, "webfonts"), { recursive: true });

console.log("[sync-fontawesome-vendor] Copied all.min.css + webfonts to assets/vendor/fontawesome/");
