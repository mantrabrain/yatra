#!/usr/bin/env node
/**
 * extract-js-pot.mjs — emit a .pot file from the React TypeScript source.
 *
 * Why this exists:
 *
 *   `wp i18n make-pot` only scans .js / .jsx / .mjs files (per WP-CLI
 *   2.12's documented capability). The Yatra admin React source is
 *   written in TypeScript, mostly .tsx, so make-pot misses every
 *   localised string — "Recent Bookings", "Refunds", "Today's Brief",
 *   "Top Destinations", etc. The previous compensating path was to
 *   `babel`-extract from the built bundles, but Vite's scope-hoisting
 *   renames the local `__` wrapper (from resources/js/lib/i18n.ts) to
 *   `__$1` to disambiguate from `@wordpress/i18n.__`, and
 *   `@wordpress/babel-plugin-makepot` keys off the literal function
 *   name — so it sees `_("Refunds","yatra")` (post-aliasing) and
 *   silently produces nothing.
 *
 *   This script uses the TypeScript compiler API to parse .ts/.tsx
 *   directly and walks the AST for gettext-shaped CallExpressions.
 *   The TS compiler is already a project dep (used for type-check),
 *   so no new node_modules.
 *
 * Output:
 *
 *   i18n/languages/yatra-js.pot
 *
 *   The existing `npm run makepot` script then `--merge`s this into
 *   the main yatra.pot. Everything stays compatible with the WP-CLI
 *   downstream tooling — including locale-specific .po/.mo emit later.
 *
 * Functions recognised:
 *
 *   __(msgid, domain)
 *   _x(msgid, msgctxt, domain)
 *   _n(msgid, msgid_plural, n, domain)
 *   _nx(msgid, msgid_plural, n, msgctxt, domain)
 *
 *   Calls whose domain literal isn't "yatra" are ignored (matches
 *   `wp i18n make-pot --domain=yatra` behaviour). Calls where the
 *   domain isn't a literal at all are also ignored — they aren't
 *   gettext-style and would inflate the .pot with garbage entries.
 *
 * Source-line tracking:
 *
 *   `#: path/to/file.tsx:LINE` per entry, matching the format
 *   WP-CLI uses so downstream tools (Loco Translate, Poedit) link
 *   back to source.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = dirname(__dirname);
const SOURCE_ROOT = join(PLUGIN_ROOT, "resources/js");
const OUTPUT_FILE = join(PLUGIN_ROOT, "i18n/languages/yatra-js.pot");
const DOMAIN = "yatra";

/**
 * Bundle that resources/js/**.tsx compiles into. This is the path
 * WordPress will hash (md5(handle src)) when looking up the JSON
 * translation file at runtime, so emitting it as the `#:` reference
 * here makes any translation tool — Loco, WP-CLI make-json, Poedit,
 * etc. — produce a JSON named with the SAME hash. WordPress finds it
 * natively, with zero custom plugin code.
 *
 * If a future build introduces a second admin bundle, point the
 * matching source-file glob at it here.
 */
const ADMIN_BUNDLE = "assets/admin/dist/js/app.js";

/**
 * Directories under resources/js that this extractor must NOT scan.
 *
 * `resources/js/blocks/**` compiles to standalone Gutenberg block
 * bundles at `assets/dist/blocks/*.js` (one per block). `wp i18n
 * make-pot` natively scans .js files, so it already picks up those
 * gettext calls from the compiled bundles — complete with their
 * `/* translators: *​/` comments. If WE also extract them here we
 * end up writing a duplicate entry with a different `#.` comment
 * block ("#. Source: …" vs wp-cli's "#. translators: …"), which
 * `wp i18n make-pot --merge` flags as a "has N different translator
 * comments" warning. Skipping the source dir avoids the conflict
 * without losing coverage (wp-cli still extracts from the bundles).
 */
const SKIP_DIRS = new Set(["blocks"]);

/** Recursively yield every .ts / .tsx file under root, skipping node_modules. */
function* walk(root, depth = 0) {
  const entries = readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    // Only honour SKIP_DIRS at the top level of SOURCE_ROOT — a
    // file named "blocks" two folders deep is fine to walk.
    if (depth === 0 && SKIP_DIRS.has(entry.name)) continue;
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full, depth + 1);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (ext === ".ts" || ext === ".tsx" || ext === ".jsx" || ext === ".js") {
        yield full;
      }
    }
  }
}

