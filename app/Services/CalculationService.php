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

        // Context for Pro dynamic pricing (inventory rules, etc.): prefer departure row seats, not trip max only.
        $spots_for_dp = null;
        if ($availability !== null) {
            if (isset($availability->seats_available)) {
                $spots_for_dp = (int) $availability->seats_available;
            } elseif (isset($availability->spots_remaining)) {
                $spots_for_dp = (int) $availability->spots_remaining;
            }
        }
        if ($spots_for_dp === null && isset($trip->max_travelers)) {
            $spots_for_dp = (int) $trip->max_travelers;
        }
        $availability_id_for_dp = $availability_id;
        if ($availability_id_for_dp === null && $availability !== null && isset($availability->id)) {
            $availability_id_for_dp = (int) $availability->id;
        }
        
        // ── Resolve per-unit price (Regular pricing) ────────────────────
        // Priority: discounted_price → sale_price → original_price
        $original_price   = (float) ($trip->original_price ?? 0);
        $discounted_price = $this->resolveDiscountedPrice($trip, $availability);
        $unit_price       = $discounted_price > 0 ? $discounted_price : $original_price;

        // Snapshot the pre-DP per-unit price so the pricing-summary template
        // can render the dynamic-pricing impact as its own line item rather
        // than silently absorbing it into the Gross Total. Without this, an
        // admin/customer looking at the summary cannot tell what the trip
        // would have cost without DP rules.
        $unit_price_before_dp = $unit_price;

        // Apply Dynamic Pricing filter (Pro DynamicPricingModule hooks here)
        $unit_price = (float) apply_filters('yatra_booking_trip_price', $unit_price, $trip_id, [
            'departure_date'   => $travel_date,
            'spots_remaining'  => $spots_for_dp,
            'availability_id'  => $availability_id_for_dp,
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
            $travel_date,
            $spots_for_dp,
            $availability_id_for_dp
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

        // ── Discount stacking hook ───────────────────────────────────────
        // Premium-only enforcement point. The Pro Advanced Discount module
        // listens here when paired with Dynamic Pricing and rewrites the
        // discount/DP combination according to the operator's stacking
        // mode. Free sites (and sites missing either module) receive no
        // listener and the snapshot passes through unchanged — pricing
        // stays bit-for-bit identical to the pre-feature behavior.
        //
        // `pre_dp_base_amount` is the base before DP fires — works for
        // BOTH regular pricing (where DP modifies $unit_price) and
        // traveler-based pricing (where DP fires per-category inside
        // calculateBaseAmount and would otherwise be invisible to a
        // post-hoc listener doing `$unit_price < $unit_price_before_dp`).
        // Cheap to compute (no DB hits, just arithmetic) so we always
        // pay the cost — far cheaper than asking listeners to recompute.
        $pre_dp_base_amount = $this->computeBaseAmountWithoutDynamicPricing(
            $unit_price_before_dp,
            $travelers_count,
            $traveler_counts,
            $pricing_type,
            $price_types
        );
        $stackingSnapshot = (array) apply_filters('yatra_pricing_after_discount_stack', [
            'unit_price'             => $unit_price,
            'unit_price_before_dp'   => $unit_price_before_dp,
            'base_amount'            => $base_amount,
            'pre_dp_base_amount'     => $pre_dp_base_amount,
            'subtotal'               => $subtotal,
            'group_discount_data'    => $group_discount_data,
            'coupon_discount_data'   => $coupon_discount_data,
            'total_discount_amount'  => $total_discount_amount,
            'discounted_subtotal'    => $discounted_subtotal,
        ], [
            'trip_id'                => $trip_id,
            'travelers_count'        => $travelers_count,
            'traveler_counts'        => $traveler_counts,
            'pricing_type'           => $pricing_type,
            'price_types'            => $price_types,
            'travel_date'            => $travel_date,
            'spots_for_dp'           => $spots_for_dp,
            'availability_id_for_dp' => $availability_id_for_dp,
            'coupon_code'            => $coupon_code,
            'selected_services'      => $selected_services,
            'original_price'         => $original_price,
            'discounted_price'       => $discounted_price,
            'calculation_service'    => $this,
            'discount_service'       => $discountService,
        ]);
        if (isset($stackingSnapshot['unit_price']))            { $unit_price            = (float) $stackingSnapshot['unit_price']; }
        if (isset($stackingSnapshot['base_amount']))           { $base_amount           = (float) $stackingSnapshot['base_amount']; }
        if (isset($stackingSnapshot['subtotal']))              { $subtotal              = (float) $stackingSnapshot['subtotal']; }
        if (isset($stackingSnapshot['group_discount_data']) && is_array($stackingSnapshot['group_discount_data'])) {
            $group_discount_data = $stackingSnapshot['group_discount_data'];
        }
        if (isset($stackingSnapshot['coupon_discount_data']) && is_array($stackingSnapshot['coupon_discount_data'])) {
            $coupon_discount_data = $stackingSnapshot['coupon_discount_data'];
        }
        if (isset($stackingSnapshot['total_discount_amount'])) { $total_discount_amount = (float) $stackingSnapshot['total_discount_amount']; }
        if (isset($stackingSnapshot['discounted_subtotal']))   { $discounted_subtotal   = (float) $stackingSnapshot['discounted_subtotal']; }

        // ── Itinerary Costs ─────────────────────────────────────────
        $itinerary_costs = apply_filters('yatra_booking_itinerary_costs', [], $trip_id, $travelers_count, $traveler_counts, $travel_date);
        $itinerary_costs_total = 0;
        if (!empty($itinerary_costs) && is_array($itinerary_costs)) {
            foreach ($itinerary_costs as $cost) {
                $itinerary_costs_total += (float) ($cost['total_cost'] ?? 0);
            }
        }
        
        // ── Additional Services (if any) ─────────────────────────────
        // Pull the available services for this trip via the Pro filter and
        // mark which ones are selected (or required/included). Pricing data
        // ships back to the template scope so the Pricing Summary partial's
        // selected-services loop has something to render — previously
        // `pricing_calculation['additional_services']` was never populated
        // here, so the per-row services list in the sidebar always rendered
        // empty even when the standalone Additional Services card showed
        // ticked checkboxes.
        $available_services = (array) apply_filters(
            'yatra_booking_additional_services',
            [],
            $trip_id,
            $travelers_count,
            $traveler_counts,
            $travel_date
        );
        $selected_service_ids = array_map('intval', (array) $selected_services);
        $duration_days_for_services = (int) ($trip->duration_days ?? 1);
        $additional_services_total = 0.0;
        $additional_services_resolved = [];
        foreach ($available_services as $svc) {
            $svc = (array) $svc;
            $svc_id = (int) ($svc['id'] ?? 0);
            $is_required = !empty($svc['is_required']);
            $is_included = !empty($svc['is_included']);
            $is_selected = $is_required || $is_included || in_array($svc_id, $selected_service_ids, true);

            $base_price = (float) ($svc['price'] ?? 0);
            $price_per = $svc['price_per'] ?? 'person';
            // This MUST stay identical to the Pro charge path
            // (AdditionalServicesBookingHooks::calculateServicePrice) so the
            // displayed line-item equals the amount folded into the subtotal.
            if (($svc['price_type'] ?? 'fixed') === 'percentage') {
                // Percentage = % of the WHOLE trip base price. `$base_amount`
                // already accounts for travelers/categories, so Price Per is NOT
                // applied (it would double-count). Matches the "Percentage of
                // Trip Price" label and the free booking-services fallback.
                $unit_price = round(($base_price / 100) * $base_amount, 2);
                $calculated_price = $unit_price;
            } else {
                // Fixed: Price Per multiplies the entered flat amount.
                $unit_price = $base_price;
                switch ($price_per) {
                    case 'person':
                        $calculated_price = round($unit_price * max(1, $travelers_count), 2);
                        break;
                    case 'day':
                        $calculated_price = round($unit_price * max(1, $duration_days_for_services), 2);
                        break;
                    case 'booking':
                    default:
                        $calculated_price = round($unit_price, 2);
                        break;
                }
            }

            $svc['selected'] = $is_selected;
            $svc['unit_price'] = $unit_price;
            $svc['calculated_price'] = $calculated_price;
            $additional_services_resolved[] = $svc;

            // Only paid (non-included) selected services contribute to the
            // services subtotal. The taxable-amount line below will then
            // include this naturally.
            if ($is_selected && !$is_included) {
                $additional_services_total += $calculated_price;
            }
        }
        // Let Pro modules override the total (rounding, group rules, etc.).
        $additional_services_total = (float) apply_filters(
            'yatra_booking_services_total',
            $additional_services_total,
            $additional_services_resolved,
            $trip_id,
            $travelers_count,
            $duration_days_for_services
        );
        
        // ── Taxable Amount ────────────────────────────────────────────
        // We DON'T add `$additional_services_total` again here. The Pro
        // AdditionalServicesModule hooks into `yatra_calculate_subtotal`
        // (above), which already folded selected services into `$subtotal`
        // → `$discounted_subtotal`. Adding them a second time produced the
        // visible double-count bug ($159 + $112 services = $271 subtotal,
        // then $271 + $112 services = $383 net amount). `$additional_services_total`
        // stays available in the result payload so the sidebar can render
        // each service as a row for transparency.
        $taxable_amount = $discounted_subtotal + $itinerary_costs_total;
        
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
        
        // ── Dynamic-pricing breakdown (for the pricing-summary template) ─
        // The DP module already has an `addPricingBreakdown` callback wired to
        // the `yatra_price_breakdown` filter — but that filter was previously
        // never fired anywhere, so the template's `$dynamic_pricing` block was
        // dead code. We fire it here with the same context the per-unit DP
        // filter received, so Pro DP can populate the breakdown row that the
        // template renders.
        //
        // dp_total_adjustment is the signed dollar impact DP has on the trip
        // subtotal:
        //   - For regular pricing: per-unit delta × travelers (the line 120
        //     filter is the single DP entry point).
        //   - For traveler_based pricing: DP is applied per-category inside
        //     calculateBaseAmount, so we recompute a "pristine" base amount
        //     using the same TripPricingService::resolveCategoryEffectivePrice
        //     anchor that calculateBaseAmount starts from, and subtract from
        //     the real (post-DP) base_amount.
        // If the discount-stacking filter reverted DP (the Pro
        // "discount_only" or "best_for_customer→discount" path
        // mutated $base_amount back to its pre-DP value), the
        // breakdown should reflect that — otherwise the per-category
        // line items would still display DP-adjusted prices that
        // don't match the final total customers actually pay.
        //
        // Free-only sites (no filter listener) hit the else branch
        // exactly as before: $base_amount tracks the post-DP value,
        // $dp_was_suppressed stays false, and the existing breakdown
        // math runs unchanged. So the pre-feature display contract
        // is bit-for-bit preserved.
        $dp_was_suppressed = $pre_dp_base_amount > 0
            && abs($base_amount - $pre_dp_base_amount) < 0.005;
        $dp_per_unit_delta = $dp_was_suppressed
            ? 0.0
            : $unit_price - $unit_price_before_dp;
        $dp_total_adjustment = 0.0;
        $category_prices_post_dp = [];
        if ($pricing_type === 'regular') {
            $dp_total_adjustment = $dp_per_unit_delta * max(1, $travelers_count);
        } elseif ($pricing_type === 'traveler_based' && !empty($price_types)) {
            $pre_dp_base = 0.0;
            foreach ($price_types as $pt) {
                $pt_arr = (array) $pt;
                $category_id = $pt_arr['category_id'] ?? 0;
                $pricing_mode = $pt_arr['pricing_mode'] ?? 'per_person';
                $pre_dp_price = (float) \Yatra\Services\TripPricingService::resolveCategoryEffectivePrice($pt_arr);
                $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : 0;

                // Capture the DP-adjusted per-category price so the pricing-summary
                // category row can show the price the customer is actually paying.
                // When DP was suppressed by the stacking enforcer, skip the DP
                // filter entirely and surface the pristine pre-DP price so the
                // breakdown matches the final total.
                if ($dp_was_suppressed) {
                    $post_dp_price = $pre_dp_price;
                } else {
                    $post_dp_price = (float) apply_filters('yatra_booking_trip_price', $pre_dp_price, $trip_id, [
                        'departure_date'   => $travel_date,
                        'spots_remaining'  => $spots_for_dp,
                        'availability_id'  => $availability_id_for_dp,
                        'category_id'      => $category_id,
                        'original_price'   => (float) ($pt_arr['original_price'] ?? 0),
                        'discounted_price' => (float) ($pt_arr['discounted_price'] ?? $pt_arr['sale_price'] ?? 0),
                    ]);
                }
                if ($category_id) {
                    $category_prices_post_dp[(string) $category_id] = $post_dp_price;
                }

                $pre_dp_base += TripPricingService::categoryLineSubtotal($pt_arr, $count, $pre_dp_price);
            }
            $dp_total_adjustment = $dp_was_suppressed ? 0.0 : ($base_amount - $pre_dp_base);
        }
        $price_breakdown = (array) apply_filters('yatra_price_breakdown', [], $trip_id, [
            'price'             => $unit_price,
            'original_price'    => $original_price,
            'discounted_price'  => $discounted_price,
            'departure_date'    => $travel_date,
            'spots_remaining'   => $spots_for_dp,
            'availability_id'   => $availability_id_for_dp,
            'travelers_count'   => $travelers_count,
            'gross_total'       => $gross_total,
        ]);
        $dynamic_pricing_breakdown = $price_breakdown['dynamic_pricing'] ?? null;

        // ── Build result ────────────────────────────────────────────
        $pricing_data = [
            // Price info
            'original_price'        => $original_price,
            'discounted_price'      => $discounted_price,
            'unit_price'            => $unit_price,
            'unit_price_before_dp'  => $unit_price_before_dp,
            'dp_per_unit_delta'     => $dp_per_unit_delta,
            'dp_total_adjustment'   => $dp_total_adjustment,
            'category_prices_post_dp' => $category_prices_post_dp,
            'dynamic_pricing'       => $dynamic_pricing_breakdown,
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
            // Additional services with `selected` / `calculated_price` flags
            // — Checkout::getAdditionalServices() reads this; the sidebar's
            // selected-services loop renders one row per ticked service.
            'additional_services'   => $additional_services_resolved,
            'services_total'        => $additional_services_total,

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
        
        // Resolve pricing_mode / group-size limits authoritatively from the
        // TravelerCategory. This must OVERRIDE (not just fill-when-empty): the
        // price_types coming from a stored availability row or session can carry
        // a literal 'per_person' placeholder that an empty() check would skip,
        // which silently charged a per-group category by headcount. For
        // per-person categories this resolves back to 'per_person' (a no-op), so
        // the booking total for every existing trip is unchanged.
        $types = TripPricingService::applyCategoryPricingMeta($types);

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
            
            // Fallback: resolve through centralized resolver so rule-generated slots
            // (virtual, no numeric availability_id) use the exact same data shape as the UI.
            if (!empty($travel_date)) {
                $resolver = new \Yatra\Services\AvailabilityResolutionService();
                return $resolver->resolveAvailabilityForDate(
                    $trip_id,
                    $travel_date,
                    $departure_time !== '' ? $departure_time : null
                );
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
    /**
     * Compute the base amount for a trip WITHOUT firing the Dynamic
     * Pricing filter, regardless of pricing type.
     *
     * Used by the Advanced Discount stacking enforcer to detect whether
     * DP actually adjusted the booking (compare actual base_amount to
     * the no-DP base_amount) and to compute the "discount-only" alt
     * scenario where DP must be fully neutralized.
     *
     * For regular pricing this is just unit_price × travelers_count.
     * For traveler-based pricing it walks the per-category prices via
     * the canonical TripPricingService anchor (identical math to the
     * breakdown's `$pre_dp_base` at lines ~384-415 of calculatePricing).
     * Per-category prices come from saved trip data — DP filter is
     * deliberately NOT applied.
     */
    public function computeBaseAmountWithoutDynamicPricing(
        float $unit_price,
        int $travelers_count,
        array $traveler_counts,
        string $pricing_type,
        array $price_types
    ): float {
        if ($pricing_type === 'traveler_based' && !empty($price_types)) {
            $base_amount = 0.0;
            foreach ($price_types as $pt) {
                $pt = (array) $pt;
                $category_id = $pt['category_id'] ?? 0;
                $pricing_mode = $pt['pricing_mode'] ?? 'per_person';
                $category_price = (float) TripPricingService::resolveCategoryEffectivePrice($pt);
                $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : 0;

                $base_amount += TripPricingService::categoryLineSubtotal($pt, $count, $category_price);
            }
            return round($base_amount, 2);
        }

        return round($unit_price * max(1, $travelers_count), 2);
    }

    /**
     * Compute the base amount for a trip from a given per-unit price.
     *
     * Public so Pro extensions (e.g. the Advanced Discount stacking-
     * enforcer) can re-derive the base when they need to recompute the
     * downstream pipeline with a different unit price — for example,
     * the "discount_only" stacking mode reverts the DP adjustment and
     * has to recompute base/subtotal/discounts against the pre-DP price.
     */
    public function calculateBaseAmount(
        float $unit_price,
        int $travelers_count,
        array $traveler_counts,
        string $pricing_type,
        array $price_types,
        int $trip_id,
        string $travel_date = '',
        ?int $spots_remaining = null,
        ?int $availability_id_for_dp = null
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
                    'spots_remaining'  => $spots_remaining,
                    'availability_id'  => $availability_id_for_dp,
                    'original_price'   => (float) ($pt['original_price'] ?? 0),
                    'discounted_price' => (float) ($pt['discounted_price'] ?? $pt['sale_price'] ?? 0),
                ]);
                
                $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : 0;
                
                // Single source of truth for the per-category line amount
                // (per-person × count, flat per-group, or per-block group pricing).
                $base_amount += TripPricingService::categoryLineSubtotal($pt, $count, $category_price);
            }

            return round($base_amount, 2);
        }

        // Regular pricing
        return round($unit_price * $travelers_count, 2);
    }
    
    /**
     * Calculate group discount
     */
    public function calculateGroupDiscount(
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
     * Free: full payment only.
     * Pro FlexiblePayments: deposit/partial via `yatra_calculate_amount_due`.
     *
     * $context carries `trip_id` (and may carry more later). It is forwarded
     * to every payment-related filter so Pro can apply per-trip overrides
     * (e.g. trip.deposit_amount, trip.deposit_percentage) instead of only
     * the site-wide settings.
     */
    private function calculatePaymentAmounts(float $final_total, string $payment_method, array $context): array
    {
        $amount_due  = $final_total;
        $amount_paid = 0.0;

        // Apply Pro FlexiblePayments filter for deposit/partial. $context lets
        // Pro look up the trip and honour per-trip overrides.
        $amount_due = (float) apply_filters('yatra_calculate_amount_due', $amount_due, $final_total, $payment_method, $context);

        // Fallback: if no Pro module handled it, use basic logic (never use === on floats)
        $flexible_enabled   = apply_filters('yatra_flexible_payments_enabled', false);
        $unchanged          = abs($amount_due - $final_total) < 0.000001;
        if ($unchanged && $payment_method !== 'full' && $flexible_enabled) {
            $deposit_percentage = (int) apply_filters('yatra_deposit_percentage', 20, $context);
            $partial_percentage = (int) apply_filters('yatra_partial_payment_percentage', 30, $context);
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
