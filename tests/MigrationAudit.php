<?php

namespace Yatra\Tests;

/**
 * Pre-flight / dry-run audit for the Track A data migrations.
 *
 * Read-only. It quantifies the exact deltas each risky migration will encounter
 * BEFORE any of them is written or applied — the "report deltas before applying"
 * safety net from the plan's backward-compat discipline. Each check maps to a
 * Track A item and answers: would the migration be safe as-is, and what is the
 * scope it must handle?
 *
 *   A7  UNIQUE(transaction_id)      — duplicate / empty transaction_ids
 *   A6  backfill amount_paid        — bookings.amount_paid vs payment ledger
 *   A4  reconcile booked_count      — trip_departures.booked_count vs live seats
 *   A3  coupon usage enforcement    — discounts.usage_count vs real usage
 *
 * Free-core only. Every query is a prepared SELECT — it never mutates data.
 *
 * @package Yatra\Tests
 * @since 3.0.9
 */
class MigrationAudit
{
    /** @var \wpdb */
    private $db;
    /** @var string */
    private $prefix;

    public function __construct()
    {
        global $wpdb;
        $this->db = $wpdb;
        $this->prefix = $wpdb->prefix . 'yatra_';
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function run(): array
    {
        return [
            'A7_transaction_id_unique'   => $this->auditTransactionIdUnique(),
            'A6_amount_paid_backfill'    => $this->auditAmountPaid(),
            'A4_booked_count_reconcile'  => $this->auditBookedCount(),
            'A3_coupon_usage'            => $this->auditCouponUsage(),
        ];
    }

    /**
     * A7 — a UNIQUE index on transaction_id fails if duplicates exist and needs
     * empty strings mapped to NULL first (MySQL permits multiple NULLs).
     *
     * @return array<string, mixed>
     */
    private function auditTransactionIdUnique(): array
    {
        $t = $this->prefix . 'booking_payments';

        $empty = (int) $this->db->get_var(
            "SELECT COUNT(*) FROM {$t} WHERE transaction_id IS NULL OR transaction_id = ''"
        );
        $dupeGroups = $this->db->get_results(
            "SELECT gateway, transaction_id, COUNT(*) AS c
             FROM {$t}
             WHERE transaction_id IS NOT NULL AND transaction_id <> ''
             GROUP BY gateway, transaction_id
             HAVING c > 1
             ORDER BY c DESC
             LIMIT 20",
            ARRAY_A
        ) ?: [];
        $dupeRows = array_sum(array_map(static fn($g) => (int) $g['c'], $dupeGroups));

        $safeAsIs = empty($dupeGroups);
        return [
            'item'         => 'A7 UNIQUE(gateway, transaction_id)',
            'empty_or_null_txn_ids' => $empty,
            'duplicate_groups'      => count($dupeGroups),
            'duplicate_rows'        => $dupeRows,
            'samples'      => array_slice($dupeGroups, 0, 5),
            'migration_plan' => $safeAsIs
                ? 'No non-empty duplicates. Map empty→NULL, then add UNIQUE(gateway, transaction_id).'
                : 'Dedupe non-empty duplicates first (keep earliest, flag rest — do NOT delete money rows), map empty→NULL, then add UNIQUE.',
            'blocks_apply' => !$safeAsIs,
        ];
    }

    /**
     * A6 — booking.amount_paid should equal the sum of that booking's completed
     * payments (refunds are negative rows). Reports drift the backfill will fix.
     *
     * @return array<string, mixed>
     */
    private function auditAmountPaid(): array
    {
        $b = $this->prefix . 'bookings';
        $p = $this->prefix . 'booking_payments';

        $rows = $this->db->get_results(
            "SELECT b.id,
                    CAST(b.amount_paid AS DECIMAL(12,2)) AS stored_paid,
                    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) AS ledger_paid
             FROM {$b} b
             LEFT JOIN {$p} p ON p.booking_id = b.id
             GROUP BY b.id, b.amount_paid
             HAVING ABS(stored_paid - ledger_paid) > 0.009
             ORDER BY ABS(stored_paid - ledger_paid) DESC
             LIMIT 50",
            ARRAY_A
        ) ?: [];

        return [
            'item'        => 'A6 backfill bookings.amount_paid from ledger',
            'mismatches'  => count($rows),
            'samples'     => array_slice($rows, 0, 8),
            'migration_plan' => empty($rows)
                ? 'No drift — amount_paid already matches the ledger for all bookings.'
                : 'Idempotent backfill: set amount_paid = SUM(completed payments) per booking. Dry-run diff first; never touch amounts already consistent.',
            'blocks_apply' => false,
        ];
    }

