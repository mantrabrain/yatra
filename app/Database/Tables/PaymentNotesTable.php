<?php

namespace Yatra\Database\Tables;

/**
 * PaymentNotes Table Class
 *
 * Chronological note history against a payment (wp_yatra_payment_notes).
 *
 * The payments table has always had a single `notes` text column, which the
 * refund flow and the payment form both wrote to — so recording why a refund was
 * issued overwrote whatever was there before, and there was no way to tell when
 * a note was added or by whom. That column is left exactly as it is (nothing
 * stops reading or writing it, and the first entry in a payment's history is
 * read from it); notes added from now on become rows here instead.
 *
 * `author_name` is stored alongside `author_id` on purpose: a note is a record
 * of who said what and when, and it has to stay readable after the staff member
 * who wrote it has been removed from the site.
 *
 * @package Yatra\Database\Tables
 */
class PaymentNotesTable extends BaseTable
{
    protected static string $table = 'yatra_payment_notes';

    public static function getSchema(): string
    {
        $tableName = static::getTableName();
        $charsetCollate = static::getCharsetCollate();

        return <<<SQL
CREATE TABLE IF NOT EXISTS `{$tableName}` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `payment_id` bigint(20) UNSIGNED NOT NULL,
    `booking_id` bigint(20) UNSIGNED DEFAULT NULL,
    `note` text NOT NULL,
    `author_id` bigint(20) UNSIGNED DEFAULT NULL,
    `author_name` varchar(190) DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_payment_created` (`payment_id`, `created_at`),
    KEY `idx_booking_id` (`booking_id`)
) {$charsetCollate} COMMENT='Payment note history';
SQL;
    }
}
