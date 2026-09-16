<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Centralized Trip Pricing Service
 * 
 * SINGLE SOURCE OF TRUTH for all trip pricing display logic.
 * Eliminates redundant pricing resolution across controllers, templates, and shortcodes.
 * 
 * Used by:
 *  - SingleTripController (sidebar pricing, effective_price_min)
 *  - TripController (availability card pricing)
 *  - BookingSessionController (session pricing)
 *  - content-sidebar.php (sidebar display)
 *  - Shortcodes (Destination, Activity, DiscountAndDeals)
 *  - Listing pages
 * 
 * PRICING PRIORITY (Regular):
 *  discounted_price → sale_price → original_price
 * 
 * PRICING PRIORITY (Traveler-Based):
 *  per-category discounted_price → sale_price → original_price
 *  Display shows minimum effective price across all categories
 * 
 * FILTER HOOKS (for Yatra Pro):
 *  - yatra_resolve_display_pricing   → Modify complete display pricing result
 *  - yatra_resolve_card_pricing      → Modify per-card pricing on availability section
 *  - yatra_resolve_effective_price   → Modify single effective price (used in listings)
 *  - yatra_resolve_pricing_type      → Override pricing type detection
 *  - yatra_resolve_price_types       → Modify normalized price_types array
 *  - yatra_resolve_discount_info     → Modify discount calculation
 * 
 * @package Yatra\Services
 */
class TripPricingService
{
    /**
     * Resolve complete display pricing for a trip.
     * 
     * This is the MAIN method that replaces all inline pricing computation
     * in SingleTripController, content-sidebar.php, shortcodes, etc.
     * 
     * @param object $trip Trip object (from any source — raw DB, findWithRelations, Trip model)
     * @param array|null $availabilityDates Optional availability dates (already resolved by AvailabilityResolutionService)
     * @return array Complete display pricing data
     */
    public static function resolveDisplayPricing(object $trip, ?array $availabilityDates = null): array
    {
        $pricing_type = self::resolvePricingType($trip);
        $price_types = self::resolvePriceTypes($trip);
        $has_traveler_pricing = ($pricing_type === 'traveler_based' && !empty($price_types));

        // Initialize result
        $result = [
            'effective_price_min' => 0.0,
            'min_category_original_price' => 0.0,
            'max_discount_percentage' => 0,
            'current_price' => 0.0,
            'original_price' => 0.0,
            'has_discount' => false,
            'discount_percentage' => 0,
            'price_prefix' => '',
            'pricing_type' => $pricing_type,
            'price_types' => $price_types,
            'has_traveler_pricing' => $has_traveler_pricing,
            // How the displayed amount is charged: 'per_person' or 'per_group'
            // (+ the pax range), taken from the SAME category the amount comes
            // from, so the label can never contradict the price.
            'price_unit' => 'per_person',
            'price_unit_label' => self::priceUnitLabel(null),
            'currency' => SettingsService::getCurrency(),
        ];

        if ($has_traveler_pricing) {
            // Traveler-based:
            // - If a default category is marked, use that for initial display (listings + single trip page-load).
            // - Otherwise fall back to minimum effective price across categories (current behavior).
            $default_price = 0.0;
            $default_original = 0.0;
            $default_pt = null;
            $min_price = PHP_FLOAT_MAX;
            $min_original = 0.0;
            $min_pt = null;
            $max_discount = 0;

            foreach ($price_types as $pt) {
                $pt = (array) $pt;
                $original = (float) ($pt['original_price'] ?? 0);
                $discounted = self::resolveCategoryEffectivePrice($pt);

                if (!empty($pt['is_default']) && $default_price <= 0 && $discounted > 0) {
                    $default_price = $discounted;
                    $default_original = $original;
                    $default_pt = $pt;
                }

                if ($discounted > 0 && $discounted < $min_price) {
                    $min_price = $discounted;
                    $min_original = $original;
                    $min_pt = $pt;
                }

                // Track max discount across categories
                if ($original > 0 && $discounted > 0 && $discounted < $original) {
                    $pct = (int) round((($original - $discounted) / $original) * 100);
                    if ($pct > $max_discount) {
                        $max_discount = $pct;
                    }
                }
            }

            $chosen_price = $default_price > 0 ? $default_price : ($min_price < PHP_FLOAT_MAX ? $min_price : 0.0);
            $chosen_original = $default_price > 0 ? $default_original : $min_original;
            $chosen_pt = $default_price > 0 ? $default_pt : $min_pt;

            if ($chosen_price > 0) {
                $unit = self::priceUnit($chosen_pt);
                $result['price_unit'] = $unit['unit'];
                $result['price_unit_label'] = $unit['label'];
                $result['effective_price_min'] = $chosen_price;
                $result['min_category_original_price'] = $chosen_original;
                $result['max_discount_percentage'] = $max_discount;
                $result['current_price'] = $chosen_price;
                $result['original_price'] = $chosen_original;
                $result['has_discount'] = $max_discount > 0;
                $result['discount_percentage'] = $max_discount;
                $result['price_prefix'] = __('From ', 'yatra');
            }
        } else {
            // Regular pricing: discounted_price → sale_price → original_price
            $original = (float) ($trip->original_price ?? 0);
            $current = self::resolveRegularCurrentPrice($trip);

            $result['effective_price_min'] = $current > 0 ? $current : $original;
            $result['min_category_original_price'] = $original;
            $result['current_price'] = $current > 0 ? $current : $original;
            $result['original_price'] = $original;

            if ($current > 0 && $original > 0 && $current < $original) {
                $result['has_discount'] = true;
                $result['discount_percentage'] = (int) round((($original - $current) / $original) * 100);
                $result['max_discount_percentage'] = $result['discount_percentage'];
            }
        }

        // If availability dates are provided, check for lower prices across them
        if (!empty($availabilityDates)) {
            $result['price_prefix'] = __('From ', 'yatra');
            $avail_min = self::findMinPriceFromAvailability($availabilityDates, $has_traveler_pricing);
            if ($avail_min > 0 && ($result['effective_price_min'] <= 0 || $avail_min < $result['effective_price_min'])) {
                $result['effective_price_min'] = $avail_min;
                $result['current_price'] = $avail_min;
                if ($has_traveler_pricing) {
                    $avail_pt = self::findAvailabilityPriceTypeAt($availabilityDates, $avail_min);
                    if ($avail_pt !== null) {
                        $unit = self::priceUnit($avail_pt);
                        $result['price_unit'] = $unit['unit'];
                        $result['price_unit_label'] = $unit['label'];
                    }
                }
            }
        } elseif ($has_traveler_pricing) {
            $result['price_prefix'] = __('From ', 'yatra');
        }

        // Pro filter: allows Dynamic Pricing, etc. to modify display pricing
        return (array) apply_filters('yatra_resolve_display_pricing', $result, $trip, $availabilityDates);
    }

