<?php

declare(strict_types=1);

namespace Yatra\Upgrades;

use Yatra\Core\Database;
use Yatra\Services\InstallerService;

/**
 * Orchestrates Yatra Free upgrades: {@see Database::createTables()} for schema sync, then version-gated
 * {@see Versions\* } steps (ALTER / DROP / data) that do not run on a fresh install at the current version.
 *
 * Hooks:
 * - admin_init (priority 5): delta upgrades + version option bump + idempotent maintenance.
 *
 * Extension points:
 * - {@see 'yatra_free_upgraded'} — after yatra_version was bumped. Args: (string $from, string $to).
 * - {@see 'yatra_free_upgrades_ran'} — every admin_init after work. Args: (string $from, string $to, bool $bumped).
 */
final class FreeUpgradeRunner
{
    public const VERSION_OPTION = 'yatra_version';

    public static function register(): void
    {
        add_action('admin_init', [self::class, 'runAdminUpgrades'], 5);
    }

    public static function runAdminUpgrades(): void
    {
        if (!defined('YATRA_VERSION')) {
            return;
        }

        $to = YATRA_VERSION;
        $stored = get_option(self::VERSION_OPTION, false);

        if ($stored === false) {
            add_option(self::VERSION_OPTION, $to);
            self::runIdempotentMaintenance();
            do_action('yatra_free_upgrades_ran', '0.0.0', $to, false);

            return;
        }

        $from = (string) $stored;

        if (version_compare($from, $to, '>=')) {
            self::runIdempotentMaintenance();
            do_action('yatra_free_upgrades_ran', $from, $to, false);

            return;
        }

        Database::createTables();

        foreach (FreeUpgradeRegistry::stepsForHook('admin_init') as $class) {
            if ($class::shouldApply($from, $to)) {
                $class::run($from, $to);
            }
        }

        update_option(self::VERSION_OPTION, $to);
        do_action('yatra_free_upgraded', $from, $to);

        self::runIdempotentMaintenance();
        do_action('yatra_free_upgrades_ran', $from, $to, true);
    }

    private static function runIdempotentMaintenance(): void
    {
        InstallerService::maybeBackfillEmailTemplateDefaults();
        InstallerService::maybeNormalizeMigratedCouponDiscountStatuses();
    }
}
