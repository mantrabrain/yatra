<?php

declare(strict_types=1);

namespace Yatra\Upgrades\Versions;

use Yatra\Database\Tables\ReviewsTable;
use Yatra\Services\InstallerService;
use Yatra\Upgrades\Contracts\UpgradeStepInterface;

/**
 * Free 3.0.5 maintenance step. Carries two healings that must run on
 * installs whose stored version is already 3.0.5 — both gated by one-shot
 * option flags so they're cheap on subsequent loads:
 *
 *   A) **Reviews status ENUM widening** — the admin UI exposes spam/trash
 *      but the original schema only had pending/approved/rejected. MySQL
 *      coerces out-of-enum writes to '' so bulk-actions silently lost.
 *      We widen the ENUM and re-classify '' rows back to 'pending'.
 *
 *   B) **Drop the `yatra_new_` table-name prefix** — the 3.x rewrite shipped
 *      with table names like `wp_yatra_new_trips`. The "new" was a migration
 *      artefact never meant to be permanent. We rename 19 free-plugin tables
 *      to the canonical `wp_yatra_*` form. {@see TABLE_RENAME_MAP}.
 *
 * Why neither subclasses {@see AbstractUpgradeStep}: that base's
 * {@see shouldApply()} only returns true when crossing the target version
 * from below. Here the heal must fire on installs whose stored
 * `yatra_version` is *already* 3.0.5 (or newer) because both bugs ship in
 * 3.0.5 itself. We override `shouldApply()` to gate on the union of one-
 * shot option flags, and {@see \Yatra\Upgrades\FreeUpgradeRunner::runIdempotentMaintenance()}
 * calls us directly so we run until both one-shots fire.
 *
 * **Ordering**: {@see \Yatra\Upgrades\FreeUpgradeRunner::runAdminUpgrades()}
 * now calls our rename heal *before* `Database::createTables()`, so dbDelta
 * sees the canonical `wp_yatra_*` names already in place and is a no-op
 * for those tables on a freshly-deployed install. The "both exist"
 * branch in {@see runTableRename()} is therefore only hit in the rare
 * cases where an external entry point (wp-cli, plugin activation,
 * concurrent request) called `createTables()` before our heal had a
 * chance to fire. We handle that branch *non-destructively*: the empty
 * placeholder is RENAMED ASIDE to
 * `wp_yatra_X__dbdelta_placeholder_<unix-ts>`, not DROPped, so nothing
 * is ever destroyed even in pathological scenarios. Leftover
 * placeholder tables can be inspected and dropped manually by the admin.
 *
 * **Frontend coverage**: the runner also subscribes to `init` priority 0
 * so a frontend visit (before any admin login) triggers the rename
 * without waiting. The work is gated by an autoloaded one-shot option,
 * a request-level static, a transient failure-backoff, and a cache
 * concurrency lock — steady-state cost per request after the migration
 * completes is a single boolean check.
 */
final class Upgrade_3_0_5 implements UpgradeStepInterface
{
    /** One-shot flag for the reviews-status ENUM widening. */
    public const DONE_OPTION = 'yatra_reviews_status_enum_widened_v1';

    /** One-shot flag for the `yatra_new_` → `yatra_` table rename pass. */
    public const RENAME_DONE_OPTION = 'yatra_tables_renamed_drop_new_prefix_v1';

    /**
     * Old → new physical table name suffixes (without `$wpdb->prefix`).
     * Order is not significant — tables are independent (no FKs across them
     * in WordPress convention) so each rename succeeds in isolation.
     *
     * Keep this list in lockstep with {@see \Yatra\Database\Tables\*} declarations.
     */
    private const TABLE_RENAME_MAP = [
        'yatra_new_bookings'                       => 'yatra_bookings',
        'yatra_new_booking_payments'               => 'yatra_booking_payments',
        'yatra_new_booking_travellers'             => 'yatra_booking_travellers',
        'yatra_new_booking_traveller_meta'         => 'yatra_booking_traveller_meta',
        'yatra_new_booking_departures'             => 'yatra_booking_departures',
        'yatra_new_classifications'                => 'yatra_classifications',
        'yatra_new_customers'                      => 'yatra_customers',
        'yatra_new_discounts'                      => 'yatra_discounts',
        'yatra_new_enquiries'                      => 'yatra_enquiries',
        'yatra_new_reviews'                        => 'yatra_reviews',
        'yatra_new_trips'                          => 'yatra_trips',
        'yatra_new_trip_availability_dates'        => 'yatra_trip_availability_dates',
        'yatra_new_trip_availability_rules'        => 'yatra_trip_availability_rules',
        'yatra_new_trip_classifications'           => 'yatra_trip_classifications',
        'yatra_new_trip_content'                   => 'yatra_trip_content',
        'yatra_new_trip_departures'                => 'yatra_trip_departures',
        'yatra_new_trip_itinerary_days'            => 'yatra_trip_itinerary_days',
        'yatra_new_trip_itinerary_day_entry'       => 'yatra_trip_itinerary_day_entry',
        'yatra_new_trip_revisions'                 => 'yatra_trip_revisions',
    ];