    /**
     * Resolve pricing for a single availability card.
     * 
     * Replaces the inline pricing logic in TripController::render_availability_template.
     * 
     * @param object $avail Availability object (from AvailabilityResolutionService)
     * @param object $trip Trip data
     * @return array Card pricing data
     */
    public static function resolveCardPricing(object $avail, object $trip): array
    {
        $trip_mode = self::resolvePricingType($trip);
        $avail_price_types = !empty($avail->price_types) && is_array($avail->price_types)
            ? $avail->price_types : [];

        // Only treat a date as traveler-based when the trip is traveler-based. Otherwise inherited
        // or stale price_types on an availability row must not override regular trip pricing.
        $pricing_type = $trip_mode;
        if ($trip_mode === 'traveler_based' && !empty($avail_price_types)) {
            $pricing_type = 'traveler_based';
        }

        $result = [
            'sale_price' => 0.0,
            'original_price' => 0.0,
            'has_discount' => false,
            'discount_percentage' => 0,
            'pricing_type' => $pricing_type,
            'price_types' => $pricing_type === 'traveler_based' ? $avail_price_types : [],
            'price_unit' => 'per_person',
            'price_unit_label' => self::priceUnitLabel(null),
        ];

        if ($pricing_type === 'traveler_based' && !empty($avail_price_types)) {
            // Traveler-based: use first category's price as display
            $first = (array) $avail_price_types[0];
            $result['sale_price'] = self::resolveCategoryEffectivePrice($first);
            $result['original_price'] = (float) ($first['original_price'] ?? $result['sale_price']);
            $unit = self::priceUnit($first);
            $result['price_unit'] = $unit['unit'];
            $result['price_unit_label'] = $unit['label'];
        } elseif (isset($avail->effective_price) && (float) $avail->effective_price > 0) {
            // Regular: use pre-calculated effective price
            $result['sale_price'] = (float) $avail->effective_price;
            $result['original_price'] = isset($avail->original_price) && (float) $avail->original_price > 0
                ? (float) $avail->original_price
                : $result['sale_price'];
        } else {
            // Fallback: trip defaults
            $result['original_price'] = (float) ($trip->original_price ?? 0);
            $current = self::resolveRegularCurrentPrice($trip);
            $result['sale_price'] = $current > 0 ? $current : $result['original_price'];
        }

        // Compute discount
        if ($result['original_price'] > 0 && $result['sale_price'] > 0 && $result['sale_price'] < $result['original_price']) {
            $result['has_discount'] = true;
            $result['discount_percentage'] = (int) round(
                (($result['original_price'] - $result['sale_price']) / $result['original_price']) * 100
            );
        }

        // Pro filter: Dynamic Pricing per-card
        return (array) apply_filters('yatra_resolve_card_pricing', $result, $avail, $trip);
    }

