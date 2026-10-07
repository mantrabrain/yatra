<?php

declare(strict_types=1);

namespace Yatra\Upgrades\Versions;

use Yatra\Services\ReviewReminderService;
use Yatra\Upgrades\AbstractUpgradeStep;

/**
 * Free 3.0.17: drain review reminders queued against the old anchor.
 *
 * Until this release the review request was scheduled for "now + N days",
 * measured from the moment a booking was marked completed. The daily
 * auto-completion sweep can complete a long backlog of finished tours in a
 * single run, so sites ended up with a queue of reminders for trips that had
 * ended weeks or months earlier — all due to fire together.
 *
 * {@see ReviewReminderService} now anchors on the tour's end date and refuses
 * anything older than its staleness cap, but those are decisions taken when the
 * reminder is scheduled. Events already sitting in wp_cron carry no such rule,
 * so upgrading alone would not spare the installs that are carrying one. This
 * clears them once.
 *
 * The service also re-checks the window when an event actually fires, so a
 * reminder queued between this step running and the upgrade completing is still
 * declined rather than sent.
 */
final class Upgrade_3_0_17 extends AbstractUpgradeStep
{
    public static function targetVersion(): string
    {
        return '3.0.17';
    }

    public static function runOnHooks(): array
    {
        return ['admin_init'];
    }

    public static function run(string $fromVersion, string $toVersion): void
    {
        unset($fromVersion, $toVersion);

        ReviewReminderService::purgeStaleScheduledReminders();
    }
}
