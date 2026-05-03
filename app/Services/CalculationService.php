<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Services\SettingsService;
use Yatra\Services\DiscountService;
use Yatra\Repositories\TripRepository;

/**
 * Core Pricing Calculation Service
 * 
 * Single source of truth for ALL pricing calculations.
 * Both booking session and checkout MUST go through this service.
 * 
 * PRICING LOGIC:
 * - Regular pricing: discounted_price → sale_price → original_price
 * - Traveler-based pricing: per-category discounted → sale → original prices
 * 
 * FREE PLUGIN FEATURES (handled here):
 * - Base pricing (regular & traveler-based)
 * - Tax calculations (single & multiple)
 * - Coupon discount (via DiscountService)
 * - Group discount (via DiscountService, requires Pro AdvancedDiscount module)
 * - Payment amounts (full only, deposit/partial via Pro)
 * 
 * PRO MODULE INTEGRATION (via filter hooks):
 * - Dynamic Pricing    → yatra_booking_trip_price (modifies per-unit price)
 * - Additional Services → yatra_booking_services_total (adds services cost)
 * - Advanced Discount   → yatra_advanced_discount_enabled (enables group discounts)
 * - Flexible Payments   → yatra_calculate_amount_due (deposit/partial payments)
 * 
 * FILTER HOOKS (in execution order):
 *  1. yatra_before_calculation_params  - Modify input params
 *  2. yatra_booking_trip_price         - Dynamic pricing per-unit price modification
 *  3. yatra_calculate_base_amount      - Modify calculated base amount
 *  4. yatra_booking_services_total     - Additional services cost (Pro)
 *  5. yatra_calculate_subtotal         - Modify subtotal (base + services)
 *  6. yatra_calculate_group_discount   - Group discount (Pro AdvancedDiscount)
 *  7. yatra_calculate_coupon_discount  - Coupon discount
 *  8. yatra_calculate_final_total      - Modify final total after tax
 *  9. yatra_calculate_amount_due       - Flexible payment amounts (Pro)
 * 10. yatra_after_calculation_result   - Modify complete result
 * 
 * @package Yatra\Services
 */
