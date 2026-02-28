<?php
/**
 * Dynamic Pricing Service for Yatra Plugin
 *
 * Handles dynamic pricing calculations and filters
 *
 * @package Yatra\Services
 */

namespace Yatra\Services;

class DynamicPricingService
{
    /**
     * Initialize dynamic pricing hooks
     */
    public static function init(): void
    {
        // Enable dynamic pricing module
        add_filter('yatra_dynamic_pricing_enabled', '__return_true');

        // Register pricing filters
        add_filter('yatra_availability_price', [self::class, 'applyDynamicPricing'], 10, 3);
        add_filter('yatra_trip_display_price', [self::class, 'applyDisplayPricing'], 10, 3);
        add_filter('yatra_booking_trip_price', [self::class, 'applyBookingPricing'], 10, 3);
    }

    /**
     * Apply dynamic pricing logic
     *
     * @param float $price
     * @param int $trip_id
     * @param array $context
     * @return float
     */
    public static function applyDynamicPricing(float $price, int $trip_id, array $context): float
    {
        // Debug logging
        $original_price = $price;

        // Apply basic dynamic pricing logic
        $departure_date = $context['departure_date'] ?? null;
        $spots_remaining = $context['spots_remaining'] ?? null;

        // Example: Increase price if less than 5 spots remaining (high demand)
        if ($spots_remaining !== null && $spots_remaining <= 5 && $spots_remaining > 0) {
            $price = $price * 1.15; // 15% increase for high demand
            }

        // Example: Early bird discount (more than 30 days in advance)
        if ($departure_date) {
            $days_until = (strtotime($departure_date) - time()) / (60 * 60 * 24);
            if ($days_until > 30) {
                $price = $price * 0.9; // 10% early bird discount
                }
        }

        return $price;
    }

    /**
     * Apply dynamic pricing for trip display pages
     *
     * @param float $price
     * @param int $trip_id
     * @param array $context
     * @return float
     */
    public static function applyDisplayPricing(float $price, int $trip_id, array $context): float
    {
        // Apply same logic for trip display pages
        return apply_filters('yatra_availability_price', $price, $trip_id, $context);
    }

    /**
     * Apply dynamic pricing for booking calculations
     *
     * @param float $price
     * @param int $trip_id
     * @param array $context
     * @return float
     */
    public static function applyBookingPricing(float $price, int $trip_id, array $context): float
    {
        // Apply same logic for booking calculations
        return apply_filters('yatra_availability_price', $price, $trip_id, $context);
    }
}