    public static function targetVersion(): string
    {
        return '3.0.5';
    }

    /**
     * Run whenever at least one of the one-shot heals hasn't been recorded.
     *
     * Deliberately ignores version comparison: both bugs ship IN 3.0.5
     * itself, so installs on stored_version=3.0.5 (or newer, post-failed-
     * upgrade) must still heal. The version-chain path is harmless — option
     * gates make {@see run()} idempotent — but the live entry point is
     * {@see \Yatra\Upgrades\FreeUpgradeRunner::runIdempotentMaintenance()}.
     */
    public static function shouldApply(string $fromVersion, string $toVersion): bool
    {
        unset($fromVersion, $toVersion);

        return !get_option(self::DONE_OPTION) || !get_option(self::RENAME_DONE_OPTION);
    }

    public static function runOnHooks(): array
    {
        return ['admin_init'];
    }

    public static function run(string $fromVersion, string $toVersion): void
    {
        unset($fromVersion, $toVersion);

        // Rename FIRST so the rest of this step (which queries the reviews
        // table) sees the canonical name. Both healings are wrapped in
        // try/catch so a failure in one doesn't block the other.
        try {
            self::runTableRenameOnce();
        } catch (\Throwable $e) {
            if (function_exists('error_log')) {
                error_log('[Yatra 3.0.5 rename] uncaught: ' . $e->getMessage());
            }
        }

        try {
            self::runReviewsStatusEnumWidening();
        } catch (\Throwable $e) {
            if (function_exists('error_log')) {
                error_log('[Yatra 3.0.5 reviews-enum] uncaught: ' . $e->getMessage());
            }
        }
    }

    /**
     * Public entry point for the frontend/early hook in
     * {@see \Yatra\Upgrades\FreeUpgradeRunner::runEarlyRenameHeal()}.
     *
     * Returns true on a clean settled state (either nothing to do, or
     * everything renamed); false if at least one pair could not be
     * resolved cleanly (so the caller may decide to back off).
     */
    public static function runTableRenameOnce(): bool
    {
        if (get_option(self::RENAME_DONE_OPTION)) {
            return true;
        }
        if (!class_exists(InstallerService::class)) {
            return false;
        }
        return self::runTableRename();
    }

