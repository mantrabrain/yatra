<?php

declare(strict_types=1);

namespace Yatra\Upgrades;

use Yatra\Core\Database;
use Yatra\Services\InstallerService;
use Yatra\Upgrades\Versions\Upgrade_3_0_5;

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
        // Heal recurring availability rules whose new-schema columns
        // (rule_type / seats_total / interval_days / interval_start_date)
        // were never written by sample data or pre-3.x writers. Without this
        // the new admin UI showed phantom "1 on All & Active" badges for
        // legacy rows that rendered as broken weekly rules.
        InstallerService::maybeNormalizeAvailabilityRulesLegacyData();
        // Widen bookings.status enum to accept 'pending_verification' and
        // restore rows that earlier inserts coerced to '' under the old
        // enum. Version-independent (runs on every admin pageview, gated
        // by its own one-shot option) so installs whose stored version
        // already moved past 3.0.5 by a failed upgrade attempt still heal.
        InstallerService::maybeAddPendingVerificationBookingStatus();

        // Widen reviews.status enum to accept 'spam' / 'trash' (and
        // recover rows previously coerced to ''). Called directly here
        // rather than relying on the version-chain in runAdminUpgrades()
        // because the bug ships IN 3.0.5 itself — installs whose stored
        // yatra_version already equals the code version short-circuit
        // past the chain. The upgrade step's own one-shot option flag
        // gates the work so this is cheap on subsequent pageviews.
        Upgrade_3_0_5::run(YATRA_VERSION, YATRA_VERSION);
    }
}