class CalculationService
{
    /**
     * Core pricing calculation (fetches trip data from repository)
     * 
     * @param array $params Calculation parameters
     * @return array Complete pricing breakdown
     */
    public function calculatePricing(array $params): array
    {
        $params = apply_filters('yatra_before_calculation_params', $params);
        
        // Extract parameters
        $trip_id         = (int) ($params['trip_id'] ?? 0);
        $travelers_count = (int) ($params['travelers_count'] ?? 1);
        $traveler_counts = $params['traveler_counts'] ?? [];
        $travel_date     = $params['travel_date'] ?? '';
        $departure_time  = $params['departure_time'] ?? '';
        $coupon_code     = $params['coupon_code'] ?? '';
        $payment_method  = strtolower(trim((string) ($params['payment_method'] ?? 'full')));
        if ($payment_method === '') {
            $payment_method = 'full';
        }
        $selected_services = $params['selected_services'] ?? [];
        $availability_id = $params['availability_id'] ?? null;
        
        if (empty($trip_id)) {
            throw new \InvalidArgumentException('Trip ID is required for calculation');
        }
        
        // Fetch trip data
        $tripRepository = new TripRepository();
        $trip = $tripRepository->find($trip_id);
        
        if (!$trip) {
            throw new \InvalidArgumentException("Trip with ID {$trip_id} not found");
        }
        
        // ── Resolve pricing type & price data ───────────────────────────
        // Availability can override trip-level pricing
        $availability = null;
        if (!empty($availability_id) || !empty($travel_date)) {
            $availability = $this->resolveAvailability($trip_id, $travel_date, $availability_id, $departure_time);
        }
        
        $pricing_type = $this->resolvePricingType($trip, $availability);
        $price_types  = $this->resolvePriceTypes($trip, $availability);
        
        // ── Resolve per-unit price (Regular pricing) ────────────────────
        // Priority: discounted_price → sale_price → original_price
        $original_price   = (float) ($trip->original_price ?? 0);
        $discounted_price = $this->resolveDiscountedPrice($trip, $availability);
        $unit_price       = $discounted_price > 0 ? $discounted_price : $original_price;
        
        // Apply Dynamic Pricing filter (Pro DynamicPricingModule hooks here)
        $unit_price = (float) apply_filters('yatra_booking_trip_price', $unit_price, $trip_id, [
            'departure_date'   => $travel_date,
            'spots_remaining'  => $trip->max_travelers ?? null,
            'original_price'   => $original_price,
            'discounted_price' => $discounted_price,
        ]);
        
        // ── Calculate base amount ───────────────────────────────────────
        $base_amount = $this->calculateBaseAmount(
            $unit_price,
            $travelers_count,
            $traveler_counts,
            $pricing_type,
            $price_types,
            $trip_id,
            $travel_date
        );
        
        $base_amount = (float) apply_filters('yatra_calculate_base_amount', $base_amount, [
            'unit_price'       => $unit_price,
            'original_price'   => $original_price,
            'discounted_price' => $discounted_price,
            'travelers_count'  => $travelers_count,
            'traveler_counts'  => $traveler_counts,
            'pricing_type'     => $pricing_type,
            'price_types'      => $price_types,
            'trip_id'          => $trip_id,
        ]);
        
        // ── Subtotal (Pro modules can add services cost via filter) ─────
        // Free plugin: subtotal = base_amount only
        // Pro AdditionalServicesModule: hooks into yatra_calculate_subtotal to add services
        $subtotal = $base_amount;
        $subtotal = (float) apply_filters('yatra_calculate_subtotal', $subtotal, [
            'base_amount'        => $base_amount,
            'trip_id'            => $trip_id,
            'travelers_count'    => $travelers_count,
            'traveler_counts'    => $traveler_counts,
            'travel_date'        => $travel_date,
            'selected_services'  => $selected_services,
        ]);
        
        // ── Group Discount (AdvancedDiscount Pro module enables this) ───
        $group_discount_data = $this->calculateGroupDiscount(
            $trip_id, $subtotal, $travelers_count, $traveler_counts, $pricing_type, $price_types
        );
        
        // ── Coupon Discount ─────────────────────────────────────────────
        // Use DiscountService for coupon calculation
        $discountService = new \Yatra\Services\DiscountService();
        $subtotal_after_group = $subtotal - ($group_discount_data['amount'] ?? 0);
        
        $coupon_discount_data = $discountService->calculateCouponDiscount(
            $coupon_code,
            $subtotal_after_group,
            $trip_id,
            $travelers_count,
            $traveler_counts
        );
        
        // Allow plugins to modify coupon discount
        $coupon_discount_data = (array) apply_filters('yatra_calculate_coupon_discount', $coupon_discount_data, [
            'subtotal'              => $subtotal,
            'group_discount_amount' => $group_discount_data['amount'] ?? 0,
            'trip_id'               => $trip_id,
            'travelers_count'       => $travelers_count,
        ]);
        
        // ── Total discounts ─────────────────────────────────────────────
        $total_discount_amount = ($group_discount_data['amount'] ?? 0) + ($coupon_discount_data['calculated_amount'] ?? 0);
        $total_discount_amount = min($total_discount_amount, $subtotal); // discount cannot exceed subtotal
        
        $discounted_subtotal = max(0, $subtotal - $total_discount_amount);
        
        // ── Itinerary Costs ─────────────────────────────────────────
        $itinerary_costs = apply_filters('yatra_booking_itinerary_costs', [], $trip_id, $travelers_count, $traveler_counts, $travel_date);
        $itinerary_costs_total = 0;
        if (!empty($itinerary_costs) && is_array($itinerary_costs)) {
            foreach ($itinerary_costs as $cost) {
                $itinerary_costs_total += (float) ($cost['total_cost'] ?? 0);
            }
        }
        
        // ── Additional Services (if any) ─────────────────────────────
        $additional_services_total = 0;
        // Note: Additional services can be added here via filters
        
        // ── Taxable Amount (includes itinerary costs and services) ────
        $taxable_amount = $discounted_subtotal + $itinerary_costs_total + $additional_services_total;
        
        // ── Taxes ───────────────────────────────────────────────────────
        $tax_calculation = $this->calculateTaxes($taxable_amount);
        
        $final_total = $taxable_amount;
        if (!$tax_calculation['tax_inclusive']) {
            $final_total += $tax_calculation['total_tax_amount'];
        }
        
        $final_total = (float) apply_filters('yatra_calculate_final_total', $final_total, [
            'discounted_subtotal' => $discounted_subtotal,
            'itinerary_costs_total' => $itinerary_costs_total,
            'taxable_amount' => $taxable_amount,
            'tax_calculation'     => $tax_calculation,
            'trip_id'             => $trip_id,
            'payment_method'      => $payment_method,
        ]);
        
        // ── Payment amounts (FlexiblePayments Pro module) ───────────────
        $payment_amounts = $this->calculatePaymentAmounts($final_total, $payment_method, [
            'trip_id'         => $trip_id,
            'travelers_count' => $travelers_count,
        ]);
        
        // ── Currency ────────────────────────────────────────────────────
        $currency = SettingsService::getCurrency();
        
        // ── Gross total (subtotal before discounts/taxes, includes services) ───
        $gross_total = $subtotal;
        
        // ── Build result ────────────────────────────────────────────
        $pricing_data = [
            // Price info
            'original_price'        => $original_price,
            'discounted_price'      => $discounted_price,
            'unit_price'            => $unit_price,
            'pricing_type'          => $pricing_type,
            
            // Base amounts
            'base_amount'           => $base_amount,
            'subtotal'              => $subtotal,
            'discounted_subtotal'   => $discounted_subtotal,
            'taxable_amount'        => $taxable_amount,
            'gross_total'           => $gross_total,
            
            // Discounts
            'group_discount'        => $group_discount_data,
            'coupon_discount'       => $coupon_discount_data,
            'total_discount_amount' => $total_discount_amount,
            
            // Taxes
            'tax_calculation'       => $tax_calculation,
            
            // Final amounts
            'final_total'           => $final_total,
            'amount_due'            => $payment_amounts['amount_due'],
            'amount_paid'           => $payment_amounts['amount_paid'],
            
            // Payment & currency
            'payment_method'        => $payment_method,
            'currency'              => $currency,
            
            // Itinerary costs
            'itinerary_costs'       => $itinerary_costs,
            'itinerary_costs_total' => $itinerary_costs_total,
            
            // Metadata
            'travelers_count'       => $travelers_count,
            'traveler_counts'       => $traveler_counts,
            'travel_date'           => $travel_date,
            'trip_id'               => $trip_id,
        ];
        
        return (array) apply_filters('yatra_after_calculation_result', $pricing_data, $params);
    }
    
