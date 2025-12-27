<?php

namespace Yatra\Migration;

use Yatra\Database\Tables\BookingsTable;
use Yatra\Migration\MigrationProgress;

class BookingMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $oldTable = $this->wpdb->prefix . 'yatra_booking';

        if (!$this->tableExists($oldTable)) {
            return compact('migrated', 'skipped', 'failed');
        }

        $oldBookings = $this->wpdb->get_results("SELECT * FROM {$oldTable}");
        $total = count($oldBookings);

        foreach ($oldBookings as $oldBooking) {
            try {
                // Map old trip ID to new trip ID
                if (!$this->isForceMigration() && $this->getMigratedTripId($oldBooking->tour_id ?? 0)) {
                    $skipped++;
                    $this->updateProgress('bookings', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $newTripId = $this->getMigratedTripId($oldBooking->tour_id ?? 0);

                if (!$newTripId) {
                    $skipped++;
                    $this->updateProgress('bookings', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $inserted = $this->wpdb->insert(
                    BookingsTable::getTableName(),
                    [
                        'trip_id' => $newTripId,
                        'customer_id' => $oldBooking->customer_id ?? null,
                        'booking_code' => $oldBooking->booking_code ?? uniqid('YTR-'),
                        'total_travelers' => $oldBooking->number_of_person ?? 1,
                        'total_price' => $oldBooking->total_price ?? 0,
                        'paid_amount' => $oldBooking->paid_amount ?? 0,
                        'due_amount' => $oldBooking->due_amount ?? 0,
                        'status' => $oldBooking->status ?? 'pending',
                        'booking_date' => $oldBooking->booking_date ?? current_time('mysql'),
                        'travel_date' => $oldBooking->tour_date ?? null,
                        'created_at' => $oldBooking->created_at ?? current_time('mysql'),
                        'updated_at' => $oldBooking->updated_at ?? current_time('mysql'),
                    ]
                );

                if ($inserted) {
                    $migrated++;
                } else {
                    $failed++;
                }

                $this->updateProgress('bookings', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Exception $e) {
                $failed++;
                $this->updateProgress('bookings', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }
}