    /**
     * Get the single effective price for a trip (used in shortcodes for min/max).
     * 
     * @param object $trip Trip object
     * @return float Effective price
     */
    public static function getEffectivePrice(object $trip): float
    {
        $pricing_type = self::resolvePricingType($trip);
        $price_types = self::resolvePriceTypes($trip);

        if ($pricing_type === 'traveler_based' && !empty($price_types)) {
            $default = 0.0;
            $min = PHP_FLOAT_MAX;
            foreach ($price_types as $pt) {
                $ptArr = (array) $pt;
                $price = self::resolveCategoryEffectivePrice($ptArr);
                if (!empty($ptArr['is_default']) && $default <= 0 && $price > 0) {
                    $default = $price;
                }
                if ($price > 0 && $price < $min) {
                    $min = $price;
                }
            }
            $effective = $default > 0 ? $default : ($min < PHP_FLOAT_MAX ? $min : 0.0);
        } else {
            $current = self::resolveRegularCurrentPrice($trip);
            $original = (float) ($trip->original_price ?? 0);
            $effective = $current > 0 ? $current : $original;
        }

        return (float) apply_filters('yatra_resolve_effective_price', $effective, $trip);
    }

    /**
     * Resolve the current price for regular pricing.
     * Priority: discounted_price → sale_price → original_price
     * 
     * @param object $trip Trip object
     * @return float Current price (0 if none set)
     */
    public static function resolveRegularCurrentPrice(object $trip): float
    {
        if (!empty($trip->discounted_price) && (float) $trip->discounted_price > 0) {
            return (float) $trip->discounted_price;
        }
        if (!empty($trip->sale_price) && (float) $trip->sale_price > 0) {
            return (float) $trip->sale_price;
        }
        if (!empty($trip->original_price) && (float) $trip->original_price > 0) {
            return (float) $trip->original_price;
        }
        return 0.0;
    }

    /**
     * Resolve effective price for a single traveler category.
     * Priority: discounted_price → sale_price → original_price
     * 
     * @param array $category Category price data
     * @return float Effective price
     */
    public static function resolveCategoryEffectivePrice(array $category): float
    {
        if (!empty($category['discounted_price']) && (float) $category['discounted_price'] > 0) {
            return (float) $category['discounted_price'];
        }
        if (!empty($category['sale_price']) && (float) $category['sale_price'] > 0) {
            return (float) $category['sale_price'];
        }
        if (!empty($category['original_price']) && (float) $category['original_price'] > 0) {
            return (float) $category['original_price'];
        }
        if (!empty($category['price']) && (float) $category['price'] > 0) {
            return (float) $category['price'];
        }
        return 0.0;
    }

    /**
     * Resolve pricing type for a trip (regular vs traveler_based).
     * 
     * @param object $trip Trip object
     * @return string 'regular' or 'traveler_based'
     */
    public static function resolvePricingType(object $trip): string
    {
        $raw = $trip->pricing_type ?? null;
        if (is_string($raw)) {
            $raw = trim($raw);
        }

        // Honor an explicit mode from the trip row. Leftover rows in trip_price_types must not
        // override "regular" trip-level pricing (admin saves price_types as [] for regular, but
        // legacy/orphan DB rows would otherwise force traveler_based and show min category price).
        if ($raw !== null && $raw !== '') {
            $type = $raw === 'traveler_based' ? 'traveler_based' : 'regular';
            return (string) apply_filters('yatra_resolve_pricing_type', $type, $trip);
        }

        // Legacy / unmigrated trips: no pricing_type column value — infer from price_types
        $price_types = self::resolvePriceTypes($trip);
        $type = !empty($price_types) ? 'traveler_based' : 'regular';

        return (string) apply_filters('yatra_resolve_pricing_type', $type, $trip);
    }

