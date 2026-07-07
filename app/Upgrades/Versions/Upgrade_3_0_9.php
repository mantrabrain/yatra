<?php

declare(strict_types=1);

namespace Yatra\Upgrades\Versions;

use Yatra\Services\InstallerService;
use Yatra\Upgrades\Contracts\UpgradeStepInterface;

/**
 * Free 3.0.9 maintenance step — one-time reconcile of trip-departure
 * `booked_count`.
 *
 * Before the A1 overbooking fix, direct checkout inserted the booking *before*
 * claiming the seat (and ignored the atomic capacity guard), while expired
 * bookings never released their seat — {@see \Yatra\Repositories\BookingRepository::expireBooking()}
 * raw-updated the status without decrementing. The net effect is drifted
 * `trip_departures.booked_count`: some departures read as sold-out when they
 * aren't, others were silently oversold. This step recomputes `booked_count`
 * from the live source of truth — the travelers on non-cancelled, non-refunded,
 * non-waitlist bookings still linked to each departure — so the counter matches
 * reality. The A1 reserve-then-insert fix plus the expiry seat-release keep it
 * correct going forward.
 *
 * **Non-destructive**: it only UPDATEs the derived `booked_count` counter to its
 * correct recomputed value. It never issues DROP/DELETE/TRUNCATE and touches no
 * booking, payment, or traveler row. Idempotent (recompute is deterministic) and
 * gated by a one-shot option flag — mirrors {@see Upgrade_3_0_5}. Version-
 * independent because the drift ships in 3.0.x itself, so installs already on
 * the current version still heal.
 */
final class Upgrade_3_0_9 implements UpgradeStepInterface
{
    /** One-shot flag for the booked_count reconcile. */
    public const DONE_OPTION = 'yatra_departure_booked_count_reconciled_v1';

    /** One-shot flag for the booking_payments transaction_id UNIQUE index. */
    public const TXN_UNIQUE_DONE_OPTION = 'yatra_booking_payments_txn_unique_v1';

    /** One-shot flag for the reviews.verified column. */
    public const REVIEW_VERIFIED_DONE_OPTION = 'yatra_reviews_verified_column_v1';

    public static function targetVersion(): string
    {
        return '3.0.9';
    }

    /**
     * Run until BOTH one-shot heals are recorded. Ignores version comparison:
     * the issues ship IN 3.0.x, so installs whose stored version already equals
     * the code version must still heal. The option gates keep {@see run()} cheap.
     */
    public static function shouldApply(string $fromVersion, string $toVersion): bool
    {
        unset($fromVersion, $toVersion);

        return !get_option(self::DONE_OPTION)
            || !get_option(self::TXN_UNIQUE_DONE_OPTION)
            || !get_option(self::REVIEW_VERIFIED_DONE_OPTION);
    }

    public static function runOnHooks(): array
    {
        return ['admin_init'];
    }

    /**
     * Both heals are independent and each gated by its own one-shot flag, so a
     * failure in one never blocks the other (mirrors {@see Upgrade_3_0_5}).
     */
    public static function run(string $fromVersion, string $toVersion): void
    {
        unset($fromVersion, $toVersion);

        // A: reconcile drifted departure booked_count.
        if (!get_option(self::DONE_OPTION)) {
            try {
                self::reconcileBookedCounts();
                self::markDone(self::DONE_OPTION);
            } catch (\Throwable $e) {
                if (function_exists('error_log')) {
                    error_log('[Yatra 3.0.9 booked_count reconcile] ' . $e->getMessage());
                }
                // Leave the flag unset so the next admin pageview retries.
            }
        }

        // B: add the UNIQUE(gateway, transaction_id) index that backstops the
        // payment idempotency guard against duplicate rows.
        if (!get_option(self::TXN_UNIQUE_DONE_OPTION)) {
            try {
                self::addTransactionIdUniqueIndex();
                self::markDone(self::TXN_UNIQUE_DONE_OPTION);
            } catch (\Throwable $e) {
                if (function_exists('error_log')) {
                    error_log('[Yatra 3.0.9 txn-unique] ' . $e->getMessage());
                }
                // Leave the flag unset so it retries (e.g. after an operator
                // reconciles pre-existing duplicate transaction_ids by hand).
            }
        }

        // C: add the reviews.verified column (verified-purchase trust flag).
        if (!get_option(self::REVIEW_VERIFIED_DONE_OPTION)) {
            try {
                self::addReviewVerifiedColumn();
                self::markDone(self::REVIEW_VERIFIED_DONE_OPTION);
            } catch (\Throwable $e) {
                if (function_exists('error_log')) {
                    error_log('[Yatra 3.0.9 reviews-verified] ' . $e->getMessage());
                }
            }
        }
    }

    /** Autoload the one-shot flag so subsequent checks are in-memory. */
    private static function markDone(string $option): void
    {
        if (false === get_option($option)) {
            add_option($option, '1', '', 'yes');
        } else {
            update_option($option, '1');
        }
    }

