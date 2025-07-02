<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Pricing service for dynamic pricing calculations
 */
class PricingService
{
    /**
     * Calculate trip price with all modifiers
     */
    public function calculatePrice(int $tripId, int $tripDateId, array $bookingData): float
    {
        // Get base trip price
        $basePrice = $this->getTripBasePrice($tripId);
        
        // Get trip date modifiers
        $dateModifiers = $this->getTripDateModifiers($tripDateId);
        
        // Calculate final price
        $finalPrice = $basePrice * $dateModifiers['price_modifier'];
        
        return max(0, $finalPrice);
    }

    /**
     * Get trip base price
     */
    private function getTripBasePrice(int $tripId): float
    {
        global $wpdb;
        
        $result = $wpdb->get_var($wpdb->prepare(
            "SELECT base_price FROM {$wpdb->prefix}yatra_trips WHERE id = %d",
            $tripId
        ));

        return (float) ($result ?: 0);
    }

    /**
     * Get trip date modifiers
     */
    private function getTripDateModifiers(int $tripDateId): array
    {
        global $wpdb;
        
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT price_modifier, fixed_price FROM {$wpdb->prefix}yatra_trip_dates WHERE id = %d",
            $tripDateId
        ));

        return [
            'price_modifier' => (float) ($result->price_modifier ?? 1.0),
            'fixed_price' => (float) ($result->fixed_price ?? 0)
        ];
    }
} 