    /**
     * Normalize price_types from any format into a consistent array of arrays.
     * Handles: JSON string, array of stdClass, array of arrays, null
     * 
     * @param object $trip Trip object (checks ->price_types property)
     * @return array Normalized price_types as array of arrays
     */
    public static function resolvePriceTypes(object $trip): array
    {
        $raw = $trip->price_types ?? null;

        if (empty($raw)) {
            return [];
        }

        // Decode JSON string
        if (is_string($raw)) {
            $raw = json_decode($raw, true);
            if (!is_array($raw)) {
                return [];
            }
        }

        if (!is_array($raw)) {
            return [];
        }

        // Normalize each entry to array format
        $normalized = [];
        foreach ($raw as $pt) {
            $pt = (array) $pt;
            if (empty($pt)) continue;

            $origFromPrice = isset($pt['price']) ? (float) $pt['price'] : null;
            $orig = isset($pt['original_price']) ? (float) $pt['original_price'] : null;
            if (($orig === null || $orig <= 0) && $origFromPrice !== null && $origFromPrice > 0) {
                $orig = $origFromPrice;
            }

            $normalized[] = [
                'category_id'      => isset($pt['category_id']) ? (int) $pt['category_id'] : null,
                'original_price'   => $orig !== null && $orig > 0 ? $orig : null,
                'discounted_price' => isset($pt['discounted_price']) ? (float) $pt['discounted_price'] : null,
                'sale_price'       => isset($pt['sale_price']) ? (float) $pt['sale_price'] : null,
                'label'            => $pt['label'] ?? ($pt['category_label'] ?? ($pt['title'] ?? null)),
                'pricing_mode'     => $pt['pricing_mode'] ?? 'per_person',
                'category_label'   => $pt['category_label'] ?? ($pt['label'] ?? ($pt['title'] ?? null)),
                'is_default'       => !empty($pt['is_default']),
            ];
        }

        // The trip's stored price_types JSON does not persist pricing_mode, so
        // the literal 'per_person' above is only a placeholder — resolve the
        // authoritative value (and group-size limits) from the TravelerCategory.
        $normalized = self::applyCategoryPricingMeta($normalized);

        return (array) apply_filters('yatra_resolve_price_types', $normalized, $trip);
    }

    /**
     * Request-level cache of per-category pricing metadata, keyed by category id.
     * A `null` entry records a category that has no classification row (e.g. it
     * was deleted) so we never re-query it.
     *
     * @var array<int, array{pricing_mode:string, min_pax:?int, max_pax:?int}|null>
     */
    private static array $categoryPricingMetaCache = [];

    /**
     * Backfill pricing_mode / min_pax / max_pax onto a price_types array from the
     * authoritative TravelerCategory classification.
     *
     * The trip's stored price_types JSON has never persisted pricing_mode, and
     * older resolvers baked in a literal 'per_person' default. That silently
     * turned a per-group category into per-person pricing at availability and
     * checkout time (charging price × headcount instead of a flat group price).
     * The category is the single source of truth, so we read it back and
     * override here. For per-person categories this resolves to 'per_person',
     * i.e. a no-op — every existing trip keeps its exact pricing. Entries with
     * no matching category (or a regular-pricing trip with no categories) are
     * returned untouched. Accepts and preserves array or object entries.
     *
     * @param array<int, mixed> $priceTypes
     * @return array<int, mixed>
     */
    public static function applyCategoryPricingMeta(array $priceTypes): array
    {
        if (empty($priceTypes)) {
            return $priceTypes;
        }

        // Load any category ids we haven't already cached this request.
        $needed = [];
        foreach ($priceTypes as $pt) {
            $arr = (array) $pt;
            $cid = !empty($arr['category_id']) ? (int) $arr['category_id'] : 0;
            if ($cid && !array_key_exists($cid, self::$categoryPricingMetaCache)) {
                $needed[$cid] = $cid;
            }
        }

        if (!empty($needed)) {
            $meta = (new \Yatra\Repositories\TravelerCategoryRepository())
                ->getMetadataByIds(array_values($needed));
            foreach ($needed as $cid) {
                $m = $meta[$cid] ?? null;
                self::$categoryPricingMetaCache[$cid] = is_array($m)
                    ? [
                        'pricing_mode' => in_array(($m['pricing_mode'] ?? 'per_person'), ['per_person', 'per_group'], true)
                            ? $m['pricing_mode']
                            : 'per_person',
                        'min_pax' => (isset($m['min_pax']) && $m['min_pax'] !== '' && $m['min_pax'] !== null) ? (int) $m['min_pax'] : null,
                        'max_pax' => (isset($m['max_pax']) && $m['max_pax'] !== '' && $m['max_pax'] !== null) ? (int) $m['max_pax'] : null,
                        'group_overflow' => in_array(($m['group_overflow'] ?? 'block'), ['block', 'per_block'], true)
                            ? $m['group_overflow']
                            : 'block',
                    ]
                    : null;
            }
        }

        foreach ($priceTypes as &$pt) {
            $isObject = is_object($pt);
            $arr = (array) $pt;
            $cid = !empty($arr['category_id']) ? (int) $arr['category_id'] : 0;
            $m = $cid ? (self::$categoryPricingMetaCache[$cid] ?? null) : null;
            if ($m !== null) {
                $arr['pricing_mode'] = $m['pricing_mode'];
                if ($m['min_pax'] !== null) {
                    $arr['min_pax'] = $m['min_pax'];
                }
                if ($m['max_pax'] !== null) {
                    $arr['max_pax'] = $m['max_pax'];
                }
                $arr['group_overflow'] = $m['group_overflow'] ?? 'block';
                $pt = $isObject ? (object) $arr : $arr;
            }
        }
        unset($pt);

        return $priceTypes;
    }