    /**
     * Resolve the discounted price from availability or trip
     * Priority: availability discounted → availability original → trip discounted → trip sale → 0
     */
    private function resolveDiscountedPrice(object $trip, ?object $availability): float
    {
        if ($availability) {
            if (!empty($availability->discounted_price) && (float) $availability->discounted_price > 0) {
                return (float) $availability->discounted_price;
            }
            if (!empty($availability->original_price) && (float) $availability->original_price > 0) {
                return (float) $availability->original_price;
            }
        }
        
        if (!empty($trip->discounted_price) && (float) $trip->discounted_price > 0) {
            return (float) $trip->discounted_price;
        }
        if (!empty($trip->sale_price) && (float) $trip->sale_price > 0) {
            return (float) $trip->sale_price;
        }
        
        return 0.0;
    }
    
    /**
     * Resolve pricing type from availability or trip
     */
    private function resolvePricingType(object $trip, ?object $availability): string
    {
        // Authoritative model matches {@see TripPricingService::resolvePricingType}:
        // explicit "regular" must not be overridden by inherited/stale availability price_types.
        $trip_model = TripPricingService::resolvePricingType($trip);

        if ($trip_model !== 'traveler_based') {
            return 'regular';
        }

        // Traveler-based trip: use per-date categories when that row defines them; otherwise caller
        // falls back to trip-level price_types via {@see self::resolvePriceTypes()}.
        if ($availability && !empty($availability->price_types)) {
            $types = is_string($availability->price_types)
                ? json_decode($availability->price_types, true)
                : $availability->price_types;
            if (!empty($types) && is_array($types)) {
                return 'traveler_based';
            }
        }

        return 'traveler_based';
    }
    
