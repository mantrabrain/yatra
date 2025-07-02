<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\Container;
use Yatra\Core\ServiceProvider;
use Yatra\Controllers\Api\V1\TripApiController;
use Yatra\Controllers\Api\V1\BookingApiController;
use Yatra\Controllers\Api\V1\PaymentApiController;
use Yatra\Controllers\Api\V1\WebhookController;
use Yatra\Api\SettingsApi;
use Yatra\Api\ActivitiesApi;

/**
 * API service provider
 */
class ApiServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Register API controllers
        $this->container->singleton('api.trip_controller', TripApiController::class);
        $this->container->singleton('api.booking_controller', BookingApiController::class);
        $this->container->singleton('api.payment_controller', PaymentApiController::class);
        $this->container->singleton('api.webhook_controller', WebhookController::class);
        
        // Register REST API endpoints
        (new SettingsApi())->register();
        new ActivitiesApi();
    }
} 