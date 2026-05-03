<?php

declare(strict_types=1);

namespace Yatra\Upgrades\Versions;

use Yatra\Services\InstallerService;
use Yatra\Upgrades\AbstractUpgradeStep;

/**
 * Free 3.0.3: drop legacy payment-token tables after Pro (or nothing) has migrated scheduled rows.
 *
 * Canonical table name matches Pro {@see \YatraPro\Upgrades\Versions\Upgrade_3_0_0_1} (`wp_*_yatra_payment_tokens`).
 * Some installs may still have a mistaken `yatra_new_payment_tokens` name from early builds; drop both if present.
 */
final class Upgrade_3_0_3 extends AbstractUpgradeStep
{
    public static function targetVersion(): string
    {
        return '3.0.3';
    }

    public static function runOnHooks(): array
    {
        return ['admin_init'];
    }

    public static function run(string $fromVersion, string $toVersion): void
    {
        unset($fromVersion, $toVersion);

        global $wpdb;

        $suffixes = [
            'yatra_payment_tokens',
            'yatra_new_payment_tokens',
        ];

        foreach ($suffixes as $suffix) {
            $table = $wpdb->prefix . $suffix;
            if (!InstallerService::databaseTableExists($table)) {
                continue;
            }

            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name is escaped.
            $wpdb->query('DROP TABLE IF EXISTS `' . esc_sql($table) . '`');
        }
    }
}
