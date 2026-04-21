<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Repositories\BookingRepository;
use Yatra\Repositories\AdditionalServicesRepository;
use Yatra\Utils\Logger;

/**
 * Additional Services persistence + retrieval (free fallback).
 *
 * Pro modules can override via existing hooks:
 * - yatra_booking_save_services
 * - yatra_booking_get_services
 *
 * This implementation stores selected additional service IDs (and optional snapshot)
 * in the bookings.meta JSON so the admin "View Booking" screen can display them.
 */
class AdditionalServicesBookingService
{
    private static ?self $instance = null;

    public static function init(): void
    {
        if (self::$instance !== null) {
            return;
        }
        self::$instance = new self();

        add_action('yatra_booking_save_services', [self::$instance, 'saveServicesToBookingMeta'], 10, 5);
        add_filter('yatra_booking_get_services', [self::$instance, 'getServicesForBooking'], 5, 2);
    }

    /**
     * Persist selected services into booking meta.
     *
     * @param int   $booking_id
     * @param int   $trip_id
     * @param array $data Request data (expects additional_services: int[])
     * @param int   $travelers_count
     * @param int   $duration_days
     */
    public function saveServicesToBookingMeta(int $booking_id, int $trip_id, array $data, int $travelers_count, int $duration_days): void
    {
        $selected = $data['additional_services'] ?? [];
        if (!is_array($selected)) {
            $selected = [];
        }
        $selected = array_values(array_unique(array_map('intval', array_filter($selected))));

        // If nothing selected, still store empty array for clarity.
        $repo = new BookingRepository();
        $booking = $repo->findWithTrip($booking_id);
        if (!$booking) {
            return;
        }

        $meta = [];
        if (!empty($booking->meta) && is_string($booking->meta)) {
            $decoded = json_decode($booking->meta, true);
            $meta = is_array($decoded) ? $decoded : [];
        } elseif (!empty($booking->meta) && is_array($booking->meta)) {
            $meta = $booking->meta;
        }

        $meta['additional_services'] = $selected;
        $meta['additional_services_updated_at'] = current_time('mysql');

        // Optional: snapshot basic service info at booking time (name/price)
        $snapshot = $this->buildServicesSnapshot($selected);
        if ($snapshot !== []) {
            $meta['additional_services_snapshot'] = $snapshot;
        }

        $repo->update($booking_id, [
            'meta' => wp_json_encode($meta),
        ]);
    }

    /**
     * Return services for admin UI / API booking response.
     *
     * @param array $services Existing services from other filters (higher priority)
     * @param int   $booking_id
     * @return array<int, array<string, mixed>>
     */
    public function getServicesForBooking(array $services, int $booking_id): array
    {
        // If another module already provided services, keep them.
        if (!empty($services)) {
            return $services;
        }

        $repo = new BookingRepository();
        $booking = $repo->findWithTrip($booking_id);
        if (!$booking) {
            return [];
        }

        $meta = [];
        if (!empty($booking->meta) && is_string($booking->meta)) {
            $decoded = json_decode($booking->meta, true);
            $meta = is_array($decoded) ? $decoded : [];
        } elseif (!empty($booking->meta) && is_array($booking->meta)) {
            $meta = $booking->meta;
        }

        $selected = $meta['additional_services'] ?? [];
        if (!is_array($selected) || $selected === []) {
            return [];
        }

        $selected = array_values(array_unique(array_map('intval', array_filter($selected))));
        if ($selected === []) {
            return [];
        }

        if (defined('WP_DEBUG') && WP_DEBUG) {
            Logger::debug('AdditionalServicesBookingService: resolving services', [
                'context' => 'booking_services',
                'booking_id' => $booking_id,
                'selected_ids' => $selected,
                'has_snapshot' => !empty($meta['additional_services_snapshot']),
                'has_meta_column' => isset($booking->meta),
            ]);
        }

        // Prefer snapshot if present (keeps booking-time prices), else query live table.
        $snapshot = $meta['additional_services_snapshot'] ?? [];
        if (is_array($snapshot) && $snapshot !== []) {
            return array_values(array_filter(array_map(static function ($row) use ($selected) {
                if (!is_array($row)) {
                    return null;
                }
                $id = isset($row['id']) ? (int) $row['id'] : 0;
                if ($id <= 0 || !in_array($id, $selected, true)) {
                    return null;
                }
                return [
                    'id' => $id,
                    'name' => (string) ($row['name'] ?? ''),
                    'description' => (string) ($row['description'] ?? ''),
                    'price' => (float) ($row['price'] ?? 0),
                    'calculated_price' => (float) ($row['price'] ?? 0),
                    'selected' => true,
                ];
            }, $snapshot)));
        }

        return $this->queryServicesByIds($selected, $booking);
    }

