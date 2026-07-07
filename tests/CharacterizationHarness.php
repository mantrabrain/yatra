<?php

namespace Yatra\Tests;

use Yatra\Services\CalculationService;
use Yatra\Services\CapacityService;
use Yatra\Services\TaxService;
use Yatra\Repositories\TripRepository;

/**
 * Characterization (golden-master) harness for the money / inventory core.
 *
 * Sprint 0 safety net for the Track A hardening work: it captures the CURRENT
 * output of the deterministic calculation surface — per-trip pricing, tax, and
 * capacity resolution — into a JSON snapshot. After a Track A change you re-run
 * in `compare` mode; any difference (other than the defect being fixed) is a
 * regression and fails the run.
 *
 * This does NOT assert "correct" values — it asserts "unchanged" values, which
 * is exactly what a refactor of the booking core must guarantee. Free-core only
 * (lives in the free plugin per the free/pro split); Pro pricing surfaces only
 * as whatever its filters contribute at run time.
 *
 * Determinism: inputs use FIXED absolute dates and a fixed fixture set (published
 * trips ordered by id). Capture the baseline and compare within the same dev
 * cycle so any time-relative Pro dynamic-pricing rule keys off the same "now".
 *
 * @package Yatra\Tests
 * @since 3.0.9
 */
class CharacterizationHarness
{
    /** Fixed future travel dates so the snapshot doesn't drift day-to-day. */
    private const DATES = ['2027-01-15', '2027-06-20'];

    /** Traveler-count scenarios exercised per trip. */
    private const TRAVELER_COUNTS = [1, 2, 4];

    /** Max fixture trips (ordered by id) to keep the snapshot bounded. */
    private const MAX_TRIPS = 12;

    /**
     * Build the full snapshot as a deterministic, sorted array.
     *
     * @return array<string, mixed>
     */
    public function capture(): array
    {
        return [
            'meta'     => [
                'schema'    => 1,
                'note'      => 'Golden-master of the free calc/capacity/tax core. Compare within one dev cycle.',
            ],
            'tax'      => $this->captureTax(),
            'pricing'  => $this->capturePricing(),
            'capacity' => $this->captureCapacity(),
        ];
    }

    /**
     * TaxService::calculateTax — a pure function, no fixtures needed.
     *
     * @return array<string, mixed>
     */
    private function captureTax(): array
    {
        $taxService = new TaxService();
        $out = [];
        foreach ([0.0, 100.0, 1000.55, 12345.67] as $amount) {
            foreach (['US', 'GB', 'NP', ''] as $country) {
                $key = number_format($amount, 2, '.', '') . '|' . ($country === '' ? '_' : $country);
                try {
                    $out[$key] = $taxService->calculateTax($amount, $country);
                } catch (\Throwable $e) {
                    $out[$key] = ['__error' => $e->getMessage()];
                }
            }
        }
        return $out;
    }

    /**
     * CalculationService::calculatePricing across the fixture matrix.
     *
     * @return array<string, mixed>
     */
    private function capturePricing(): array
    {
        $calc = new CalculationService();
        $out  = [];

        foreach ($this->fixtureTripIds() as $tripId) {
            $trip = (new TripRepository())->find($tripId);
            if (!$trip) {
                continue;
            }
            $travelerCounts = $this->deriveTravelerCounts($trip);

            foreach (self::TRAVELER_COUNTS as $count) {
                foreach (['full', 'partial'] as $paymentMethod) {
                    $params = [
                        'trip_id'         => $tripId,
                        'travelers_count' => $count,
                        'travel_date'     => self::DATES[0],
                        'payment_method'  => $paymentMethod,
                    ];
                    // Traveler-based trips need per-category counts; scale the
                    // derived template by the scenario count on the first category.
                    if (!empty($travelerCounts)) {
                        $params['traveler_counts'] = $this->scaleTravelerCounts($travelerCounts, $count);
                    }

                    $key = "trip{$tripId}|n{$count}|{$paymentMethod}";
                    try {
                        $out[$key] = $calc->calculatePricing($params);
                    } catch (\Throwable $e) {
                        $out[$key] = ['__error' => $e->getMessage()];
                    }
                }
            }
        }
        return $out;
    }