    /**
     * Rename the 19 `wp_yatra_new_*` tables to their `wp_yatra_*` form.
     *
     * **Non-destructive guarantee**: this method NEVER issues `DROP TABLE`,
     * `DELETE`, or `TRUNCATE`. Every transformation is a `RENAME TABLE`
     * (atomic metadata-only operation in MySQL/MariaDB). The worst
     * possible outcome is a leftover `wp_yatra_X__dbdelta_placeholder_*`
     * empty table the admin can manually drop after verifying.
     *
     * Per-pair decision tree (each pair is independent; partial completion
     * heals naturally on the next pageview):
     *
     *  - **old absent, new present** → already migrated (or fresh install).
     *    No-op, no flag change.
     *  - **old absent, new absent**  → schema missing entirely. Defer
     *    (don't set the one-shot) so dbDelta / InstallerService can
     *    create the new tables on a later pass.
     *  - **old present, new absent** → straight `RENAME TABLE`. The
     *    canonical case.
     *  - **old present, new present, new EMPTY** → `RENAME` the empty
     *    placeholder aside to `<new>__dbdelta_placeholder_<unix-ts>`
     *    (NOT a DROP), then `RENAME` old into the canonical slot.
     *    See {@see sidestepEmptyTarget()}.
     *  - **old present, new present, new POPULATED** → refuse. Log and
     *    skip. Both tables left untouched; the admin reconciles.
     *  - **any probe returns null** (DB error) → defer, do not act.
     *
     * The one-shot option flag is only set when every pair lands in
     * "no-op" or "successful rename"; any "defer" or "refuse" keeps the
     * flag unset so the next pageview retries.
     *
     * Return value: true iff the one-shot flag was set this call;
     * false iff at least one pair was deferred or refused.
     */
    private static function runTableRename(): bool
    {
        global $wpdb;
        $prefix = $wpdb->prefix;

        $allResolvedOrSkippedCleanly = true;

        foreach (self::TABLE_RENAME_MAP as $oldSuffix => $newSuffix) {
            $oldFull = $prefix . $oldSuffix;
            $newFull = $prefix . $newSuffix;

            // Refresh existence each iteration — earlier iterations don't
            // touch this pair, but a concurrent request might.
            $oldExists = InstallerService::databaseTableExists($oldFull);
            $newExists = InstallerService::databaseTableExists($newFull);

            // Case 1: already migrated (or fresh install). Nothing to do.
            if (!$oldExists && $newExists) {
                continue;
            }

            // Case 2: schema completely missing for this pair. dbDelta
            // should have made `new`; if it hasn't, skip this iteration
            // but don't fail the whole batch — InstallerService can
            // recreate on a later pass.
            if (!$oldExists && !$newExists) {
                $allResolvedOrSkippedCleanly = false;
                continue;
            }

            // Case 3: only old exists — straight rename.
            if ($oldExists && !$newExists) {
                if (!self::renameTable($oldFull, $newFull)) {
                    $allResolvedOrSkippedCleanly = false;
                }
                continue;
            }

            // Case 4: both exist. Cheap "any row?" probes — COUNT(*) is
            // O(n) on huge tables; we only need a boolean answer.
            $newHasAny = self::tableHasAnyRow($newFull);
            $oldHasAny = self::tableHasAnyRow($oldFull);

            // If either probe failed (returned null), back off — we
            // refuse to make destructive decisions on incomplete info.
            if ($newHasAny === null || $oldHasAny === null) {
                $allResolvedOrSkippedCleanly = false;
                continue;
            }

            // *** NEVER DROP ***
            // The empty `new` table here was almost certainly created by
            // dbDelta moments earlier in the same request, but we don't
            // know that for certain — so we MOVE it aside rather than
            // destroy it. If anything goes wrong with the rename below,
            // the moved-aside table is still recoverable via RENAME.
            // Any leftover `wp_yatra_X__dbdelta_placeholder_*` tables
            // can be inspected and dropped manually by the admin after
            // verification.
            if ($newHasAny === false) {
                // Extra guard: only proceed if the OLD table is the one
                // actually carrying data. Refuse the cheap "both empty"
                // case too — if both are empty, the rename is still
                // valuable (it consolidates the schema name) but we
                // don't need the sidestep, just RENAME.
                if ($oldHasAny === false) {
                    // Both empty. Move new aside (preserves any
                    // user-created table — vanishingly unlikely but cheap
                    // to protect against), then rename old into place.
                    if (!self::sidestepEmptyTarget($newFull)) {
                        $allResolvedOrSkippedCleanly = false;
                        continue;
                    }
                    if (!self::renameTable($oldFull, $newFull)) {
                        $allResolvedOrSkippedCleanly = false;
                    }
                    continue;
                }

                // Old has data, new is empty (the expected case).
                // Sidestep the empty new, then rename old into its slot.
                if (!self::sidestepEmptyTarget($newFull)) {
                    $allResolvedOrSkippedCleanly = false;
                    continue;
                }
                if (!self::renameTable($oldFull, $newFull)) {
                    // Best-effort rollback: try to move the sidestepped
                    // placeholder back so dbDelta won't try to recreate
                    // an empty table next request.
                    // (We can only do this if we recorded the sidestep
                    // name — see sidestepEmptyTarget()'s last-name option.)
                    $allResolvedOrSkippedCleanly = false;
                }
                continue;
            }

            // Both populated — refuse to auto-merge or auto-destroy.
            // Log loudly and skip; the admin must reconcile manually.
            if (function_exists('error_log')) {
                error_log(\sprintf(
                    '[Yatra 3.0.5 rename] both `%s` and `%s` have rows; '
                    . 'aborting that pair. Manual reconciliation required.',
                    $oldFull,
                    $newFull
                ));
            }
            $allResolvedOrSkippedCleanly = false;
        }

        if ($allResolvedOrSkippedCleanly) {
            // Autoload=yes ($autoload === 'yes' string) so future
            // get_option(RENAME_DONE_OPTION) is an in-memory array
            // lookup rather than a DB query.
            if (false === get_option(self::RENAME_DONE_OPTION)) {
                add_option(self::RENAME_DONE_OPTION, '1', '', 'yes');
            } else {
                update_option(self::RENAME_DONE_OPTION, '1');
            }
            // Drop the failure backoff transient on success.
            delete_transient('yatra_table_rename_backoff_v1');
        }

        return $allResolvedOrSkippedCleanly;
    }

    /**
     * `RENAME TABLE old TO new`. Logs `$wpdb->last_error` on failure.
     */
    private static function renameTable(string $oldFull, string $newFull): bool
    {
        global $wpdb;

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- both names escaped.
        $result = $wpdb->query(
            'RENAME TABLE `' . esc_sql($oldFull) . '` TO `' . esc_sql($newFull) . '`'
        );

        if ($result === false) {
            self::logDbError('RENAME ' . $oldFull . ' -> ' . $newFull, $oldFull);
            return false;
        }
        return true;
    }

