<?php

namespace Yatra\Database\Tables;

/**
 * Booking activity log (wp_yatra_booking_activity).
 *
 * What happened to a booking and who did it: status changes, emails sent,
 * internal notes, price adjustments, edits, automatic expiry. Payments and
 * refunds are NOT copied here — the payments table is their record, and the
 * booking timeline reads them from there, so the two can never disagree.
 *
 * `author_name` is a snapshot so an entry stays attributable after the staff
 * member's account is removed. `meta` holds small JSON details (old/new
 * status, amounts, email type).
 *
 * @package Yatra\Database\Tables
 */
class BookingActivityTable extends BaseTable
{
    protected static string $table = 'yatra_booking_activity';

    public static function getSchema(): string
    {
        $tableName = static::getTableName();
        $charsetCollate = static::getCharsetCollate();

        return <<<SQL
CREATE TABLE IF NOT EXISTS `{$tableName}` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `booking_id` bigint(20) UNSIGNED NOT NULL,
    `type` varchar(40) NOT NULL,
    `message` text NOT NULL,
    `meta` longtext DEFAULT NULL,
    `author_id` bigint(20) UNSIGNED DEFAULT NULL,
    `author_name` varchar(190) DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_booking_created` (`booking_id`, `created_at`),
    KEY `idx_type` (`type`)
) {$charsetCollate} COMMENT='Booking activity log';
SQL;
    }
}
