<?php
/**
 * Dynamic Pricing — placeholder (Free plugin)
 *
 * This file used to ship a small example implementation that auto-enabled
 * dynamic pricing and applied hard-coded `*1.15` / `*0.9` math, which double-
 * applied or conflicted with the real engine in Yatra Pro
 * (`YatraPro\Modules\DynamicPricing`). It is now a no-op stub kept only to
 * preserve class-name back-compat.
 *
 * The Free plugin's role is purely to expose pricing filters — actual rule
 * evaluation lives in the Pro module:
 *   - yatra_dynamic_pricing_enabled
 *   - yatra_availability_price
 *   - yatra_trip_display_price
 *   - yatra_booking_trip_price
 *
 * @package Yatra\Services
 */

namespace Yatra\Services;

class DynamicPricingService
{
    /**
     * Intentionally a no-op. The Pro DynamicPricing module owns all rule
     * registration, calculation, and the `yatra_dynamic_pricing_enabled` flag.
     */
    public static function init(): void
    {
        // no-op
    }
}
