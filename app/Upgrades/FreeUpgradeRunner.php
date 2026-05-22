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

    /** Request-level short-circuit so we never re-enter the rename path in
     *  the same PHP process once it has been settled (either completed,
     *  skipped because the option flag is set, or back-off-throttled). */
    private static bool $renameSettledThisRequest = false;

    public static function register(): void
    {
        add_action('admin_init', [self::class, 'runAdminUpgrades'], 5);

        // Frontend + admin: triggers the one-shot `wp_yatra_new_*` ->
        // `wp_yatra_*` rename without waiting for an admin pageview.
        // Heavily short-circuited — see runEarlyRenameHeal() — so the
        // steady-state cost per request is one boolean check.
        add_action('init', [self::class, 'runEarlyRenameHeal'], 0);
    }

    /**
     * Cheap-path entry for the one-shot table-rename. Layered guards keep
     * the cost minimal on the common case where the rename is already done:
     *
     *   1. Request-level static — first call sets it, subsequent calls in
     *      the same PHP process exit immediately.
     *   2. Autoloaded option flag — WordPress preloads all autoload=yes
     *      options on boot, so `get_option()` is an array lookup, not a
     *      query.
     *   3. Failure-backoff transient — if a prior attempt failed (e.g.
     *      DB user lacks RENAME privilege), we don't retry for 15 min so
     *      we don't slow every pageview indefinitely.
     *   4. wp_cache_add concurrency lock — only one request at a time
     *      tries the rename. Others see the lock and skip.
     *
     * Anything thrown by the rename step is caught here so a partial
     * migration / DB hiccup can never fatal the page.
     */
    public static function runEarlyRenameHeal(): void
    {
        if (self::$renameSettledThisRequest) {
            return;
        }

        if (get_option(Upgrade_3_0_5::RENAME_DONE_OPTION)) {
            self::$renameSettledThisRequest = true;
            return;
        }

        // Backoff: if a recent attempt failed, skip until the transient
        // expires. Prevents persistent failures (permission denied,
        // disk full) from running on every pageview forever.
        if (get_transient('yatra_table_rename_backoff_v1')) {
            self::$renameSettledThisRequest = true;
            return;
        }

        // Concurrency lock: ensure only one process attempts the rename
        // at a time. 30s TTL is the upper bound for a slow rename;
        // wp_cache_add returns false if the key already exists.
        if (!wp_cache_add('yatra_table_rename_lock_v1', 1, 'yatra', 30)) {
            // Another request is renaming — let it finish.
            self::$renameSettledThisRequest = true;
            return;
        }

        try {
            $ok = Upgrade_3_0_5::runTableRenameOnce();
            if (!$ok) {
                // Don't retry on every request — back off for 15 minutes
                // so a persistent failure doesn't trash site responsiveness.
                set_transient('yatra_table_rename_backoff_v1', 1, 15 * MINUTE_IN_SECONDS);
            }
        } catch (\Throwable $e) {
            // Defensive: nothing the rename does should reach here, but
            // never let a migration exception take down a public page.
            if (function_exists('error_log')) {
                error_log('[Yatra rename] uncaught: ' . $e->getMessage());
            }
            set_transient('yatra_table_rename_backoff_v1', 1, 15 * MINUTE_IN_SECONDS);
        } finally {
            wp_cache_delete('yatra_table_rename_lock_v1', 'yatra');
            self::$renameSettledThisRequest = true;
        }
    }

    public static function runAdminUpgrades(): void
    {
        if (!defined('YATRA_VERSION')) {
            return;
        }

        // *** Rename BEFORE createTables ***
        // Database::createTables() runs dbDelta, which would create empty
        // `wp_yatra_*` placeholders alongside the live `wp_yatra_new_*`
        // tables — triggering Upgrade_3_0_5's both-exist branch on the
        // very next call. Doing the rename first means dbDelta sees the
        // canonical names already in place and is a no-op for them.
        // runEarlyRenameHeal() is itself heavily short-circuited and
        // safe to call from both init and admin_init.
        self::runEarlyRenameHeal();

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
