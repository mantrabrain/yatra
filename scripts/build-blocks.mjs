/**
 * Build yatra/tour, yatra/activity, yatra/destination, yatra/trip-category as single-file IIFE bundles.
 *
 * CRITICAL: @wordpress/* packages MUST NOT be bundled. A bundled @wordpress/blocks uses a
 * separate block registry from the editor's wp.blocks — registerBlockType would succeed in
 * the bundle but blocks would never appear in the inserter or search.
 *
 * WordPress already loads these packages in the block editor; we map them to wp.* globals.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const blocks = ['tour', 'activity', 'destination', 'trip-category'];

/**
 * Map @wordpress/package-name to the global WordPress exposes (wp.blockEditor, wp.apiFetch, …).
 *
 * @param {string} id Module id (e.g. @wordpress/block-editor).
 * @returns {string}
 */
function wordpressGlobal(id) {
  if (!id.startsWith('@wordpress/')) {
    return id;
  }
  const pkg = id.slice('@wordpress/'.length).split('/')[0] ?? '';
  /** @type {Record<string, string>} */
  const exceptions = {
    'block-serialization-default-parser': 'blockSerializationDefaultParser',
  };
  if (exceptions[pkg]) {
    return `wp.${exceptions[pkg]}`;
  }
  const camel = pkg.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return `wp.${camel}`;
}

/**
 * @param {string} id
 */
function isExternal(id) {
  if (id.startsWith('@wordpress/')) {
    return true;
  }
  if (id === 'react' || id === 'react-dom' || id === 'react/jsx-runtime') {
    return true;
  }
  return false;
}

/**
 * @param {string} id
 */
function globalForExternal(id) {
  if (id.startsWith('@wordpress/')) {
    return wordpressGlobal(id);
  }
  if (id === 'react' || id === 'react/jsx-runtime') {
    return 'React';
  }
  if (id === 'react-dom') {
    return 'ReactDOM';
  }
  return id;
}

for (const slug of blocks) {
  // Must match {@see \Yatra\Blocks\BlockEditorScript::resolveEditorBundle} (letters only) for the dist filename.
  const slugKey = slug.replace(/[^a-z]/gi, '').toLowerCase();

  await build({
    root,
    base: './',
    configFile: false,
    plugins: [],
    resolve: {
      alias: {
        '@': path.resolve(root, 'resources/js'),
      },
    },
    esbuild: {
      jsx: 'transform',
      jsxFactory: 'createElement',
      jsxFragment: 'Fragment',
      jsxInject: `import { createElement, Fragment } from '@wordpress/element'`,
    },
    build: {
      outDir: 'assets',
      emptyOutDir: false,
      minify: false,
      sourcemap: true,
      rollupOptions: {
        input: path.resolve(root, `resources/js/blocks/${slug}/index.tsx`),
        external: isExternal,
        output: {
          format: 'iife',
          name: `yatraBlock_${slugKey}`,
          inlineDynamicImports: true,
          entryFileNames: `dist/blocks/${slugKey}.js`,
          globals: globalForExternal,
        },
      },
    },
  });
  console.log(`✓ Built IIFE block (externals): ${slug} → dist/blocks/${slugKey}.js`);
}

console.log('✅ All Yatra Gutenberg block bundles built (IIFE + WordPress externals).');