    /**
     * Effective subtotal for a single traveler-category line — the ONE place
     * the per-group vs per-person money rule lives, so every caller (charge,
     * checkout breakdown, discount base, initial total) agrees.
     *
     *  - per_person            : price × count
     *  - per_group (block)     : one flat price for the whole group  [default]
     *  - per_group (per_block) : price × ceil(count / max_pax)        [multiple group blocks]
     *
     * group_overflow defaults to 'block', and a missing/zero max_pax also falls
     * back to a single flat price, so existing per-group categories are
     * byte-identical until an owner opts into per-block pricing.
     *
     * @param array|object $pt    Price-type entry (carries pricing_mode/max_pax/group_overflow).
     * @param int          $count Selected headcount for this category.
     * @param float        $price Effective per-unit (per-person) or per-group price.
     */
    public static function categoryLineSubtotal($pt, int $count, float $price): float
    {
        if ($count <= 0) {
            return 0.0;
        }

        $pt = (array) $pt;

        if (($pt['pricing_mode'] ?? 'per_person') !== 'per_group') {
            return $price * $count;
        }

        $overflow = ($pt['group_overflow'] ?? 'block') === 'per_block' ? 'per_block' : 'block';
        $maxPax = (isset($pt['max_pax']) && $pt['max_pax'] !== '' && $pt['max_pax'] !== null) ? (int) $pt['max_pax'] : 0;

        if ($overflow === 'per_block' && $maxPax > 0) {
            return $price * (int) ceil($count / $maxPax);
        }

        // Single flat group price.
        return $price;
    }

    /**
     * Compute discount info from two prices.
     * 
     * @param float $originalPrice Original price
     * @param float $currentPrice Current (sale/discounted) price
     * @return array Discount data
     */
    public static function computeDiscount(float $originalPrice, float $currentPrice): array
    {
        $result = [
            'has_discount' => false,
            'discount_amount' => 0.0,
            'discount_percentage' => 0,
            'original_price' => $originalPrice,
            'current_price' => $currentPrice,
        ];

        if ($originalPrice > 0 && $currentPrice > 0 && $currentPrice < $originalPrice) {
            $result['has_discount'] = true;
            $result['discount_amount'] = round($originalPrice - $currentPrice, 2);
            $result['discount_percentage'] = (int) round(
                (($originalPrice - $currentPrice) / $originalPrice) * 100
            );
        }

        return (array) apply_filters('yatra_resolve_discount_info', $result, $originalPrice, $currentPrice);
    }

