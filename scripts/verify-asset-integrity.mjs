#!/usr/bin/env node
/**
 * Verify built JS asset integrity.
 *
 * The admin SPA entry (assets/admin/dist/js/app.js) is built with a STABLE
 * name but lazily imports HASHED route chunks (e.g. Settings-<hash>.js) that
 * live in assets/dist/js/. If a release or deploy ever ships an app.js whose
 * chunk hash does not match the chunk file actually present, the browser
 * requests a non-existent file -> 404 -> the page (e.g. Settings) never mounts.
 * This exact failure was reported in production (Settings page blank after an
 * update; renaming the existing chunk to the referenced name fixed it).
 *
 * A clean `vite build` is internally consistent, so this guard's value is at
 * COMMIT / PACKAGE time: it fails the build (non-zero exit) the moment any
 * built JS references a sibling chunk file that is not present on disk — so an
 * inconsistent set of dist files can never be shipped or committed.
 *
 * Pure read-only verification — it changes nothing and has no runtime effect.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Built trees that contain ES modules / block bundles which may import sibling
// chunks (admin app, frontend account page, and Gutenberg block bundles that
// reference shared ../js/*.js chunks).
const scanDirs = [
  'assets/admin/dist',
  'assets/dist',
].map((d) => join(pluginRoot, d));

/** Recursively collect *.js files (skip sourcemaps). */
function collectJs(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectJs(full));
    else if (entry.endsWith('.js')) out.push(full);
  }
  return out;
}

// Match relative module specifiers ending in `.js` inside string literals,
// e.g. "../../../dist/js/Settings-DAPGYQ8J.js" or "./react-vendor-XYZ.js".
// Only relative paths (./ or ../) are chunk references we can resolve on disk.
const SPEC_RE = /["'`]((?:\.\.?\/)+[A-Za-z0-9_./-]+?\.js)["'`]/g;

const files = scanDirs.flatMap(collectJs);
if (files.length === 0) {
  console.error('[verify-asset-integrity] No built JS found under assets/*/dist/js — run `vite build` first.');
  process.exit(1);
}

const missing = [];
let refsChecked = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const base = dirname(file);
  for (const m of src.matchAll(SPEC_RE)) {
    const spec = m[1];
    const target = resolve(base, spec);
    // Only validate references that point inside our built asset tree.
    if (!target.startsWith(join(pluginRoot, 'assets'))) continue;
    refsChecked++;
    if (!existsSync(target)) {
      missing.push({
        from: relative(pluginRoot, file),
        spec,
        resolved: relative(pluginRoot, target),
      });
    }
  }
}

if (missing.length > 0) {
  console.error('\n[verify-asset-integrity] FAILED — built JS references chunk files that do not exist:\n');
  for (const m of missing) {
    console.error(`  ${m.from}`);
    console.error(`    imports: ${m.spec}`);
    console.error(`    missing: ${m.resolved}\n`);
  }
  console.error(
    'This is the "Settings page 404 after update" class of bug: an entry (app.js)\n' +
    'references a hashed chunk that is not present. Rebuild cleanly (`npm run build:release`)\n' +
    'and commit ALL changed files under assets/dist and assets/admin/dist together.\n'
  );
  process.exit(1);
}

console.log(
  `[verify-asset-integrity] OK — ${refsChecked} chunk reference(s) across ${files.length} built file(s) all resolve.`
);
