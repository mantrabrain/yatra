<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\TripRepository;

/**
 * Trip Lifecycle Cron Service
 * Handles scheduled publish/unpublish and seasonal auto enable/disable.
 */
class TripLifecycleCronService
{
    public const CRON_HOOK = 'yatra_daily_trip_lifecycle';

    /**
     * Register WordPress cron hook (daily)
     */
    public static function registerCronHook(): void
    {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), 'daily', self::CRON_HOOK);
        }
    }

    /**
     * Unregister cron hook
     */
    public static function unregisterCronHook(): void
    {
        $timestamp = wp_next_scheduled(self::CRON_HOOK);
        if ($timestamp) {
            wp_unschedule_event($timestamp, self::CRON_HOOK);
        }
    }

    /**
     * Run lifecycle tasks:
     * - Scheduled publish/unpublish
     * - Seasonal auto enable/disable
     */
    public function runDaily(): void
    {
        // Use WP local time
        $now = current_time('mysql');
        $today = current_time('Y-m-d');

        $repo = new TripRepository();

        // Publish trips whose scheduled_publish_date has passed
        $repo->publishScheduledTrips($now);

        // Unpublish/archive trips whose scheduled_unpublish_date has passed
        $repo->archiveScheduledTrips($now);

        // Seasonal auto-enable: activate trips when enable date reached
        $repo->enableSeasonalTrips($today, $now);

        // Seasonal auto-disable: archive trips when disable date reached
        $repo->disableSeasonalTrips($today, $now);
    }
}

