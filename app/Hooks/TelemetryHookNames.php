<?php

declare(strict_types=1);

namespace Yatra\Hooks;

/**
 * Action hook names used for usage telemetry and related lifecycle signals.
 *
 * Emitters call {@see do_action()} with these constants. {@see \Yatra\Admin\StatsUsage}
 * registers listeners against the same values — keep them in sync only here.
 *
 * @see \Yatra\Services\BookingService::createBooking() BOOKING_CREATED
 * @see \Yatra\Repositories\TripRepository::createWithRelations() TRIP_CREATED_WITH_RELATIONS
 * @see \Yatra\Controllers\SetupWizardController::handle_wizard_submit() SETUP_WIZARD_COMPLETED
 * @see \Yatra\Controllers\PaymentGatewayController::save_gateway_config() PAYMENT_GATEWAY_CONFIG_SAVED
 */
final class TelemetryHookNames
{
    public const BOOKING_CREATED = 'yatra_booking_created';

    public const TRIP_CREATED_WITH_RELATIONS = 'yatra_trip_created_with_relations';

    public const SETUP_WIZARD_COMPLETED = 'yatra_setup_wizard_completed';

    public const PAYMENT_GATEWAY_CONFIG_SAVED = 'yatra_payment_gateway_config_saved';
}
