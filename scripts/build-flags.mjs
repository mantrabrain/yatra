/**
 * Build per-country flag SVGs for the phone-number field.
 *
 * Source: the MIT-licensed `flag-icons` package (4x3 SVGs). Each 2-letter flag
 * is minified with SVGO (reduced coordinate precision — these render at ~20px,
 * so full coat-of-arms precision is wasted bytes) and written to
 * assets/img/flags/<iso>.svg.
 *
 * Per-file (not one big sprite) on purpose: the booking page shows only the
 * customer's own flag by default, and dropdown flags load lazily on scroll, so
 * a visitor fetches a few KB instead of a ~1.6MB combined sprite. Files are
 * referenced as <img class="yatra-flag" loading="lazy" src=".../flags/np.svg">.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { optimize } from 'svgo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'node_modules', 'flag-icons', 'flags', '4x3');
const outDir = path.join(root, 'assets', 'img', 'flags');

if (!fs.existsSync(srcDir)) {
  console.error(`[build-flags] flag-icons not installed at ${srcDir}. Run: npm i -D flag-icons`);
  process.exit(1);
}

// Start clean so a removed flag never lingers.
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Newer SVGO keeps viewBox by default (removeViewBox is no longer in
// preset-default), so we just run the preset + drop width/height and reduce
// numeric precision — plenty for a ~20px flag.
// Newer SVGO keeps viewBox by default. Reduce path/coordinate precision hard
// (these render at ~20px) by overriding the precision plugins that ARE part of
// preset-default — this is what shrinks the detailed coat-of-arms flags.
const svgoConfig = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertPathData: { floatPrecision: 1, transformPrecision: 1 },
          cleanupNumericValues: { floatPrecision: 1 },
          convertTransform: { floatPrecision: 1 },
        },
      },
    },
    'removeDimensions',
  ],
};

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.svg')).sort();
let count = 0;
let srcBytes = 0;
let outBytes = 0;

for (const file of files) {
  const iso = path.basename(file, '.svg').toLowerCase();
  if (!/^[a-z]{2}$/.test(iso)) continue; // ISO-3166-1 alpha-2 only

  const raw = fs.readFileSync(path.join(srcDir, file), 'utf8');
  srcBytes += Buffer.byteLength(raw);

  let out = raw;
  try {
    const res = optimize(raw, { path: file, ...svgoConfig });
    if (res && res.data) out = res.data;
  } catch (e) {
    console.warn(`[build-flags] SVGO failed for ${iso}, copying raw: ${e.message}`);
  }

  fs.writeFileSync(path.join(outDir, `${iso}.svg`), out, 'utf8');
  outBytes += Buffer.byteLength(out);
  count++;
}

console.log(
  `✅ [build-flags] ${count} flags → assets/img/flags/ ` +
  `(${(srcBytes / 1024).toFixed(0)}KB → ${(outBytes / 1024).toFixed(0)}KB minified)`
);
