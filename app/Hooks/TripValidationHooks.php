<?php
/**
 * Trip Validation Hooks
 * 
 * Validates trip settings like default status, advance booking days, etc.
 * 
 * @package Yatra\Hooks
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Hooks;

use Yatra\Services\SettingsService;

class TripValidationHooks
{
    /**
     * Initialize hooks
     */
    public static function init(): void
    {
        // Validate trip status on creation
        add_filter('yatra_trip_default_status', [self::class, 'applyDefaultTripStatus']);
        
        // Validate booking advance days
        add_filter('yatra_validate_booking_date', [self::class, 'validateBookingAdvanceDays'], 10, 2);
        
        // Apply minimum participants requirement
        add_filter('yatra_validate_booking_participants', [self::class, 'validateMinimumParticipants'], 10, 2);
    }
    
    /**
     * Apply default trip status from settings
     */
    public static function applyDefaultTripStatus(string $status): string
    {
        $default_status = SettingsService::getString('default_trip_status', 'draft');
        
        if (!empty($default_status) && in_array($default_status, ['draft', 'publish', 'pending'])) {
            return $default_status;
        }
        
        return $status;
    }
    
    /**
     * Validate booking advance days
     * 
     * @param bool $valid Current validation status
     * @param string $booking_date Requested booking date
     * @return bool
     */
    public static function validateBookingAdvanceDays(bool $valid, string $booking_date): bool
    {
        if (!$valid) {
            return false;
        }
        
        $advance_days = SettingsService::getInt('booking_advance_days', 0);
        
        if ($advance_days <= 0) {
            return true; // No restriction
        }
        
        $booking_timestamp = strtotime($booking_date);
        $min_booking_date = strtotime("+{$advance_days} days");
        
        if ($booking_timestamp < $min_booking_date) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate minimum participants requirement
     * 
     * @param bool $valid Current validation status
     * @param int $participants Number of participants
     * @return bool
     */
    public static function validateMinimumParticipants(bool $valid, int $participants): bool
    {
        if (!$valid) {
            return false;
        }
        
        if (!SettingsService::isEnabled('require_minimum_participants')) {
            return true; // No requirement
        }
        
        $minimum = SettingsService::getInt('minimum_participants', 1);
        
        return $participants >= $minimum;
    }
}
