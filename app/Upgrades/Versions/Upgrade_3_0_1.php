<?php

declare(strict_types=1);

namespace Yatra\Upgrades\Versions;

use Yatra\Services\InstallerService;
use Yatra\Upgrades\AbstractUpgradeStep;

/**
 * Free 3.0.1: drop legacy wp_*_yatra_payment_tokens after Pro (or nothing) has migrated scheduled rows.
 */
final class Upgrade_3_0_1 extends AbstractUpgradeStep
{
    public static function targetVersion(): string
    {
        return '3.0.1';
    }

    public static function runOnHooks(): array
    {
        return ['admin_init'];
    }

    public static function run(string $fromVersion, string $toVersion): void
    {
        unset($fromVersion, $toVersion);

        global $wpdb;
        $table = $wpdb->prefix . 'yatra_payment_tokens';
        if (!InstallerService::databaseTableExists($table)) {
            return;
        }

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name is escaped.
        $wpdb->query('DROP TABLE IF EXISTS `' . esc_sql($table) . '`');
    }
}
