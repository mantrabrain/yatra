#!/usr/bin/env bash
# Lint every plugin PHP file with PHP 7.4 (catches match, union types, etc. that 8.x accepts).
# Requires Docker. Override image: PHP74_IMAGE=myregistry/php:7.4-cli ./check-php74-syntax.sh
set -euo pipefail
PLUGIN_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE="${PHP74_IMAGE:-php:7.4-cli}"
cd "$PLUGIN_ROOT"
docker run --rm -v "$PLUGIN_ROOT:/p" -w /p "$IMAGE" \
  sh -c 'find . -name "*.php" -not -path "./vendor/*" -not -path "./node_modules/*" -not -path "./build/*" -print0 | xargs -0 -n1 php -l'
echo "OK: All plugin PHP files pass php -l under PHP 7.4."