    /**
     * Resolve price_types array from availability or trip
     */
    private function resolvePriceTypes(object $trip, ?object $availability): array
    {
        if (TripPricingService::resolvePricingType($trip) === 'regular') {
            return [];
        }

        $types = [];
        
        // Priority 1: Availability price_types
        if ($availability && !empty($availability->price_types)) {
            $types = is_string($availability->price_types) 
                ? json_decode($availability->price_types, true) 
                : $availability->price_types;
        }
        
        // Priority 2: Trip price_types
        if (empty($types) && !empty($trip->price_types)) {
            if (is_string($trip->price_types)) {
                $types = json_decode($trip->price_types, true) ?: [];
            } else {
                $types = is_array($trip->price_types) ? $trip->price_types : [];
            }
        }
        
        if (empty($types)) {
            return [];
        }
        
        // Enrich with pricing_mode from category metadata if missing
        $needs_enrichment = false;
        foreach ($types as $pt) {
            $pt = (array) $pt;
            if (empty($pt['pricing_mode'])) {
                $needs_enrichment = true;
                break;
            }
        }
        
        if ($needs_enrichment) {
            $category_ids = array_filter(array_map(function($pt) {
                $pt = (array) $pt;
                return isset($pt['category_id']) ? (int) $pt['category_id'] : null;
            }, $types));
            
            if (!empty($category_ids)) {
                $category_meta = $this->getCategoryMetadata($category_ids);
                foreach ($types as &$pt) {
                    if (is_object($pt)) $pt = (array) $pt;
                    $cat_id = isset($pt['category_id']) ? (int) $pt['category_id'] : null;
                    if ($cat_id && isset($category_meta[$cat_id]) && empty($pt['pricing_mode'])) {
                        $pt['pricing_mode'] = $category_meta[$cat_id]['pricing_mode'] ?? 'per_person';
                    }
                }
                unset($pt);
            }
        }
        
        return $types;
    }
    
    /**
     * Get category metadata (pricing_mode, etc.) by IDs
     */
    private function getCategoryMetadata(array $category_ids): array
    {
        // Use repository instead of direct database query
        $repository = new \Yatra\Repositories\TravelerCategoryRepository();
        return $repository->getMetadataByIds($category_ids);
    }
    
    /**
     * Resolve availability data
     */
    private function resolveAvailability(int $trip_id, string $travel_date, ?int $availability_id, string $departure_time = ''): ?object
    {
        if (!class_exists('\Yatra\Services\AvailabilityService')) {
            return null;
        }
        
        try {
            // Try by availability_id first via repository
            if (!empty($availability_id) && class_exists('\Yatra\Repositories\AvailabilityRepository')) {
                $repo = new \Yatra\Repositories\AvailabilityRepository();
                if (method_exists($repo, 'find')) {
                    $result = $repo->find($availability_id);
                    if ($result) {
                        return $result;
                    }
                }
            }
            
            // Fallback: lookup by trip + date + time (time-aware for day tours)
            if (!empty($travel_date)) {
                $repo = new \Yatra\Repositories\AvailabilityRepository();
                $availabilityService = new \Yatra\Services\AvailabilityService($repo);
                return $availabilityService->getByTripAndDateTime($trip_id, $travel_date, $departure_time ?: null);
            }
        } catch (\Exception $e) {
            // Availability lookup failed, continue with trip-level pricing
        }
        
        return null;
    }
    
    /**
     * Calculate base amount (regular or traveler-based pricing)
     * 
     * For traveler-based: uses per-category effective prices × counts
     * For regular: uses unit_price × travelers_count
     */
    private function calculateBaseAmount(
        float $unit_price,
        int $travelers_count,
        array $traveler_counts,
        string $pricing_type,
        array $price_types,
        int $trip_id,
        string $travel_date = ''
    ): float {
        if ($pricing_type === 'traveler_based' && !empty($price_types)) {
            $base_amount = 0.0;
            
            foreach ($price_types as $pt) {
                $pt = (array) $pt;
                $category_id = $pt['category_id'] ?? 0;
                $pricing_mode = $pt['pricing_mode'] ?? 'per_person';
                
                $category_price = TripPricingService::resolveCategoryEffectivePrice($pt);
                
                // Apply Dynamic Pricing filter per category
                $category_price = (float) apply_filters('yatra_booking_trip_price', $category_price, $trip_id, [
                    'departure_date'   => $travel_date,
                    'category_id'      => $category_id,
                    'original_price'   => (float) ($pt['original_price'] ?? 0),
                    'discounted_price' => (float) ($pt['discounted_price'] ?? $pt['sale_price'] ?? 0),
                ]);
                
                $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : 0;
                
                if ($pricing_mode === 'per_group') {
                    // Per group: charge flat price once if any travelers in this category
                    if ($count > 0) {
                        $base_amount += $category_price;
                    }
                } else {
                    // Per person: charge per traveler
                    $base_amount += $category_price * $count;
                }
            }
            
            return round($base_amount, 2);
        }
        
        // Regular pricing
        return round($unit_price * $travelers_count, 2);
    }
    