/**
 * Read the literal string out of an AST argument node, OR null if it
 * isn't a string literal. We intentionally do NOT evaluate template
 * literals or string concatenation — gettext extractors universally
 * skip those, since the runtime value can't be inferred at extraction
 * time. Callers are expected to keep the msgid as a plain literal.
 */
function literalString(node) {
  if (!node) return null;
  if (
    node.kind === ts.SyntaxKind.StringLiteral ||
    node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
  ) {
    return node.text;
  }
  return null;
}

/**
 * Escape a string for inclusion inside a .pot msgid/msgstr.
 * Mirrors the rules in gettext .po format:
 *   \  → \\
 *   "  → \"
 *   \n → \n  (literal "\" + "n", not a newline)
 *   \t → \t
 */
function potEscape(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r");
}

// entries: key → entry. Key is "ctx\x04msgid" when msgctxt present, else
// just "msgid" — same disambiguation gettext uses internally.
const entries = new Map();

function addEntry({ msgid, msgctxt, plural, file, line, translatorComment }) {
  if (!msgid) return;
  const key = (msgctxt ? msgctxt + "\x04" : "") + msgid;
  let e = entries.get(key);
  if (!e) {
    e = {
      msgid,
      msgctxt: msgctxt || null,
      plural: plural || null,
      // `references`: what goes in `#:` — kept as a list because
      // some setups produce two-bundle outputs. For now every
      // resources/js/**.tsx call shares the admin bundle so we
      // store a single canonical reference.
      references: [],
      // `sourceLocations`: the human-readable origin sites,
      // emitted as `#` (translator-note) lines so translators see
      // exactly which .tsx file the string came from without
      // breaking the bundle-hash that `#:` provides.
      sourceLocations: [],
      // `translatorComments`: `// translators:` and `/* translators: */`
      // hints found IMMEDIATELY ABOVE the gettext call in source.
      // Emitted as `#. translators:` so they match the comments
      // wp-cli extracts from sibling .js/.php files for the same
      // msgid — if our extracted comment differs from the wp-cli
      // one we'd get a "N different translator comments" warning
      // on merge, which is exactly the conflict mode this map
      // is designed to avoid. De-duplicated to one entry per
      // distinct comment text.
      translatorComments: [],
    };
    entries.set(key, e);
  }
  // `#:` reference — points at the BUNDLE, not the source file.
  // Translation tools hash this to name the .json output; bundle
  // path = bundle hash = WordPress's loader finds it natively.
  if (!e.references.includes(ADMIN_BUNDLE)) e.references.push(ADMIN_BUNDLE);
  const srcLoc = `${file}:${line}`;
  if (!e.sourceLocations.includes(srcLoc)) e.sourceLocations.push(srcLoc);
  if (translatorComment && !e.translatorComments.includes(translatorComment)) {
    e.translatorComments.push(translatorComment);
  }
  // Prefer keeping a plural form if we see one — later identical
  // singular calls don't drop the plural metadata.
  if (plural && !e.plural) e.plural = plural;
}

/**
 * Extract the translator hint (if any) attached to a gettext-shaped
 * CallExpression. We walk back from the call's full-start position
 * through every leading comment range (both line and block forms)
 * and keep the LAST one whose normalized text starts with
 * "translators:". This mirrors how `wp i18n make-pot` and Babel's
 * makepot plugin behave — they associate the most-recently-seen
 * translator note with the immediately-following gettext call.
 *
 * Returns the comment body WITH the `translators:` prefix stripped,
 * because the consumer will re-prefix it as `#. translators: ...`.
 */