    /**
     * A4/A11 — trip_departures.booked_count should equal the live consumed seats
     * (sum of travelers_count for non-cancelled bookings linked to the departure).
     * Reports the inventory leak the reconcile will heal.
     *
     * @return array<string, mixed>
     */
    private function auditBookedCount(): array
    {
        $d  = $this->prefix . 'trip_departures';
        $bd = $this->prefix . 'booking_departures';
        $b  = $this->prefix . 'bookings';

        $rows = $this->db->get_results(
            "SELECT d.id AS departure_id,
                    d.trip_id,
                    CAST(d.booked_count AS SIGNED) AS stored_booked,
                    COALESCE(SUM(CASE WHEN b.status NOT IN ('cancelled') THEN b.travelers_count ELSE 0 END), 0) AS live_booked,
                    d.max_capacity
             FROM {$d} d
             LEFT JOIN {$bd} bd ON bd.departure_id = d.id
             LEFT JOIN {$b}  b  ON b.id = bd.booking_id
             GROUP BY d.id, d.trip_id, d.booked_count, d.max_capacity
             HAVING stored_booked <> live_booked
             ORDER BY ABS(stored_booked - live_booked) DESC
             LIMIT 50",
            ARRAY_A
        ) ?: [];

        $oversold = array_values(array_filter(
            $rows,
            static fn($r) => $r['max_capacity'] !== null && (int) $r['live_booked'] > (int) $r['max_capacity']
        ));

        return [
            'item'        => 'A4/A11 reconcile trip_departures.booked_count',
            'mismatches'  => count($rows),
            'oversold_departures' => count($oversold),
            'samples'     => array_slice($rows, 0, 8),
            'migration_plan' => empty($rows)
                ? 'No drift — booked_count matches live consumed seats everywhere.'
                : 'Idempotent recompute from live non-cancelled bookings; dry-run diff first; never release seats for confirmed-active bookings.',
            'blocks_apply' => false,
        ];
    }

    /**
     * A3 — discounts.usage_count is never incremented (bug), so it will read 0
     * while real usage may exceed the limit. Reports which coupons would start
     * blocking once enforcement goes live (the forward-only-cutover decision).
     *
     * @return array<string, mixed>
     */
    private function auditCouponUsage(): array
    {
        $disc = $this->prefix . 'discounts';
        $b    = $this->prefix . 'bookings';

        // Column names confirmed: discounts.code, .usage_count, .usage_limit; bookings.discount_code.
        $rows = $this->db->get_results(
            "SELECT dsc.id,
                    dsc.code,
                    CAST(dsc.usage_count AS SIGNED) AS stored_count,
                    CAST(dsc.usage_limit AS SIGNED) AS usage_limit,
                    COALESCE(used.real_count, 0) AS real_count
             FROM {$disc} dsc
             LEFT JOIN (
                 SELECT discount_code, COUNT(*) AS real_count
                 FROM {$b}
                 WHERE discount_code IS NOT NULL AND discount_code <> '' AND status NOT IN ('cancelled')
                 GROUP BY discount_code
             ) used ON used.discount_code = dsc.code
             ORDER BY real_count DESC
             LIMIT 100",
            ARRAY_A
        ) ?: [];

        $stale = array_values(array_filter(
            $rows,
            static fn($r) => (int) $r['stored_count'] !== (int) $r['real_count']
        ));
        $wouldBlock = array_values(array_filter(
            $rows,
            static fn($r) => (int) $r['usage_limit'] > 0 && (int) $r['real_count'] >= (int) $r['usage_limit']
        ));

        return [
            'item'            => 'A3 coupon usage enforcement (forward-only)',
            'coupons_checked' => count($rows),
            'stale_counts'    => count($stale),
            'would_block_immediately' => count($wouldBlock),
            'samples'         => array_slice($stale, 0, 8),
            'migration_plan'  => 'Backfill usage_count from real usage as a reported migration; enforce forward-only; warn on the coupons that would immediately hit their limit before flipping enforcement on.',
            'blocks_apply'    => false,
        ];
    }
}