    /**
     * Calculate group discount
     */
    private function calculateGroupDiscount(
        int $trip_id,
        float $subtotal,
        int $travelers_count,
        array $traveler_counts,
        string $pricing_type,
        array $price_types
    ): array {
        $group_discount_data = [
            'amount' => 0,
            'label'  => __('Group Discount', 'yatra'),
            'code'   => null,
        ];
        
        // Try DiscountService (requires Pro AdvancedDiscount module to enable)
        if (class_exists('\Yatra\Services\DiscountService') && method_exists('\Yatra\Services\DiscountService', 'calculateGroupDiscount')) {
            try {
                $discountService = new DiscountService();
                $discountResult  = $discountService->calculateGroupDiscount($trip_id, $traveler_counts, $price_types);
                
                // Debug: Log the calculation result
                if (WP_DEBUG && WP_DEBUG_LOG) {
                    $priceTypesDebug = [];
                    foreach ($price_types as $pt) {
                        $pt = (object) $pt;
                        $priceTypesDebug[] = [
                            'category_id' => $pt->category_id ?? null,
                            'price' => $pt->effective_price ?? $pt->sale_price ?? $pt->original_price ?? 0
                        ];
                    }

                }
                
                if ($discountResult && !empty($discountResult['amount'])) {
                    return [
                        'amount' => (float) ($discountResult['amount'] ?? 0),
                        'label'  => $discountResult['label'] ?? __('Group Discount', 'yatra'),
                        'code'   => $discountResult['code'] ?? null,
                    ];
                }
            } catch (\Exception $e) {

            }
        }
        
        // Fall back to filter (Pro plugins can hook here)
        return (array) apply_filters('yatra_calculate_group_discount', $group_discount_data, [
            'subtotal'        => $subtotal,
            'travelers_count' => $travelers_count,
            'traveler_counts' => $traveler_counts,
            'pricing_type'    => $pricing_type,
            'price_types'     => $price_types,
            'trip_id'         => $trip_id,
        ]);
    }
    
    /**
     * Calculate taxes
     */
    private function calculateTaxes(float $subtotal): array
    {
        $enable_tax             = SettingsService::get('enable_tax', false);
        $tax_rate               = (float) SettingsService::get('tax_rate', 0);
        $tax_label              = SettingsService::get('tax_label', 'Tax');
        $tax_inclusive           = (bool) SettingsService::get('tax_inclusive', false);
        $multiple_taxes_enabled = (bool) SettingsService::get('multiple_taxes_enabled', false);
        $multiple_taxes         = SettingsService::get('multiple_taxes', []);
        
        if (!is_array($multiple_taxes)) {
            $multiple_taxes = [];
        }

        // If tax is enabled and taxes are configured, honor them even if the boolean
        // "multiple_taxes_enabled" setting wasn't toggled in the UI (common case).
        if ($enable_tax && !empty($multiple_taxes)) {
            $multiple_taxes_enabled = true;
        } elseif (count($multiple_taxes) > 1) {
            $multiple_taxes_enabled = true;
        }
        
        $tax_breakdown    = [];
        $total_tax_amount = 0.0;
        
        if ($multiple_taxes_enabled && !empty($multiple_taxes)) {
            foreach ($multiple_taxes as $tax) {
                $rate = isset($tax['rate']) ? (float) $tax['rate'] : 0;
                $name = $tax['name'] ?? 'Tax';
                
                if ($rate > 0) {
                    $amount = $tax_inclusive
                        ? $subtotal * ($rate / (100 + $rate))
                        : $subtotal * ($rate / 100);
                    $amount = round($amount, 2);
                    
                    $tax_breakdown[]   = ['name' => $name, 'rate' => $rate, 'amount' => $amount];
                    $total_tax_amount += $amount;
                }
            }
        } elseif ($enable_tax && $tax_rate > 0) {
            $amount = $tax_inclusive
                ? $subtotal * ($tax_rate / (100 + $tax_rate))
                : $subtotal * ($tax_rate / 100);
            $amount = round($amount, 2);
            
            $tax_breakdown[]  = ['name' => $tax_label, 'rate' => $tax_rate, 'amount' => $amount];
            $total_tax_amount = $amount;
        }
        
        return [
            'enable_tax'             => $enable_tax,
            'tax_rate'               => $tax_rate,
            'tax_label'              => $tax_label,
            'tax_inclusive'           => $tax_inclusive,
            'multiple_taxes_enabled' => $multiple_taxes_enabled,
            'multiple_taxes'         => $multiple_taxes,
            'tax_breakdown'          => $tax_breakdown,
            'total_tax_amount'       => $total_tax_amount,
            'subtotal'               => $subtotal,
            'total_with_tax'         => $tax_inclusive ? $subtotal : ($subtotal + $total_tax_amount),
        ];
    }
    
