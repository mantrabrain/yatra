<?php
/**
 * Group-size price tiers (3.3).
 *
 * A trip with regular (per person) pricing can list its own per-person price
 * by group size in custom_fields:
 *   group_price_tiers = [{min, max, price}, …]   (max empty = "and more")
 * e.g. 1 person 1500, 2–3 people 1300, 4+ 1100. When the number of
 * travellers falls in a tier, that tier's price is the per-person price for
 * the booking (it replaces the trip or departure price; dynamic pricing and
 * discounts still apply on top). Group sizes outside every tier keep the
 * normal price.
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class GroupPriceTierService
{
    public const MAX_TIERS = 10;

    private static bool $booted = false;

    /** @var array<int, list<array{min:int,max:?int,price:float}>> */
    private static array $cache = [];

    /** @var array{trip_id:int,travelers:int}|null */
    private static ?array $pricing = null;

    public static function init(): void
    {
        if (self::$booted) {
            return;
        }
        self::$booted = true;
        add_filter('yatra_before_calculation_params', [self::class, 'beforeCalculation'], 4, 1);
        // The base per-person price, before dynamic pricing and its snapshot
        // (so Pro's discount stacking doesn't mistake the tier for a DP change).
        add_filter('yatra_calculation_base_unit_price', [self::class, 'tierPrice'], 10, 3);
        // The group size only counts inside its own price calculation.
        add_filter('yatra_after_calculation_result', [self::class, 'endCalculation'], 999, 1);
    }

    /** @param mixed $pricing */
    public static function endCalculation($pricing)
    {
        self::$pricing = null;

        return $pricing;
    }

    /**
     * @param mixed $raw
     * @return list<array{min:int,max:?int,price:float}>
     */
    public static function sanitizeTiers($raw): array
    {
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $row) {
            $row = is_object($row) ? (array) $row : $row;
            if (!is_array($row) || !is_numeric($row['price'] ?? null) || (float) $row['price'] <= 0) {
                continue;
            }
            $min = max(1, (int) ($row['min'] ?? 1));
            $max = isset($row['max']) && $row['max'] !== '' && $row['max'] !== null && is_numeric($row['max']) ? (int) $row['max'] : null;
            if ($max !== null && $max < $min) {
                continue;
            }
            $out[] = ['min' => $min, 'max' => $max, 'price' => round((float) $row['price'], 2)];
            if (count($out) >= self::MAX_TIERS) {
                break;
            }
        }
        usort($out, static function ($a, $b) {
            return $a['min'] <=> $b['min'];
        });

        return $out;
    }

    /** @return list<array{min:int,max:?int,price:float}> */
    public static function tiers(int $tripId, ?object $trip = null): array
    {
        if ($tripId <= 0) {
            return [];
        }
        if (isset(self::$cache[$tripId])) {
            return self::$cache[$tripId];
        }
        // A trip object already loaded (e.g. the trip page's) saves a database read.
        if ($trip === null || !isset($trip->pricing_type)) {
            $trip = class_exists('\\Yatra\\Repositories\\TripRepository') ? (new \Yatra\Repositories\TripRepository())->find($tripId) : null;
        }
        if (!$trip || (string) ($trip->pricing_type ?? 'regular') !== 'regular') {
            return self::$cache[$tripId] = [];
        }
        $fields = $trip->custom_fields ?? null;
        if (is_string($fields)) {
            $decoded = json_decode($fields, true);
            if (!is_array($decoded)) {
                $decoded = maybe_unserialize($fields);
            }
            $fields = is_array($decoded) ? $decoded : [];
        }
        $fields = is_array($fields) ? $fields : (is_object($fields) ? (array) $fields : []);

        return self::$cache[$tripId] = self::sanitizeTiers($fields['group_price_tiers'] ?? []);
    }

    /** The tier for a group of $travellers, or null. */
    public static function tierFor(int $tripId, int $travellers): ?array
    {
        foreach (self::tiers($tripId) as $tier) {
            if ($travellers >= $tier['min'] && ($tier['max'] === null || $travellers <= $tier['max'])) {
                return $tier;
            }
        }

        return null;
    }

    /** "1 person", "2–3 people", "4+ people". */
    public static function tierLabel(array $tier): string
    {
        if ($tier['max'] === null) {
            /* translators: %d: smallest group size */
            return sprintf(__('%d+ people', 'yatra'), $tier['min']);
        }
        if ($tier['max'] === $tier['min']) {
            /* translators: %d: group size */
            return sprintf(_n('%d person', '%d people', $tier['min'], 'yatra'), $tier['min']);
        }

        /* translators: 1: smallest group size, 2: largest group size */
        return sprintf(__('%1$d–%2$d people', 'yatra'), $tier['min'], $tier['max']);
    }

    /** @param mixed $params */
    public static function beforeCalculation($params)
    {
        $params = is_array($params) ? $params : [];
        $tripId = (int) ($params['trip_id'] ?? 0);
        $travellers = (int) ($params['travelers_count'] ?? 0);
        if ($travellers <= 0 && is_array($params['traveler_counts'] ?? null)) {
            $travellers = (int) array_sum(array_map('intval', $params['traveler_counts']));
        }
        self::$pricing = $tripId > 0 ? ['trip_id' => $tripId, 'travelers' => max(1, $travellers)] : null;

        return $params;
    }

    /** @param mixed $price @param mixed $tripId @param mixed $context */
    public static function tierPrice($price, $tripId = 0, $context = [])
    {
        $tripId = (int) $tripId;
        if (self::$pricing === null || $tripId <= 0 || $tripId !== self::$pricing['trip_id']) {
            return $price;
        }
        $tier = self::tierFor($tripId, self::$pricing['travelers']);
        if ($tier === null) {
            return $price;
        }

        /**
         * Per-person price from a group-size tier.
         *
         * @since 3.3.0
         * @param float $tierPrice Tier price.
         * @param float $price     Price without the tier.
         * @param int   $tripId    Trip.
         * @param int   $travellers Group size.
         */
        return (float) apply_filters('yatra_group_tier_price', $tier['price'], (float) $price, $tripId, self::$pricing['travelers']);
    }

    public static function flush(): void
    {
        self::$cache = [];
    }
}
