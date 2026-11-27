<?php

declare(strict_types=1);

namespace Yatra\Multilingual;

/**
 * The visible texts of a trip, as one list, so the same walk both registers
 * them with the multilingual plugin and swaps in their translations — the two
 * can never disagree about which texts exist or what they are called.
 *
 * Works on the trip prepared for the trip page (SingleTripController).
 */
final class TripStrings
{
    /** Plain text fields on the trip itself => multiline? */
    private const FIELDS = [
        'title' => false,
        'short_description' => true,
        'description' => true,
        'trip_details' => true,
        'what_makes_special' => true,
        'trip_story' => true,
        'starting_location' => false,
        'ending_location' => false,
        'payment_terms' => true,
        'physical_requirements' => true,
        'visa_requirements' => true,
        'vaccination_requirements' => true,
        'cancellation_policy' => true,
        'accommodation_details' => true,
        'pickup_location' => false,
        'dropoff_location' => false,
        'transportation_details' => true,
        'best_season' => false,
        'meta_title' => false,
        'meta_description' => true,
    ];

    /** Lists of objects/arrays => their text keys. */
    private const LISTS = [
        'included_items' => ['title', 'description'],
        'excluded_items' => ['title', 'description'],
        'faqs' => ['title', 'description'],
        'frontend_tabs' => ['label'],
        'attributes' => ['name', 'description', 'value'],
        'price_types' => ['category_label', 'label'],
    ];

    /** Lists of plain strings. */
    private const STRING_LISTS = ['highlights', 'landmarks'];

    /** Classification lists (destinations, activities, categories) => term texts. */
    private const TERMS = ['destinations', 'activities', 'trip_categories'];

    /**
     * Every text of the trip: [value, hint, multiline].
     *
     * @return array<int, array{0:string, 1:string, 2:bool}>
     */
    public static function collect(object $trip): array
    {
        $out = [];
        self::walk($trip, static function (string $value, string $hint, bool $multiline) use (&$out): string {
            $out[] = [$value, $hint, $multiline];

            return $value;
        });

        return $out;
    }

    /** The trip with every text in the visitor's language. */
    public static function translate(object $trip): object
    {
        if (!Multilingual::isTranslating()) {
            return $trip;
        }

        self::walk($trip, static function (string $value, string $hint): string {
            return Multilingual::translate($value, $hint);
        });

        return $trip;
    }

    /** Hint for one trip field (also used by the Trip model's getters). */
    public static function hint(int $tripId, string $field): string
    {
        return 'Trip ' . $tripId . ' ' . $field;
    }

    /**
     * One hint for every term text, wherever it shows (trip page, cards,
     * filters, taxonomy page), so WPML finds the same string everywhere.
     */
    public static function termHint(string $field = ''): string
    {
        return 'Term';
    }

    /**
     * @param callable(string, string, bool): string $visit Returns the value to store.
     */
    private static function walk(object $trip, callable $visit): void
    {
        $id = (int) ($trip->id ?? 0);

        foreach (self::FIELDS as $field => $multiline) {
            if (isset($trip->$field) && is_string($trip->$field) && trim($trip->$field) !== '') {
                $trip->$field = $visit($trip->$field, self::hint($id, $field), $multiline);
            }
        }

        foreach (self::STRING_LISTS as $field) {
            if (!isset($trip->$field) || !is_array($trip->$field)) {
                continue;
            }
            $list = $trip->$field;
            foreach ($list as $i => $text) {
                if (is_string($text) && trim($text) !== '') {
                    $list[$i] = $visit($text, self::hint($id, $field), true);
                }
            }
            $trip->$field = $list;
        }

        foreach (self::LISTS as $field => $keys) {
            if (isset($trip->$field) && is_array($trip->$field)) {
                $trip->$field = self::walkList($trip->$field, $keys, self::hint($id, $field), $visit);
            }
        }

        if (isset($trip->itinerary_days) && is_array($trip->itinerary_days)) {
            $days = $trip->itinerary_days;
            foreach ($days as $d => $day) {
                $isObject = is_object($day);
                $day = (array) $day;
                foreach (['day_title', 'day_description', 'title', 'description'] as $key) {
                    if (isset($day[$key]) && is_string($day[$key]) && trim($day[$key]) !== '') {
                        $day[$key] = $visit($day[$key], self::hint($id, 'itinerary'), true);
                    }
                }
                if (isset($day['entries']) && is_array($day['entries'])) {
                    $day['entries'] = self::walkList($day['entries'], ['title', 'description', 'location', 'notes'], self::hint($id, 'itinerary'), $visit);
                }
                $days[$d] = $isObject ? (object) $day : $day;
            }
            $trip->itinerary_days = $days;
        }

        foreach (self::TERMS as $field) {
            if (isset($trip->$field) && is_array($trip->$field)) {
                $trip->$field = self::walkList($trip->$field, ['name', 'description'], self::termHint($field), $visit);
            }
        }
    }

    /**
     * @param array<int|string, mixed> $list
     * @param string[]                 $keys
     * @return array<int|string, mixed>
     */
    private static function walkList(array $list, array $keys, string $hint, callable $visit): array
    {
        foreach ($list as $i => $item) {
            $isObject = is_object($item);
            if (!$isObject && !is_array($item)) {
                continue;
            }
            $row = (array) $item;
            foreach ($keys as $key) {
                if (isset($row[$key]) && is_string($row[$key]) && trim($row[$key]) !== '') {
                    $row[$key] = $visit($row[$key], $hint, true);
                }
            }
            $list[$i] = $isObject ? (object) $row : $row;
        }

        return $list;
    }
}
