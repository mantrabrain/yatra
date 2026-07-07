<?php
/**
 * CLI runner for the Track A pre-flight migration audit (dry-run report).
 *
 *   php -d mysqli.default_socket=<socket> tests/migration-audit.php
 *
 * Read-only. Prints the delta each risky Track A migration will encounter so
 * nothing is applied blind. Exits non-zero if any check reports a state that
 * would BLOCK a naive apply (e.g. duplicate transaction_ids before a UNIQUE
 * index), so it can gate CI / a migration step.
 *
 * @package Yatra\Tests
 */

if (php_sapi_name() !== 'cli') {
    exit("Run from CLI only.\n");
}

$wpLoad = dirname(__DIR__, 4) . '/wp-load.php';
if (!file_exists($wpLoad)) {
    fwrite(STDERR, "Could not locate wp-load.php at {$wpLoad}\n");
    exit(1);
}
require $wpLoad;
require __DIR__ . '/MigrationAudit.php';

use Yatra\Tests\MigrationAudit;

$report = (new MigrationAudit())->run();

$blocks = 0;
foreach ($report as $checkKey => $check) {
    $flag = !empty($check['blocks_apply']) ? '⛔ BLOCKS APPLY' : '✅ safe to apply';
    fwrite(STDOUT, "\n── {$check['item']}  [{$flag}]\n");
    foreach ($check as $k => $v) {
        if (in_array($k, ['item', 'blocks_apply', 'samples', 'migration_plan'], true)) {
            continue;
        }
        fwrite(STDOUT, sprintf("   %-26s %s\n", $k, is_scalar($v) ? (string) $v : json_encode($v)));
    }
    if (!empty($check['samples'])) {
        fwrite(STDOUT, "   samples:\n");
        foreach (array_slice($check['samples'], 0, 5) as $s) {
            fwrite(STDOUT, '     · ' . json_encode($s, JSON_UNESCAPED_SLASHES) . "\n");
        }
    }
    fwrite(STDOUT, "   plan: {$check['migration_plan']}\n");
    if (!empty($check['blocks_apply'])) {
        $blocks++;
    }
}

fwrite(STDOUT, "\n" . ($blocks === 0
    ? "✅ All Track A migrations are safe to apply as planned (with dry-run diffs).\n"
    : "⛔ {$blocks} migration(s) need pre-cleanup before apply — see above.\n"));

exit($blocks === 0 ? 0 : 1);