    /**
     * Calculate payment amounts
     * 
     * Free: full payment only
     * Pro FlexiblePayments: deposit/partial via yatra_calculate_amount_due filter
     */
    private function calculatePaymentAmounts(float $final_total, string $payment_method, array $context): array
    {
        $amount_due  = $final_total;
        $amount_paid = 0.0;
        
        // Apply Pro FlexiblePayments filter for deposit/partial
        $amount_due = (float) apply_filters('yatra_calculate_amount_due', $amount_due, $final_total, $payment_method);
        
        // Fallback: if no Pro module handled it, use basic logic (never use === on floats)
        $flexible_enabled   = apply_filters('yatra_flexible_payments_enabled', false);
        $unchanged          = abs($amount_due - $final_total) < 0.000001;
        if ($unchanged && $payment_method !== 'full' && $flexible_enabled) {
            $deposit_percentage = (int) apply_filters('yatra_deposit_percentage', 20);
            $partial_percentage = (int) apply_filters('yatra_partial_payment_percentage', 30);
            if ($payment_method === 'deposit') {
                $amount_due = round($final_total * ($deposit_percentage / 100), 2);
            } elseif ($payment_method === 'partial') {
                $amount_due = round($final_total * ($partial_percentage / 100), 2);
            }
        }
        
        $payment_data = (array) apply_filters('yatra_calculate_payment_amounts', [
            'amount_due'     => $amount_due,
            'amount_paid'    => $amount_paid,
            'payment_method' => $payment_method,
            'final_total'    => $final_total,
        ], $context);
        
        return [
            'amount_due'  => (float) ($payment_data['amount_due'] ?? $amount_due),
            'amount_paid' => (float) ($payment_data['amount_paid'] ?? $amount_paid),
        ];
    }
    
    /**
     * Calculate pricing from session data
     * 
     * Used by booking-content.php template for checkout summary
     */
    public function calculateFromSession(array $session_data, string $coupon_code = '', string $payment_method = 'full'): array
    {
        $trip_id = (int) ($session_data['trip_id'] ?? 0);
        
        if (empty($trip_id)) {
            throw new \InvalidArgumentException('Trip ID is required in session data');
        }

        $payment_method = strtolower(trim($payment_method));
        if ($payment_method === '') {
            $payment_method = 'full';
        }
        
        $params = [
            'trip_id'            => $trip_id,
            'travelers_count'    => (int) ($session_data['travelers'] ?? 1),
            'traveler_counts'    => $session_data['traveler_counts'] ?? [],
            'travel_date'        => $session_data['travel_date'] ?? '',
            'departure_time'     => $session_data['departure_time'] ?? '',
            'coupon_code'        => $coupon_code,
            'payment_method'     => $payment_method,
            'selected_services'  => $session_data['additional_services'] ?? [],
            'availability_id'    => !empty($session_data['availability_id']) ? (int) $session_data['availability_id'] : null,
        ];
        
        $params = (array) apply_filters('yatra_session_calculation_params', $params, $session_data);
        
        return $this->calculatePricing($params);
    }
    
    /**
     * Quick pricing calculation for simple cases
     */
    public function quickCalculate(int $trip_id, int $travelers_count, string $travel_date = ''): array
    {
        return $this->calculatePricing([
            'trip_id'         => $trip_id,
            'travelers_count' => $travelers_count,
            'travel_date'     => $travel_date,
            'payment_method'  => 'full',
        ]);
    }
}