function extractTranslatorComment(node, sourceText) {
  // Check the gettext call's own leading trivia first, then walk
  // up through wrapping CallExpressions (typically `sprintf(__())`)
  // — the translator hint is conventionally placed immediately
  // above the OUTER call. Stop at the first wrapper whose leading
  // trivia carries a `translators:` comment.
  let current = node;
  for (let depth = 0; depth < 3 && current; depth++) {
    const ranges =
      ts.getLeadingCommentRanges(sourceText, current.getFullStart()) || [];
    let hint = null;
    for (const r of ranges) {
      let body;
      if (r.kind === ts.SyntaxKind.SingleLineCommentTrivia) {
        body = sourceText.slice(r.pos + 2, r.end).trim();
      } else if (r.kind === ts.SyntaxKind.MultiLineCommentTrivia) {
        body = sourceText.slice(r.pos + 2, r.end - 2).trim();
        body = body
          .split(/\r?\n/)
          .map((l) => l.replace(/^\s*\*\s?/, "").trim())
          .filter(Boolean)
          .join(" ");
      } else {
        continue;
      }
      const m = /^translators:\s*(.+)$/i.exec(body);
      if (m) hint = m[1].trim();
    }
    if (hint) return hint;
    // Climb to the wrapping CallExpression if there is one. Anything
    // else (binary expression, JSX, etc.) means we've left the
    // sprintf(__()) pattern — bail rather than scan unrelated trivia.
    if (
      current.parent &&
      current.parent.kind === ts.SyntaxKind.CallExpression &&
      current.parent.arguments &&
      current.parent.arguments.includes(current)
    ) {
      current = current.parent;
    } else {
      break;
    }
  }
  return null;
}

