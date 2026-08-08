<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Services\TripLifecycleCronService;
use Yatra\Services\DepartureCronService;
use Yatra\Services\BookingCronService;

/**
 * CronHooks
 * Registers and runs scheduled tasks (trip lifecycle, etc.).
 */
class CronHooks
{
    /**
     * Initialize cron-related hooks.
     */
    public static function init(): void
    {
        // Ensure lifecycle cron is scheduled (in case activation missed)
        add_action('init', [TripLifecycleCronService::class, 'registerCronHook']);

        // Daily handler
        add_action(TripLifecycleCronService::CRON_HOOK, function () {
            (new TripLifecycleCronService())->runDaily();
        });

        // Departure status cron: marks departures 'past' once their date passes.
        // This was written but never wired here, so departures kept their old
        // status forever — vanishing from the upcoming list (excluded by date)
        // while never appearing under Past (which looked for status = 'past').
        // The Past query is now date-based too (see DepartureRepository), so
        // display no longer depends on this cron; keeping the badge/status column
        // current is what this maintains.
        add_action('init', [DepartureCronService::class, 'registerCronHook']);
        add_action('yatra_daily_departure_status_update', function () {
            (new DepartureCronService())->dailyStatusUpdate();
        });

        // Booking completion cron: marks confirmed bookings 'completed' once
        // their tour date has passed, which is what fires the booking.completed
        // email / Email Automation sequence. BookingCronService::register() (its
        // reminder/expiry events) is not wired anywhere, so nothing here activates
        // those — only the completion sweep, which self-guards against emailing
        // historical bookings via an activation floor.
        add_action('init', [BookingCronService::class, 'registerCompletionCron']);
        add_action('yatra_booking_completion', [BookingCronService::class, 'completeFinishedBookings']);
    }
}
