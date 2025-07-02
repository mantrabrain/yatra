<?php

declare(strict_types=1);

namespace Yatra\Providers;

use Yatra\Core\Container;
use Yatra\Core\ServiceProvider;
use Yatra\Services\BookingService;
use Yatra\Services\PaymentService;
use Yatra\Services\PricingService;
use Yatra\Services\NotificationService;
use Yatra\Services\EmailService;
use Yatra\Services\SearchService;
use Yatra\Services\ReportService;
use Yatra\Services\InventoryService;
use Yatra\Services\CurrencyService;
use Yatra\Services\ImportExportService;

/**
 * Main application service provider
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Register core services
        $this->container->singleton('booking_service', BookingService::class);
        $this->container->singleton('payment_service', PaymentService::class);
        $this->container->singleton('pricing_service', PricingService::class);
        $this->container->singleton('notification_service', NotificationService::class);
        $this->container->singleton('email_service', EmailService::class);
        $this->container->singleton('search_service', SearchService::class);
        $this->container->singleton('report_service', ReportService::class);
        $this->container->singleton('inventory_service', InventoryService::class);
        $this->container->singleton('currency_service', CurrencyService::class);
        $this->container->singleton('import_export_service', ImportExportService::class);

        // Register repositories
        $this->container->singleton('destination_repository', \Yatra\Repositories\DestinationRepository::class);
        $this->container->singleton('trip_repository', \Yatra\Repositories\TripRepository::class);
        $this->container->singleton('booking_repository', \Yatra\Repositories\BookingRepository::class);
        $this->container->singleton('payment_repository', \Yatra\Repositories\PaymentRepository::class);
        $this->container->singleton('review_repository', \Yatra\Repositories\ReviewRepository::class);
        $this->container->singleton('customer_repository', \Yatra\Repositories\CustomerRepository::class);

        // Register models
        $this->container->singleton('destination_model', \Yatra\Models\Destination::class);
        $this->container->singleton('trip_model', \Yatra\Models\Trip::class);
        $this->container->singleton('booking_model', \Yatra\Models\Booking::class);
        $this->container->singleton('payment_model', \Yatra\Models\Payment::class);
        $this->container->singleton('review_model', \Yatra\Models\Review::class);
        $this->container->singleton('customer_model', \Yatra\Models\Customer::class);
    }
} 