function processFile(absPath) {
  const text = readFileSync(absPath, "utf8");
  const relPath = relative(PLUGIN_ROOT, absPath).replace(/\\/g, "/");
  const isTsx = absPath.endsWith(".tsx");
  const kind = isTsx
    ? ts.ScriptKind.TSX
    : absPath.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : absPath.endsWith(".tsx") || absPath.endsWith(".ts")
        ? ts.ScriptKind.TS
        : ts.ScriptKind.JS;

  const source = ts.createSourceFile(
    absPath,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    kind,
  );

  function visit(node) {
    if (node.kind === ts.SyntaxKind.CallExpression) {
      const callee = node.expression;
      // Only consider unqualified identifier calls — `__("…")`,
      // `_n("…","…",n)`. Member calls like `wp.i18n.__("…")` are
      // either a) emitted by code we don't ship localised, or b)
      // intentional fallback paths that resolve to the same string
      // already extracted from the wrapper definition.
      if (callee && callee.kind === ts.SyntaxKind.Identifier) {
        const name = callee.text;
        const { line: zline } = source.getLineAndCharacterOfPosition(
          node.getStart(source),
        );
        const line = zline + 1;
        const a = node.arguments;
        const translatorComment = extractTranslatorComment(node, text);

        if (name === "__" && a.length >= 1) {
          const msgid = literalString(a[0]);
          const domain = a.length >= 2 ? literalString(a[1]) : DOMAIN;
          if (msgid && (domain === DOMAIN || domain === null)) {
            addEntry({ msgid, file: relPath, line, translatorComment });
          }
        } else if (name === "_x" && a.length >= 2) {
          const msgid = literalString(a[0]);
          const msgctxt = literalString(a[1]);
          const domain = a.length >= 3 ? literalString(a[2]) : DOMAIN;
          if (msgid && msgctxt && (domain === DOMAIN || domain === null)) {
            addEntry({ msgid, msgctxt, file: relPath, line, translatorComment });
          }
        } else if (name === "_n" && a.length >= 3) {
          const msgid = literalString(a[0]);
          const plural = literalString(a[1]);
          // a[2] is the number — runtime, skip
          const domain = a.length >= 4 ? literalString(a[3]) : DOMAIN;
          if (msgid && plural && (domain === DOMAIN || domain === null)) {
            addEntry({ msgid, plural, file: relPath, line, translatorComment });
          }
        } else if (name === "_nx" && a.length >= 4) {
          const msgid = literalString(a[0]);
          const plural = literalString(a[1]);
          const msgctxt = literalString(a[3]);
          const domain = a.length >= 5 ? literalString(a[4]) : DOMAIN;
          if (
            msgid &&
            plural &&
            msgctxt &&
            (domain === DOMAIN || domain === null)
          ) {
            addEntry({
              msgid,
              plural,
              msgctxt,
              file: relPath,
              line,
              translatorComment,
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

const start = Date.now();
let filesScanned = 0;
for (const file of walk(SOURCE_ROOT)) {
  filesScanned++;
  try {
    processFile(file);
  } catch (err) {
    // Don't abort the whole extraction over one bad file — log it
    // and continue. WP-CLI's i18n make-pot has the same behaviour.
    console.warn(`extract-js-pot: failed on ${file}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Emit .pot
//
// Header is intentionally minimal — npm run makepot then merges this
// into yatra.pot via `wp i18n make-pot --merge`, which uses the main
// pot's headers as source of truth. Anything we put here would be
// stripped during the merge anyway.
// ---------------------------------------------------------------------------

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
const lines = [];
lines.push("# Yatra React admin — JS source extraction.");
lines.push("# Generated by scripts/extract-js-pot.mjs — do not edit by hand.");
lines.push("msgid \"\"");
lines.push("msgstr \"\"");
lines.push('"Content-Type: text/plain; charset=UTF-8\\n"');
lines.push('"X-Generator: yatra/extract-js-pot.mjs\\n"');
lines.push("");

// Stable sort: alphabetical msgid (ctxt-prefixed when present) so
// diff-noise between runs stays minimal even if file iteration order
// changes between OSes.
const sorted = [...entries.values()].sort((a, b) => {
  const ka = (a.msgctxt ? a.msgctxt + "\x04" : "") + a.msgid;
  const kb = (b.msgctxt ? b.msgctxt + "\x04" : "") + b.msgid;
  return ka < kb ? -1 : ka > kb ? 1 : 0;
});

for (const entry of sorted) {
  // `#. translators:` — extracted hints (`// translators:` or
  // `/* translators: */`) attached to the corresponding gettext
  // call in source. Must come BEFORE the `# Source:` note so
  // gettext readers (which key off contiguous `#.` blocks) pick
  // them up as the canonical translator comment. Emitting them
  // here is what allows wp-cli's `--merge` step to see the SAME
  // text the .js/.php scanners produced for the same msgid, so
  // shared strings don't trigger "N different translator
  // comments" warnings. Multiple distinct hints collapse to one
  // line each (deduped in addEntry).
  for (const hint of entry.translatorComments) {
    lines.push(`#. translators: ${hint}`);
  }
  // Source-location note. Uses `#` (translator-note prefix) NOT `#.`
  // (extracted-comment prefix) on purpose: when `wp i18n make-pot
  // --merge` consolidates our pot with the main one, ANY `#.` line
  // we emit is compared against `#. translators:` lines wp-cli
  // extracted from sibling files (booking.js, single-trip.js, …),
  // and ANY divergence becomes a "string has N different translator
  // comments" warning. `#` lines are translator-private notes and
  // are NOT compared for equality during merge, so we keep the
  // per-.tsx provenance for Poedit/Loco without poisoning the
  // extracted-comment slot. Emitted as a SINGLE line (comma-joined)
  // so we never accidentally fan out into many `#` lines either.
  if (entry.sourceLocations.length > 0) {
    lines.push(`# Source: ${entry.sourceLocations.join(", ")}`);
  }
  // `#:` references — point at the admin bundle path. Translation
  // tools (Loco, wp i18n make-json, Poedit) hash this to derive
  // the JSON filename. Matching `md5(bundle src)` is what
  // WordPress's script-translation loader looks for at runtime.
  for (const ref of entry.references) {
    lines.push(`#: ${ref}`);
  }
  if (entry.msgctxt) {
    lines.push(`msgctxt "${potEscape(entry.msgctxt)}"`);
  }
  lines.push(`msgid "${potEscape(entry.msgid)}"`);
  if (entry.plural) {
    lines.push(`msgid_plural "${potEscape(entry.plural)}"`);
    lines.push('msgstr[0] ""');
    lines.push('msgstr[1] ""');
  } else {
    lines.push('msgstr ""');
  }
  lines.push("");
}

writeFileSync(OUTPUT_FILE, lines.join("\n"));

const ms = Date.now() - start;
console.log(
  `extract-js-pot: ${entries.size} string(s) from ${filesScanned} source file(s) → ${relative(PLUGIN_ROOT, OUTPUT_FILE)}  (${ms} ms)`,
);
