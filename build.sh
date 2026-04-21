#!/usr/bin/env bash
#
# Build a WordPress-installable zip for Yatra (free).
# Output: build/yatra-<version>.zip (gitignored)
#
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_SLUG="yatra"
MAIN_FILE="$PLUGIN_DIR/yatra.php"
BUILD_DIR="$PLUGIN_DIR/build"

if [[ ! -f "$MAIN_FILE" ]]; then
  echo "Error: yatra.php not found in $PLUGIN_DIR" >&2
  exit 1
fi

# Parse plugin header (portable: BSD sed does not treat \s like GNU sed; avoid broken zip names)
VERSION="$(
  grep -m1 'Version:' "$MAIN_FILE" \
    | sed 's/.*Version:[[:space:]]*//' \
    | sed 's/[[:space:]].*//' \
    | tr -d '\r'
)"
if [[ -z "${VERSION}" ]] || [[ ! "${VERSION}" =~ ^[0-9A-Za-z._-]+$ ]]; then
  echo "Error: could not parse a valid Version from yatra.php (got: '${VERSION}')" >&2
  exit 1
fi

ZIP_NAME="${PLUGIN_SLUG}-${VERSION}.zip"
ZIP_PATH="${BUILD_DIR}/${ZIP_NAME}"

echo "==> Yatra release build (${VERSION})"
echo "    Output: ${ZIP_PATH}"

mkdir -p "${BUILD_DIR}"

if command -v composer >/dev/null 2>&1 && [[ -f "${PLUGIN_DIR}/composer.json" ]]; then
  if [[ ! -f "${PLUGIN_DIR}/composer.lock" ]]; then
    echo "Error: composer.lock is missing. Commit composer.lock for reproducible production installs." >&2
    exit 1
  fi
  echo "==> Clean vendor + composer install --no-dev (production only; no require-dev)"
  (cd "${PLUGIN_DIR}" && rm -rf vendor && composer install --no-dev --optimize-autoloader --no-interaction)
else
  echo "Warning: composer not found or no composer.json; using existing vendor/ if present." >&2
fi

if command -v npm >/dev/null 2>&1 && [[ -f "${PLUGIN_DIR}/package.json" ]]; then
  echo "==> npm ci && npm run build:release"
  (cd "${PLUGIN_DIR}" && npm ci && npm run build:release)
else
  echo "Warning: npm not found; zip will use existing built assets under assets/." >&2
fi

STAGE_PARENT="$(mktemp -d "${TMPDIR:-/tmp}/yatra-build.XXXXXX")"
STAGE_DIR="${STAGE_PARENT}/${PLUGIN_SLUG}"
mkdir -p "${STAGE_DIR}"

EXCLUDE_FILE="$(mktemp)"
trap 'rm -rf "${STAGE_PARENT}"; rm -f "${EXCLUDE_FILE}"' EXIT

cat >"${EXCLUDE_FILE}" <<'EOF'
build/
.wordpress-org/
.git/
.github/
.gitignore
.gitattributes
node_modules/
package.json
package-lock.json
yarn.lock
pnpm-lock.yaml
npm-debug.log*
composer.json
composer.lock
vite.config.ts
tsconfig.json
tsconfig.node.json
tailwind.config.js
postcss.config.js
eslint.config.js
.eslintrc*
.prettierrc*
prettier.config.*
babel.config.*
# resources/js (TS/JS source) is included for WordPress.org and transparency
tests/
phpunit.xml
phpunit.xml.dist
.phpunit.result.cache
phpcs.xml
phpcs.xml.dist
.phpcs.xml
phpmd.xml
phpmd.xml.dist
.env
.env.*
*.log
.DS_Store
Thumbs.db
# Source maps & Vite metadata (optional for support; omit from distribution zip)
*.map
assets/.vite/
scripts/
build.sh
copy.sh
EOF

echo "==> Staging plugin into ${PLUGIN_SLUG}/"
rsync -a --delete \
  --exclude-from="${EXCLUDE_FILE}" \
  "${PLUGIN_DIR}/" "${STAGE_DIR}/"

if [[ ! -f "${STAGE_DIR}/yatra.php" ]]; then
  echo "Error: staged copy missing yatra.php" >&2
  exit 1
fi

if [[ ! -f "${STAGE_DIR}/vendor/autoload.php" ]]; then
  echo "Error: staged copy missing vendor/autoload.php. Run: composer run install:prod" >&2
  exit 1
fi

echo "==> Creating zip (WordPress expects a single top-level folder)"
(
  cd "${STAGE_PARENT}"
  rm -f "${ZIP_PATH}"
  zip -r -q "${ZIP_PATH}" "${PLUGIN_SLUG}"
)

echo "==> Done: ${ZIP_PATH} ($(du -sh "${ZIP_PATH}" | cut -f1))"
