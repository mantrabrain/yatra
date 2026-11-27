<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Database\Tables\BookingActivityTable;

/**
 * Activity log of a booking.
 *
 * @see BookingActivityTable
 */
class BookingActivityRepository
{
    private \wpdb $wpdb;

    /** @var bool|null Per-request cache of the table check. */
    private static ?bool $exists = null;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
    }

    public function getTableName(): string
    {
        return BookingActivityTable::getTableName();
    }

    /**
     * Is the table present? Sites that haven't picked up the creation step
     * yet must degrade to "no activity", never error.
     *
     * @see \Yatra\Services\InstallerService::maybeCreateBookingActivityTable()
     */
    public function tableExists(): bool
    {
        if (self::$exists === null) {
            $table = $this->getTableName();
            self::$exists = (string) $this->wpdb->get_var($this->wpdb->prepare('SHOW TABLES LIKE %s', $table)) === $table;
        }

        return self::$exists;
    }

    /** Forget the cached table check (after creating the table, in tests). */
    public static function resetCache(): void
    {
        self::$exists = null;
    }

    /**
     * @param array<string, mixed> $meta
     * @return int Entry id, or 0 when it could not be stored.
     */
    public function add(int $bookingId, string $type, string $message, array $meta = [], ?int $authorId = null): int
    {
        $type = substr(sanitize_key($type), 0, 40);
        // Plain text: the history shows it as text, and kses would turn "&" into "&amp;".
        $message = trim(sanitize_textarea_field($message));

        if ($bookingId <= 0 || $type === '' || $message === '' || !$this->tableExists()) {
            return 0;
        }

        $authorId = $authorId ?? get_current_user_id();
        $authorName = '';
        if ($authorId > 0) {
            $user = get_userdata($authorId);
            if ($user instanceof \WP_User) {
                $authorName = trim((string) $user->display_name) !== '' ? (string) $user->display_name : (string) $user->user_login;
            }
        }

        $inserted = $this->wpdb->insert($this->getTableName(), [
            'booking_id' => $bookingId,
            'type' => $type,
            'message' => $message,
            'meta' => $meta !== [] ? wp_json_encode($meta) : null,
            'author_id' => $authorId > 0 ? $authorId : null,
            'author_name' => $authorName !== '' ? $authorName : null,
            'created_at' => current_time('mysql'),
        ]);

        return $inserted ? (int) $this->wpdb->insert_id : 0;
    }

    /**
     * Oldest first.
     *
     * @return array<int, object>
     */
    public function findByBookingId(int $bookingId, int $limit = 500): array
    {
        if ($bookingId <= 0 || !$this->tableExists()) {
            return [];
        }

        return $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM {$this->getTableName()} WHERE booking_id = %d ORDER BY created_at ASC, id ASC LIMIT %d",
            $bookingId,
            max(1, $limit)
        )) ?: [];
    }

    public function deleteByBookingId(int $bookingId): bool
    {
        if ($bookingId <= 0 || !$this->tableExists()) {
            return false;
        }

        return $this->wpdb->delete($this->getTableName(), ['booking_id' => $bookingId]) !== false;
    }
}