    /**
     * How a category's price is charged, for display next to an amount.
     *
     * A traveller category is priced 'per_person' (× headcount) or 'per_group'
     * (flat for min_pax–max_pax people). The trip's stored price_types JSON does
     * not carry the mode, so it is read back from the category classification
     * (applyCategoryPricingMeta) exactly as checkout does. Pass the category
     * entry whose price is being displayed; null / a regular-pricing trip →
     * per person.
     *
     * @param array|object|null $pt
     * @return array{unit:string,label:string,min_pax:?int,max_pax:?int}
     */
    public static function priceUnit($pt): array
    {
        $unit = ['unit' => 'per_person', 'label' => '', 'min_pax' => null, 'max_pax' => null];

        if ($pt !== null) {
            $pt = (array) $pt;
            if (!isset($pt['pricing_mode']) && isset($pt['category_id'])) {
                $backfilled = self::applyCategoryPricingMeta([$pt]);
                $pt = (array) ($backfilled[0] ?? $pt);
            }
            if (($pt['pricing_mode'] ?? 'per_person') === 'per_group') {
                $unit['unit'] = 'per_group';
                $unit['min_pax'] = isset($pt['min_pax']) && $pt['min_pax'] !== '' && $pt['min_pax'] !== null ? (int) $pt['min_pax'] : null;
                $unit['max_pax'] = isset($pt['max_pax']) && $pt['max_pax'] !== '' && $pt['max_pax'] !== null ? (int) $pt['max_pax'] : null;
            }
        }

        if ($unit['unit'] === 'per_group') {
            if ($unit['min_pax'] > 0 && $unit['max_pax'] > 0) {
                /* translators: 1: minimum pax for the group price, 2: maximum pax. */
                $label = sprintf(__('per group (%1$d-%2$d pax)', 'yatra'), $unit['min_pax'], $unit['max_pax']);
            } elseif ($unit['max_pax'] > 0) {
                /* translators: %d: maximum pax for the group price. */
                $label = sprintf(__('per group (up to %d pax)', 'yatra'), $unit['max_pax']);
            } elseif ($unit['min_pax'] > 0) {
                /* translators: %d: minimum pax for the group price. */
                $label = sprintf(__('per group (%d+ pax)', 'yatra'), $unit['min_pax']);
            } else {
                $label = __('per group', 'yatra');
            }
        } else {
            $label = __('per person', 'yatra');
        }

        /**
         * Wording of the unit shown next to a price ("per person", "per group (1-2 pax)").
         *
         * @param string     $label Translated label.
         * @param string     $unit  'per_person' or 'per_group'.
         * @param array|null $pt    The traveller-category price entry, if any.
         */
        $unit['label'] = (string) apply_filters('yatra_price_unit_label', $label, $unit['unit'], $pt);

        return $unit;
    }

    /**
     * Shorthand for priceUnit()['label'].
     *
     * @param array|object|null $pt
     */
    public static function priceUnitLabel($pt): string
    {
        return self::priceUnit($pt)['label'];
    }

    /**
     * The availability price-type entry whose effective price equals $price
     * (the value findMinPriceFromAvailability() picked), so the unit label can
     * follow that category. Null when the minimum came from the availability
     * row itself rather than a category.
     *
     * @param array<int, object> $availabilityDates
     */
    private static function findAvailabilityPriceTypeAt(array $availabilityDates, float $price): ?array
    {
        foreach ($availabilityDates as $avail) {
            if (empty($avail->price_types) || !is_array($avail->price_types)) {
                continue;
            }
            foreach ($avail->price_types as $pt) {
                $pt = (array) $pt;
                if (abs(self::resolveCategoryEffectivePrice($pt) - $price) < 0.005) {
                    return $pt;
                }
            }
        }

        return null;
    }

    /**
     * Find minimum price across availability dates.
     * 
     * @param array $availabilityDates Array of availability objects
     * @param bool $checkPriceTypes Whether to check price_types within each availability
     * @return float Minimum price found (0 if none)
     */
    private static function findMinPriceFromAvailability(array $availabilityDates, bool $checkPriceTypes): float
    {
        $min = PHP_FLOAT_MAX;

        foreach ($availabilityDates as $avail) {
            // Check effective_price / original_price on the availability
            $avail_price = (float) ($avail->effective_price ?? $avail->original_price ?? 0);
            if ($avail_price > 0 && $avail_price < $min) {
                $min = $avail_price;
            }

            // Check price_types within availability (for traveler-based)
            if ($checkPriceTypes && !empty($avail->price_types) && is_array($avail->price_types)) {
                foreach ($avail->price_types as $pt) {
                    $pt_price = self::resolveCategoryEffectivePrice((array) $pt);
                    if ($pt_price > 0 && $pt_price < $min) {
                        $min = $pt_price;
                    }
                }
            }
        }

        return $min < PHP_FLOAT_MAX ? $min : 0.0;
    }
}