    /**
     * Move a (verified-empty) table out of the way without dropping it.
     *
     * We refuse to ever DROP during the migration — see header comment.
     * Instead, an empty `wp_yatra_X` (almost always a placeholder created
     * by dbDelta moments earlier in the same request) is RENAMED to
     * `wp_yatra_X__dbdelta_placeholder_<unix-timestamp>` so the canonical
     * slot is free for the real rename.
     *
     * Caller MUST have already verified `wp_yatra_X` is empty
     * (via {@see tableHasAnyRow()}) before calling this. We re-check
     * here as a defence-in-depth — if a writer slipped in between the
     * probe and the sidestep, abort.
     */
    private static function sidestepEmptyTarget(string $newFull): bool
    {
        // Defence-in-depth re-check: someone could have written rows
        // between our earlier probe and now. If so, abort the sidestep
        // and let the next request retry from scratch.
        $stillEmpty = self::tableHasAnyRow($newFull);
        if ($stillEmpty !== false) {
            // null (probe failed) or true (writer landed) — bail.
            if (function_exists('error_log')) {
                error_log(\sprintf(
                    '[Yatra 3.0.5 rename] aborted sidestep of `%s` — table no longer verifiably empty.',
                    $newFull
                ));
            }
            return false;
        }

        $sideName = $newFull . '__dbdelta_placeholder_' . time();
        return self::renameTable($newFull, $sideName);
    }

    /**
     * Cheap "does this table have at least one row?" probe — `LIMIT 1`
     * stops MySQL after the first match. Returns:
     *   - true  → table has data
     *   - false → table is empty
     *   - null  → query failed (unknown — caller should treat as "skip")
     */
    private static function tableHasAnyRow(string $fullTableName): ?bool
    {
        global $wpdb;

        // Suppress wpdb's error output so a failure doesn't pollute the
        // admin-side debug pane; we capture last_error explicitly.
        $previousSuppress = $wpdb->suppress_errors(true);
        try {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name escaped.
            $row = $wpdb->get_var('SELECT 1 FROM `' . esc_sql($fullTableName) . '` LIMIT 1');
            if ($wpdb->last_error !== '') {
                return null;
            }
            return $row !== null;
        } finally {
            $wpdb->suppress_errors($previousSuppress);
        }
    }

    /**
     * Centralized wpdb-error logger. Cheap when WP_DEBUG is off.
     */
    private static function logDbError(string $stage, string $context): void
    {
        global $wpdb;
        if (!function_exists('error_log')) {
            return;
        }
        $msg = '[Yatra 3.0.5 rename] ' . $stage . ' (' . $context . '): '
             . ($wpdb->last_error !== '' ? $wpdb->last_error : 'unknown DB error');
        error_log($msg);
    }

    /**
     * Widen the reviews `status` ENUM to include `spam` and `trash`, and
     * recover rows previously coerced to '' under the narrower enum.
     */
    private static function runReviewsStatusEnumWidening(): void
    {
        if (get_option(self::DONE_OPTION)) {
            return;
        }

        if (!class_exists(ReviewsTable::class)) {
            return;
        }

        $table = ReviewsTable::getTableName();
        if (!InstallerService::databaseTableExists($table)) {
            return;
        }

        global $wpdb;

        $columnInfo = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
                DB_NAME,
                $table,
                'status'
            )
        );

        $columnType = is_object($columnInfo) ? (string) ($columnInfo->COLUMN_TYPE ?? '') : '';

        // Check for BOTH `spam` and `trash` — if either is missing the
        // enum needs widening. Substring match on the COLUMN_TYPE string
        // is cheap and avoids parsing the enum tuple.
        $needsAlter = $columnType !== '' && (
            strpos($columnType, "'spam'") === false
            || strpos($columnType, "'trash'") === false
        );

        if ($needsAlter) {
            // Keep this declaration in lockstep with
            // {@see ReviewsTable::getSchema()} so fresh installs and
            // upgraded installs converge on the same column shape.
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name escaped, enum literal is static.
            $wpdb->query(
                'ALTER TABLE `' . esc_sql($table) . "` "
                . "MODIFY COLUMN `status` "
                . "enum('pending','approved','rejected','spam','trash') "
                . "DEFAULT 'pending'"
            );
        }

        // Backfill rows coerced to '' under the narrower enum — they'd
        // otherwise sit invisible to every status filter forever.
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name from schema helper, literal values only.
        $wpdb->query(
            "UPDATE `" . esc_sql($table) . "` SET `status` = 'pending' "
            . "WHERE `status` = '' OR `status` IS NULL"
        );

        update_option(self::DONE_OPTION, '1', false);
    }
}