    /**
     * CapacityService::getCapacityForDate across trips x fixed dates.
     *
     * @return array<string, int|array<string, mixed>>
     */
    private function captureCapacity(): array
    {
        $capacity = new CapacityService();
        $out = [];
        foreach ($this->fixtureTripIds() as $tripId) {
            foreach (self::DATES as $date) {
                $key = "trip{$tripId}|{$date}";
                try {
                    $out[$key] = $capacity->getCapacityForDate($tripId, $date);
                } catch (\Throwable $e) {
                    $out[$key] = ['__error' => $e->getMessage()];
                }
            }
        }
        return $out;
    }

    /**
     * Published trip ids, ordered, bounded — the fixture set.
     *
     * @return array<int, int>
     */
    private function fixtureTripIds(): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trips';
        $ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT id FROM {$table} WHERE status = %s ORDER BY id ASC LIMIT %d",
                'publish',
                self::MAX_TRIPS
            )
        );
        return array_map('intval', (array) $ids);
    }

    /**
     * Build a valid per-category traveler_counts template (1 per category) for a
     * traveler-based trip; empty for regular-priced trips.
     *
     * @return array<int|string, int>
     */
    private function deriveTravelerCounts(object $trip): array
    {
        $raw = $trip->price_types ?? null;
        if (is_string($raw)) {
            $raw = json_decode($raw, true);
        }
        if (!is_array($raw) || empty($raw)) {
            return [];
        }
        $counts = [];
        foreach ($raw as $pt) {
            $categoryId = is_array($pt) ? ($pt['category_id'] ?? null) : null;
            if ($categoryId !== null) {
                $counts[(string) $categoryId] = 1;
            }
        }
        return $counts;
    }

    /**
     * Put the scenario headcount on the first category, keep the rest at their
     * template value — a deterministic way to vary total travelers.
     *
     * @param array<int|string, int> $template
     * @return array<int|string, int>
     */
    private function scaleTravelerCounts(array $template, int $count): array
    {
        $scaled = $template;
        $firstKey = array_key_first($scaled);
        if ($firstKey !== null) {
            $scaled[$firstKey] = $count;
        }
        return $scaled;
    }

    // ── Snapshot I/O + diff ─────────────────────────────────────────────

    /**
     * Recursively sort keys and normalize floats so the JSON is byte-stable
     * across runs (independent of PHP array/query ordering).
     *
     * @param mixed $value
     * @return mixed
     */
    public static function normalize($value)
    {
        if (is_array($value)) {
            $normalized = [];
            foreach ($value as $k => $v) {
                $normalized[$k] = self::normalize($v);
            }
            // Sort associative keys; preserve list order.
            if ($normalized !== [] && array_keys($normalized) !== range(0, count($normalized) - 1)) {
                ksort($normalized);
            }
            return $normalized;
        }
        if (is_float($value)) {
            // Collapse -0.0 and trim FP noise to cents-safe precision.
            return round($value + 0, 6);
        }
        return $value;
    }

    public static function toJson(array $snapshot): string
    {
        return (string) json_encode(
            self::normalize($snapshot),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Diff two normalized snapshots; returns a flat list of "path: old -> new"
     * differences (empty array = identical).
     *
     * @return array<int, string>
     */
    public static function diff(array $baseline, array $current, string $path = ''): array
    {
        $baseline = self::normalize($baseline);
        $current  = self::normalize($current);
        $diffs = [];
        $keys = array_unique(array_merge(array_keys($baseline), array_keys($current)));
        foreach ($keys as $key) {
            $p = $path === '' ? (string) $key : $path . '.' . $key;
            $inB = array_key_exists($key, $baseline);
            $inC = array_key_exists($key, $current);
            if (!$inC) {
                $diffs[] = "{$p}: REMOVED (was " . self::scalarize($baseline[$key]) . ')';
                continue;
            }
            if (!$inB) {
                $diffs[] = "{$p}: ADDED (now " . self::scalarize($current[$key]) . ')';
                continue;
            }
            $bv = $baseline[$key];
            $cv = $current[$key];
            if (is_array($bv) && is_array($cv)) {
                $diffs = array_merge($diffs, self::diff($bv, $cv, $p));
            } elseif ($bv !== $cv) {
                $diffs[] = "{$p}: " . self::scalarize($bv) . ' -> ' . self::scalarize($cv);
            }
        }
        return $diffs;
    }

    /**
     * @param mixed $v
     */
    private static function scalarize($v): string
    {
        if (is_array($v)) {
            return '[' . count($v) . ' items]';
        }
        if (is_bool($v)) {
            return $v ? 'true' : 'false';
        }
        if ($v === null) {
            return 'null';
        }
        return (string) $v;
    }
}