    /**
     * Recompute `trip_departures.booked_count` = SUM(travelers_count) over the
     * bookings still linked to each departure whose status consumes a seat.
     *
     * A single correlated UPDATE keeps it atomic and idempotent. Statuses
     * `cancelled` / `refunded` release the seat (and are normally unlinked
     * already); `waitlist` never holds one. Departures with no consuming
     * bookings settle to 0.
     */
    private static function reconcileBookedCounts(): void
    {
        global $wpdb;

        $departuresTable = $wpdb->prefix . 'yatra_trip_departures';
        $bookingDeparturesTable = $wpdb->prefix . 'yatra_booking_departures';
        $bookingsTable = $wpdb->prefix . 'yatra_bookings';

        if (!InstallerService::databaseTableExists($departuresTable)
            || !InstallerService::databaseTableExists($bookingDeparturesTable)
            || !InstallerService::databaseTableExists($bookingsTable)
        ) {
            return;
        }

        $departures = esc_sql($departuresTable);
        $bookingDepartures = esc_sql($bookingDeparturesTable);
        $bookings = esc_sql($bookingsTable);

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table names escaped; status literals static.
        $wpdb->query(
            "UPDATE `{$departures}` d
             SET d.booked_count = (
                 SELECT COALESCE(SUM(b.travelers_count), 0)
                 FROM `{$bookingDepartures}` bd
                 INNER JOIN `{$bookings}` b ON b.id = bd.booking_id
                 WHERE bd.departure_id = d.id
                   AND b.status NOT IN ('cancelled', 'refunded', 'waitlist')
             )"
        );
    }

    /**
     * Add a UNIQUE(gateway, transaction_id) index to `booking_payments` so the
     * SELECT-then-INSERT idempotency guard in the payment-completion paths has a
     * DB-level backstop against duplicate rows (retried submits, webhook races).
     *
     * Safe, non-destructive sequence:
     *  - no-op if the index already exists (idempotent / fresh installs);
     *  - REFUSE (throw, leaving the one-shot unset) if non-empty duplicate
     *    (gateway, transaction_id) pairs exist — we never delete money rows;
     *    the operator reconciles by hand and the next pageview retries;
     *  - map empty-string transaction_ids to NULL so offline / pay-later
     *    payments (which carry no gateway transaction) don't collide — MySQL
     *    permits multiple NULLs in a unique index;
     *  - then add the index. The existing non-unique `idx_transaction_id`
     *    stays for lookups by transaction_id alone.
     */
    private static function addTransactionIdUniqueIndex(): void
    {
        global $wpdb;

        $tableName = $wpdb->prefix . 'yatra_booking_payments';
        if (!InstallerService::databaseTableExists($tableName)) {
            return;
        }

        $indexExists = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                 WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND INDEX_NAME = %s",
                DB_NAME,
                $tableName,
                'uniq_gateway_transaction'
            )
        );
        if ($indexExists > 0) {
            return; // already migrated / fresh install
        }

        $table = esc_sql($tableName);

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name escaped; no user input.
        $duplicates = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM (
                 SELECT gateway, transaction_id
                 FROM `{$table}`
                 WHERE transaction_id IS NOT NULL AND transaction_id <> ''
                 GROUP BY gateway, transaction_id
                 HAVING COUNT(*) > 1
             ) d"
        );
        if ($duplicates > 0) {
            // Never delete money rows to force a unique index — defer instead.
            throw new \RuntimeException(
                $duplicates . ' duplicate (gateway, transaction_id) group(s) present; skipping unique index until reconciled.'
            );
        }

        // Empty string → NULL so offline payments don't collide under the index.
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name escaped.
        $wpdb->query("UPDATE `{$table}` SET transaction_id = NULL WHERE transaction_id = ''");

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name escaped; index def static.
        $result = $wpdb->query("ALTER TABLE `{$table}` ADD UNIQUE KEY `uniq_gateway_transaction` (`gateway`, `transaction_id`)");
        if ($result === false) {
            throw new \RuntimeException('failed to add uniq_gateway_transaction: ' . ($wpdb->last_error ?: 'unknown DB error'));
        }
    }

    /**
     * Add the `verified` column to `reviews` if missing. Additive + idempotent:
     * a purchase-verified trust flag (default 0) that the review UI/schema
     * surface. Never drops or rewrites anything.
     */
    private static function addReviewVerifiedColumn(): void
    {
        global $wpdb;

        $tableName = $wpdb->prefix . 'yatra_reviews';
        if (!InstallerService::databaseTableExists($tableName)) {
            return;
        }

        $hasColumn = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
                DB_NAME,
                $tableName,
                'verified'
            )
        );
        if ($hasColumn > 0) {
            return; // already present / fresh install
        }

        $table = esc_sql($tableName);
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name escaped; column def static.
        $result = $wpdb->query(
            "ALTER TABLE `{$table}` ADD COLUMN `verified` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0 AFTER `helpful_count`"
        );
        if ($result === false) {
            throw new \RuntimeException('failed to add reviews.verified: ' . ($wpdb->last_error ?: 'unknown DB error'));
        }
    }
}
