<?php
/**
 * CLI runner for the money/inventory characterization harness.
 *
 *   php -d mysqli.default_socket=<socket> tests/characterization.php capture
 *   php -d mysqli.default_socket=<socket> tests/characterization.php compare
 *
 * `capture` writes the golden baseline; `compare` re-runs and diffs against it,
 * exiting non-zero if anything changed. Run `capture` on unchanged code, then
 * `compare` after each Track A change — a green compare means no regression.
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
require __DIR__ . '/CharacterizationHarness.php';

use Yatra\Tests\CharacterizationHarness;

$mode = $argv[1] ?? 'compare';
$snapshotDir = __DIR__ . '/snapshots';
$baselinePath = $snapshotDir . '/pricing-capacity-baseline.json';

$harness = new CharacterizationHarness();
$snapshot = $harness->capture();
$json = CharacterizationHarness::toJson($snapshot);

$counts = sprintf(
    'tax=%d pricing=%d capacity=%d',
    count($snapshot['tax']),
    count($snapshot['pricing']),
    count($snapshot['capacity'])
);

if ($mode === 'capture') {
    if (!is_dir($snapshotDir)) {
        mkdir($snapshotDir, 0755, true);
    }
    file_put_contents($baselinePath, $json);
    fwrite(STDOUT, "✅ Baseline captured ({$counts})\n   -> {$baselinePath}\n");
    exit(0);
}

// compare
if (!file_exists($baselinePath)) {
    fwrite(STDERR, "No baseline at {$baselinePath}. Run `capture` first.\n");
    exit(2);
}

$baseline = json_decode((string) file_get_contents($baselinePath), true);
$current  = json_decode($json, true); // normalized round-trip, same as baseline
$diffs = CharacterizationHarness::diff($baseline, $current);

if (empty($diffs)) {
    fwrite(STDOUT, "✅ PASS — no regression. Snapshot identical to baseline ({$counts}).\n");
    exit(0);
}

fwrite(STDOUT, '❌ FAIL — ' . count($diffs) . " difference(s) vs baseline ({$counts}):\n");
foreach (array_slice($diffs, 0, 200) as $d) {
    fwrite(STDOUT, "   • {$d}\n");
}
if (count($diffs) > 200) {
    fwrite(STDOUT, '   … ' . (count($diffs) - 200) . " more\n");
}
exit(1);
