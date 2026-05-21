<?php

declare(strict_types=1);

namespace Yatra\Upgrades\Versions;

use Yatra\Database\Tables\ReviewsTable;
use Yatra\Services\InstallerService;
use Yatra\Upgrades\Contracts\UpgradeStepInterface;

/**
 * Free 3.0.5: widen the reviews `status` ENUM to include `spam` and `trash`.
 *
 * Why: the admin React UI (Reviews list + Add/Edit form, bulk-action API)
 * exposes four statuses — pending / approved / spam / trash — and the bulk
 * endpoint accepts `mark_spam` / `mark_trash`. But the original schema only
 * declared ENUM('pending','approved','rejected'). MySQL silently coerces
 * values outside the enum to '' on write, so admin "spam this review"
 * calls were landing in DB as empty string — invisible to every status
 * filter and impossible to recover from the UI.
 *
 * Why this step doesn't subclass {@see AbstractUpgradeStep}: that base's
 * {@see shouldApply()} only returns true when crossing the target version
 * from below. Here, the heal must fire on installs whose stored
 * `yatra_version` is *already* 3.0.5 (because the bug shipped IN that
 * version) — so the runner's version-comparison short-circuit would skip
 * us. We override `shouldApply()` to gate on a one-shot option flag
 * instead, and {@see FreeUpgradeRunner::runIdempotentMaintenance()} calls
 * us directly so we run on every admin pageview until the one-shot fires.
 *
 * dbDelta cannot widen ENUMs (it only adds new columns / indices), so we
 * issue the ALTER directly. Also re-classifies any rows previously
 * coerced to '' back to 'pending' so they reappear in admin filters —
 * 'pending' is the safest default since we can't recover the operator's
 * original intent; an admin can re-stamp them now that values persist.
 */
final class Upgrade_3_0_5 implements UpgradeStepInterface
{
    /** Option flag — set after a successful run so the ALTER fires at most once per install. */
    public const DONE_OPTION = 'yatra_reviews_status_enum_widened_v1';

    public static function targetVersion(): string
    {
        return '3.0.5';
    }

    /**
     * Run whenever the one-shot heal flag hasn't been set yet.
     *
     * Deliberately ignores version comparison: the bug ships in 3.0.5
     * itself, so installs on stored_version=3.0.5 must still heal. The
     * registry-driven version-chain path is harmless for us — the option
     * gate makes run() idempotent — but the live entry point is
     * {@see FreeUpgradeRunner::runIdempotentMaintenance()}.
     */
    public static function shouldApply(string $fromVersion, string $toVersion): bool
    {
        unset($fromVersion, $toVersion);

        return !get_option(self::DONE_OPTION);
    }

    public static function runOnHooks(): array
    {
        return ['admin_init'];
    }

    public static function run(string $fromVersion, string $toVersion): void
    {
        unset($fromVersion, $toVersion);

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
