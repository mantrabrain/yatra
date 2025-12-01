<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\DepartureRepository;

/**
 * Departure Cron Service
 * Handles daily cron job tasks for departure status updates
 */
class DepartureCronService
{
    private DepartureRepository $repository;

    public function __construct()
    {
        $this->repository = new DepartureRepository();
    }

    /**
     * Daily cron job handler
     * Updates statuses for all departures:
     * - Marks past departures (end_date < today)
     * - Marks full departures (booked_count >= max_capacity)
     * - Marks upcoming departures (otherwise)
     * 
     * Note: Uses end_date to determine if trip is complete (past)
     */
    public function dailyStatusUpdate(): void
    {
        error_log('Yatra: Running daily departure status update');
        
        $updated = $this->repository->recalculateAllStatuses();
        
        error_log("Yatra: Updated {$updated} departure statuses");
    }

    /**
     * Register WordPress cron hook
     */
    public static function registerCronHook(): void
    {
        if (!wp_next_scheduled('yatra_daily_departure_status_update')) {
            wp_schedule_event(time(), 'daily', 'yatra_daily_departure_status_update');
        }
    }

    /**
     * Unregister WordPress cron hook
     */
    public static function unregisterCronHook(): void
    {
        $timestamp = wp_next_scheduled('yatra_daily_departure_status_update');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'yatra_daily_departure_status_update');
        }
    }
}

