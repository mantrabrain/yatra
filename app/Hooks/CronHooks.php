<?php

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Services\TripLifecycleCronService;

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
    }
}
