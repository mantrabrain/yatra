#!/usr/bin/env bash
#
# Copy this Yatra plugin tree into the yatra-test Local WP site (not the main yatra site).
# Default destination:
#   <Local Sites>/yatra-test/app/public/wp-content/plugins/yatra
#
# Usage:
#   ./copy.sh              # rsync from this directory to yatra-test
#   YATRA_COPY_TARGET=/path/to/plugins/yatra ./copy.sh
#
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_FILE="$PLUGIN_DIR/yatra.php"

if [[ ! -f "$MAIN_FILE" ]]; then
  echo "Error: yatra.php not found in $PLUGIN_DIR" >&2
  exit 1
fi

# Site root = Local Sites/<site>/ (five levels up from .../plugins/yatra)
SITE_ROOT="$(cd "${PLUGIN_DIR}/../../../../.." && pwd)"

if [[ -n "${YATRA_COPY_TARGET:-}" ]]; then
  DEST_DIR="${YATRA_COPY_TARGET}"
else
  DEST_DIR="${SITE_ROOT}/../yatra-test/app/public/wp-content/plugins/yatra"
fi

EXCLUDE_FILE="$(mktemp)"
trap 'rm -f "${EXCLUDE_FILE}"' EXIT

cat >"${EXCLUDE_FILE}" <<'EOF'
build/
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
build.sh
copy.sh
EOF

echo "==> Yatra → test site deploy"
echo "    Source: ${PLUGIN_DIR}"
echo "    Dest:   ${DEST_DIR}"

mkdir -p "$(dirname "${DEST_DIR}")"

rsync -a --delete \
  --exclude-from="${EXCLUDE_FILE}" \
  "${PLUGIN_DIR}/" "${DEST_DIR}/"

if [[ ! -f "${DEST_DIR}/yatra.php" ]]; then
  echo "Error: copy failed — yatra.php missing in ${DEST_DIR}" >&2
  exit 1
fi

echo "==> Done: $(du -sh "${DEST_DIR}" | cut -f1)"
