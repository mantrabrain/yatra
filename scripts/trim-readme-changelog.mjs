#!/usr/bin/env node
/**
 * Trim readme.txt's Changelog to fit WordPress.org's limit.
 *
 * w.org accepts at most 5,000 words in the Changelog section and silently
 * truncates anything longer — the plugin still imports, and the only sign is a
 * warning shown to committers after the fact. The repository keeps the full
 * history; this rewrites only the copy that is about to be deployed, keeping
 * the most recent releases and pointing at GitHub for the rest.
 *
 * Run from the deploy workflow, never from `npm run build` — it edits
 * readme.txt in place and should not dirty a working tree.
 *
 *   node scripts/trim-readme-changelog.mjs [--check] [--budget=4500]
 *
 *   --check  report only, change nothing, exit 1 if over budget
 */
import fs from "node:fs";
import path from "node:path";

const README = path.resolve(process.cwd(), "readme.txt");
const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const BUDGET = Number(
  (args.find((a) => a.startsWith("--budget=")) || "--budget=4500").split("=")[1],
);
// w.org's own ceiling. The budget sits under it so a release can add an entry
// without immediately tipping over.
const HARD_LIMIT = 5000;
const FULL_CHANGELOG_URL =
  "https://github.com/mantrabrain/yatra/blob/master/readme.txt";

const words = (s) => s.split(/\s+/).filter(Boolean).length;

const src = fs.readFileSync(README, "utf8");
const start = src.indexOf("== Changelog ==");
if (start === -1) {
  console.error("[trim-readme] No '== Changelog ==' section found.");
  process.exit(1);
}

// The changelog runs until the next top-level section.
const after = src.slice(start + "== Changelog ==".length);
const nextSection = after.search(/\n== (?!Changelog)/);
const changelog =
  nextSection === -1 ? after : after.slice(0, nextSection);
const tail = nextSection === -1 ? "" : after.slice(nextSection);

// Split into [preamble, "= x.y.z =", body, "= ...", body, ...]
const parts = changelog.split(/^(= [^=\n]+ =)[ \t]*$/m);
const preamble = parts[0];
const entries = [];
for (let i = 1; i < parts.length; i += 2) {
  entries.push({ heading: parts[i], body: parts[i + 1] ?? "" });
}

const fullWords = words(changelog);
if (CHECK) {
  const ok = fullWords <= HARD_LIMIT;
  console.log(
    `[trim-readme] Changelog is ${fullWords} words across ${entries.length} release(s); w.org allows ${HARD_LIMIT}.`,
  );
  if (!ok) {
    console.error(
      "[trim-readme] Over the limit — the deploy will trim it. Run without --check to see the result.",
    );
  }
  process.exit(ok ? 0 : 1);
}

if (fullWords <= BUDGET) {
  console.log(
    `[trim-readme] Changelog is ${fullWords} words, within the ${BUDGET}-word budget. Left unchanged.`,
  );
  process.exit(0);
}

const pointer =
  `\nThe full history for older releases is kept with the source: ${FULL_CHANGELOG_URL}\n`;

let running = words(preamble) + words(pointer);
const kept = [];
for (const entry of entries) {
  const cost = words(entry.heading) + words(entry.body);
  if (running + cost > BUDGET) break;
  running += cost;
  kept.push(entry);
}

if (kept.length === 0) {
  console.error(
    "[trim-readme] Even the newest entry exceeds the budget — shorten it by hand.",
  );
  process.exit(1);
}

const rebuilt =
  preamble +
  kept.map((e) => `${e.heading}\n${e.body}`).join("") +
  pointer;

const out =
  src.slice(0, start) + "== Changelog ==" + rebuilt + tail;
fs.writeFileSync(README, out, "utf8");

const finalWords = words(rebuilt);
console.log(
  `[trim-readme] Changelog ${fullWords} -> ${finalWords} words; kept ${kept.length} of ${entries.length} release(s) (${kept
    .map((e) => e.heading.replace(/=/g, "").trim().split(/\s|—/)[0])
    .join(", ")}).`,
);

if (finalWords > HARD_LIMIT) {
  console.error("[trim-readme] Still over the w.org limit — aborting.");
  process.exit(1);
}