    /**
     * Query additional services table for display.
     *
     * @param int[] $ids
     * @return array<int, array<string, mixed>>
     */
    private function queryServicesByIds(array $ids, ?object $booking = null): array
    {
        $ids = array_values(array_unique(array_map('intval', array_filter($ids))));
        if ($ids === []) {
            return [];
        }
        $repo = new AdditionalServicesRepository();
        $rows = $repo->getByIds($ids);

        if (defined('WP_DEBUG') && WP_DEBUG) {
            Logger::debug('AdditionalServicesBookingService: services fetched', [
                'context' => 'booking_services',
                'ids' => $ids,
                'count' => count($rows),
                'sample' => $rows[0] ?? null,
            ]);
        }

        $context = $this->bookingContextForServiceCalc($booking);

        return array_map(static function (array $row) use ($context): array {
            $price = (float) ($row['price'] ?? 0);
            $priceType = (string) (($row['price_type'] ?? 'fixed') ?: 'fixed');
            $pricePer = (string) (($row['price_per'] ?? 'booking') ?: 'booking');

            $calculated = self::calculateServicePrice(
                $price,
                $priceType,
                $pricePer,
                (int) ($context['travelers_count'] ?? 1),
                (int) ($context['duration_days'] ?? 1),
                (float) ($context['base_amount'] ?? 0)
            );
            return [
                'id' => (int) ($row['id'] ?? 0),
                'name' => (string) ($row['name'] ?? ''),
                'description' => (string) ($row['description'] ?? ''),
                'price' => $price,
                'calculated_price' => $calculated,
                'price_type' => $priceType,
                'price_per' => $pricePer,
                'selected' => true,
            ];
        }, $rows);
    }

    /**
     * Compute booking context used for service price calculation.
     *
     * @return array{travelers_count:int,duration_days:int,base_amount:float}
     */
    private function bookingContextForServiceCalc(?object $booking): array
    {
        $travelers = 1;
        $duration = 1;
        $baseAmount = 0.0;

        if (is_object($booking)) {
            $travelers = (int) ($booking->travelers_count ?? 1);
            if ($travelers <= 0) {
                $travelers = 1;
            }

            // Duration: use booking start/end if present; else 1.
            $start = !empty($booking->start_date) ? (string) $booking->start_date : (!empty($booking->travel_date) ? (string) $booking->travel_date : '');
            $end = !empty($booking->end_date) ? (string) $booking->end_date : '';
            if ($start !== '' && $end !== '') {
                try {
                    $startDt = new \DateTime($start);
                    $endDt = new \DateTime($end);
                    $diff = (int) $endDt->diff($startDt)->days;
                    $duration = max(1, $diff + 1);
                } catch (\Throwable $e) {
                    $duration = 1;
                }
            }

            // Base amount for percentage services: use booking subtotal if set, else total_amount (pre-tax when possible).
            $total = (float) ($booking->total_amount ?? 0);
            $tax = (float) ($booking->tax_amount ?? 0);
            $taxInclusive = !empty($booking->tax_inclusive);
            $subtotal = isset($booking->subtotal) ? (float) $booking->subtotal : 0.0;

            if ($subtotal > 0) {
                $baseAmount = $subtotal;
            } elseif (!$taxInclusive && $tax > 0 && $total > 0) {
                $baseAmount = max(0.0, $total - $tax);
            } else {
                $baseAmount = $total;
            }
        }

        return [
            'travelers_count' => $travelers,
            'duration_days' => $duration,
            'base_amount' => $baseAmount,
        ];
    }

    /**
     * Calculate effective service cost.
     */
    private static function calculateServicePrice(
        float $price,
        string $priceType,
        string $pricePer,
        int $travelersCount,
        int $durationDays,
        float $baseAmount
    ): float {
        $travelersCount = max(1, $travelersCount);
        $durationDays = max(1, $durationDays);

        $amount = 0.0;

        if ($priceType === 'percentage') {
            // Percentage services are assumed to apply to the booking base amount.
            $amount = max(0.0, $baseAmount) * ($price / 100.0);
            // Treat percentage as per-booking by default (avoids double-counting).
            return round($amount, 2);
        }

        // Fixed price services.
        $amount = $price;
        switch ($pricePer) {
            case 'person':
                $amount = $price * $travelersCount;
                break;
            case 'day':
                $amount = $price * $durationDays;
                break;
            case 'booking':
            default:
                $amount = $price;
                break;
        }

        return round($amount, 2);
    }

    /**
     * Build a stable snapshot for the selected services.
     *
     * @param int[] $ids
     * @return array<int, array<string, mixed>>
     */
    private function buildServicesSnapshot(array $ids): array
    {
        $rows = $this->queryServicesByIds($ids);
        if ($rows === []) {
            return [];
        }

        return array_map(static function (array $row): array {
            return [
                'id' => (int) ($row['id'] ?? 0),
                'name' => (string) ($row['name'] ?? ''),
                'description' => (string) ($row['description'] ?? ''),
                'price' => (float) ($row['price'] ?? 0),
            ];
        }, $rows);
    }
}

