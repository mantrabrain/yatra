<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\PaymentNotesTable;

/**
 * Note history for a payment.
 *
 * @see PaymentNotesTable for why the legacy single `notes` column on the
 *      payments table is left in place rather than migrated.
 */
class PaymentNoteRepository
{
    private \wpdb $wpdb;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
    }

    public function getTableName(): string
    {
        return PaymentNotesTable::getTableName();
    }

    /**
     * Is the history table present? Sites that have not picked up the
     * idempotent creation step yet must degrade to "no history", never error.
     *
     * @see \Yatra\Services\InstallerService::maybeCreatePaymentNotesTable()
     */
    public function tableExists(): bool
    {
        $table = $this->getTableName();

        return (string) $this->wpdb->get_var(
            $this->wpdb->prepare('SHOW TABLES LIKE %s', $table)
        ) === $table;
    }

    /**
     * @return int Note id, or 0 when it could not be stored.
     */
    public function add(int $paymentId, string $note, ?int $bookingId = null, ?int $authorId = null): int
    {
        $note = trim(wp_kses_post($note));

        if ($paymentId <= 0 || $note === '' || !$this->tableExists()) {
            return 0;
        }

        $authorId = $authorId ?? get_current_user_id();
        $authorName = '';

        if ($authorId > 0) {
            $user = get_userdata($authorId);
            if ($user instanceof \WP_User) {
                $authorName = trim((string) $user->display_name) !== ''
                    ? (string) $user->display_name
                    : (string) $user->user_login;
            }
        }

        $inserted = $this->wpdb->insert($this->getTableName(), [
            'payment_id' => $paymentId,
            'booking_id' => $bookingId !== null && $bookingId > 0 ? $bookingId : null,
            'note' => $note,
            'author_id' => $authorId > 0 ? $authorId : null,
            // Snapshot, so the entry stays attributable after the author's
            // account is removed from the site.
            'author_name' => $authorName !== '' ? $authorName : null,
            'created_at' => current_time('mysql'),
        ]);

        return $inserted ? (int) $this->wpdb->insert_id : 0;
    }

    /**
     * Oldest first — a history reads in the order things happened.
     *
     * @return array<int, object>
     */
    public function findByPaymentId(int $paymentId): array
    {
        if ($paymentId <= 0 || !$this->tableExists()) {
            return [];
        }

        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM {$this->getTableName()} WHERE payment_id = %d ORDER BY created_at ASC, id ASC",
            $paymentId
        )) ?: [];
    }

    public function countForPayment(int $paymentId): int
    {
        if ($paymentId <= 0 || !$this->tableExists()) {
            return 0;
        }

        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->getTableName()} WHERE payment_id = %d",
            $paymentId
        ));
    }

    public function deleteByPaymentId(int $paymentId): bool
    {
        if ($paymentId <= 0 || !$this->tableExists()) {
            return false;
        }

        return $this->wpdb->delete($this->getTableName(), ['payment_id' => $paymentId]) !== false;
    }
}
