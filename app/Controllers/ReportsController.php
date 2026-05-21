<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use WP_REST_Request;
use WP_REST_Response;

class ReportsController extends BaseController
{
    public function register_routes(): void
    {
        $namespace = 'yatra/v1';

        register_rest_route($namespace, '/reports', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_reports'],
                'permission_callback' => [$this, 'check_permission'],
            ],
        ]);
    }

    public function check_permission(?WP_REST_Request $request = null): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * GET /reports
     * Central reporting endpoint used by the admin Reports page.
     */
    public function get_reports(WP_REST_Request $request): WP_REST_Response
    {
        $dateFrom = $request->get_param('date_from');
        $dateTo   = $request->get_param('date_to');

        // Basic defaults: last 30 days if not provided
        if (!$dateFrom || !$dateTo) {
            $today   = new \DateTimeImmutable('today');
            $start   = $today->sub(new \DateInterval('P30D'));
            $dateFrom = $start->format('Y-m-d');
            $dateTo   = $today->format('Y-m-d');
        }

        // Build the previous-period window of equal length, ending the day
        // before $dateFrom. We aggregate this in parallel with the current
        // window so KPIs can return both an absolute number AND a percent
        // change vs. the prior period — the single thing operators ask for
        // in dashboards that previously rendered "+0%" for every metric.
        $fromDt = \DateTimeImmutable::createFromFormat('Y-m-d', $dateFrom);
        $toDt   = \DateTimeImmutable::createFromFormat('Y-m-d', $dateTo);
        $prevFrom = $dateFrom;
        $prevTo   = $dateFrom;
        if ($fromDt instanceof \DateTimeImmutable && $toDt instanceof \DateTimeImmutable) {
            // +1 because the range is inclusive on both ends.
            $rangeDays = (int) $fromDt->diff($toDt)->days + 1;
            $prevToDt   = $fromDt->sub(new \DateInterval('P1D'));
            $prevFromDt = $prevToDt->sub(new \DateInterval('P' . max(0, $rangeDays - 1) . 'D'));
            $prevFrom = $prevFromDt->format('Y-m-d');
            $prevTo   = $prevToDt->format('Y-m-d');
        }

        $params = [
            'date_from' => $dateFrom,
            'date_to'   => $dateTo,
        ];

        $bookingsList = $this->request('GET', '/yatra/v1/bookings', $params);
        $paymentsList = $this->request('GET', '/yatra/v1/payments', $params);
        $departuresList = $this->request('GET', '/yatra/v1/departures', [
            'date_from'   => $dateFrom,
            'date_to'     => $dateTo,
            'include_past' => 'false',
        ]);

        $bookings = isset($bookingsList['data']) && is_array($bookingsList['data'])
            ? $bookingsList['data']
            : (is_array($bookingsList) ? $bookingsList : []);
        $payments = is_array($paymentsList) ? $paymentsList : [];
        $departures = isset($departuresList['data']) && is_array($departuresList['data'])
            ? $departuresList['data']
            : (is_array($departuresList) ? $departuresList : []);

        // ------------------------------------------------------------------
        // Normalize and strictly filter bookings to the requested date range
        // using created_at (or travel_date) so that "Today" and other
        // filters only reflect bookings actually in that window.
        // ------------------------------------------------------------------
        $fromTs = strtotime($dateFrom . ' 00:00:00');
        $toTs   = strtotime($dateTo . ' 23:59:59');

        if ($fromTs === false || $toTs === false) {
            $fromTs = null;
            $toTs = null;
        }

        $filteredBookings = [];
        foreach ($bookings as $b) {
            $createdAt = $b['created_at'] ?? ($b['travel_date'] ?? null);
            if (!$createdAt) {
                continue;
            }
            $ts = strtotime((string) $createdAt);
            if ($ts === false) {
                continue;
            }
            if ($fromTs !== null && ($ts < $fromTs || $ts > $toTs)) {
                continue;
            }
            $filteredBookings[] = $b;
        }

        $bookings = $filteredBookings;

        // ------------------------------------------------------------------
        // Revenue stats (derived from filtered bookings only)
        // ------------------------------------------------------------------
        $totalRevenue = 0.0;
        $totalBookings = count($bookings);

        foreach ($bookings as $b) {
            if (isset($b['total_amount'])) {
                $totalRevenue += (float) $b['total_amount'];
            }
        }

        $averageBooking = $totalBookings > 0 ? $totalRevenue / $totalBookings : 0.0;

        // --- Previous-period aggregates (for period-over-period deltas) ---
        // Same shape as current-period: pull bookings within the prior
        // window, sum revenue + count. Cheap because /bookings already
        // applies a paginated cap; we accept that as the trade-off vs.
        // adding a dedicated repository method.
        $prevBookingsList = $this->request('GET', '/yatra/v1/bookings', [
            'date_from' => $prevFrom,
            'date_to'   => $prevTo,
        ]);
        $prevBookings = isset($prevBookingsList['data']) && is_array($prevBookingsList['data'])
            ? $prevBookingsList['data']
            : (is_array($prevBookingsList) ? $prevBookingsList : []);

        $prevFromTs = strtotime($prevFrom . ' 00:00:00');
        $prevToTs   = strtotime($prevTo . ' 23:59:59');
        $prevTotalRevenue  = 0.0;
        $prevTotalBookings = 0;
        $prevCancelled     = 0;
        $prevConfirmed     = 0;
        foreach ($prevBookings as $b) {
            $createdAt = $b['created_at'] ?? ($b['travel_date'] ?? null);
            $ts = $createdAt ? strtotime((string) $createdAt) : false;
            if ($ts === false || $prevFromTs === false || $prevToTs === false) continue;
            if ($ts < $prevFromTs || $ts > $prevToTs) continue;
            $prevTotalBookings++;
            $prevTotalRevenue += isset($b['total_amount']) ? (float) $b['total_amount'] : 0.0;
            $prevStatus = strtolower((string) ($b['status'] ?? ''));
            if ($prevStatus === 'cancelled') $prevCancelled++;
            if ($prevStatus === 'confirmed' || $prevStatus === 'completed') $prevConfirmed++;
        }
        $prevAverageBooking = $prevTotalBookings > 0 ? $prevTotalRevenue / $prevTotalBookings : 0.0;

        $pctChange = static function (float $current, float $previous): float {
            if ($previous == 0.0) {
                // Going from 0 to anything positive isn't infinity — clamp
                // to +100% (or 0 if both are zero) so the UI doesn't render
                // "Infinity%" cards.
                return $current > 0 ? 100.0 : 0.0;
            }
            return (($current - $previous) / $previous) * 100.0;
        };

        $revenueStats = [
            'total'         => $totalRevenue,
            'bookings'      => $totalBookings,
            'average'       => $averageBooking,
            'previous'      => $prevTotalRevenue,
            'change'        => $pctChange($totalRevenue, $prevTotalRevenue),
            // Avg-booking-value delta is its own thing; surface it so the
            // KPI card can show "+8% AOV" alongside the revenue delta.
            'averagePrevious' => $prevAverageBooking,
            'averageChange'   => $pctChange($averageBooking, $prevAverageBooking),
        ];

        // ------------------------------------------------------------------
        // Booking stats & trends
        // ------------------------------------------------------------------
        $statusCounts = [
            'confirmed' => 0,
            'pending'   => 0,
            'cancelled' => 0,
            'completed' => 0,
        ];

        // Aggregate by DAY so the trend charts can show one point per day in
        // the selected range. We also track per-day status counts so the
        // Reports detail-breakdown table can render "confirmed / pending /
        // cancelled" columns from REAL data instead of the synthetic 80/15/5
        // split it previously fabricated client-side.
        $byDayCount = [];
        $byDayRevenue = [];
        $byDayStatus = []; // [yyyy-mm-dd][status] => int

        foreach ($bookings as $b) {
            $status = strtolower((string) ($b['status'] ?? 'pending'));
            if (isset($statusCounts[$status])) {
                $statusCounts[$status]++;
            }

            $createdAt = $b['created_at'] ?? ($b['travel_date'] ?? null);
            if (!$createdAt) {
                continue;
            }
            $ts = strtotime((string) $createdAt);
            if ($ts === false) {
                continue;
            }
            $dayKey = gmdate('Y-m-d', $ts);
            $amount = isset($b['total_amount']) ? (float) $b['total_amount'] : 0.0;

            if (!isset($byDayCount[$dayKey])) {
                $byDayCount[$dayKey] = 0;
                $byDayRevenue[$dayKey] = 0.0;
                $byDayStatus[$dayKey] = [
                    'confirmed' => 0, 'pending' => 0,
                    'cancelled' => 0, 'completed' => 0,
                ];
            }
            $byDayCount[$dayKey]++;
            $byDayRevenue[$dayKey] += $amount;
            if (isset($byDayStatus[$dayKey][$status])) {
                $byDayStatus[$dayKey][$status]++;
            }
        }

        $totalCount = array_sum($statusCounts);
        $cancelled = $statusCounts['cancelled'];
        $cancellationRate = $totalCount > 0 ? ($cancelled / $totalCount) * 100.0 : 0.0;

        // Build a continuous list of DAYS across the selected range so that
        // the charts always reflect the full date window (including days
        // with zero bookings), rather than only the days that have data.
        //
        // Each point ships both a human label ("1 Nov") AND the ISO date
        // ("2025-11-01"). The label is fine for default chart axes; the
        // date lets the detail-breakdown UI re-bucket day data into weeks
        // / months without parsing localised strings.
        $bookingTrend = [];
        $revenueTrend = [];
        $statusTrend  = []; // [{date, label, confirmed, pending, cancelled, completed}]

        if ($fromTs !== null && $toTs !== null && $fromTs <= $toTs) {
            $day = $fromTs;

            while ($day <= $toTs) {
                $key = gmdate('Y-m-d', $day);
                $count   = $byDayCount[$key] ?? 0;
                $revenue = $byDayRevenue[$key] ?? 0.0;
                $statusRow = $byDayStatus[$key] ?? [
                    'confirmed' => 0, 'pending' => 0,
                    'cancelled' => 0, 'completed' => 0,
                ];

                $dt = \DateTimeImmutable::createFromFormat('Y-m-d', $key);
                if ($dt) {
                    $label = $dt->format('j M');
                    $bookingTrend[] = [
                        'date'  => $key,
                        'label' => $label,
                        'value' => $count,
                    ];
                    $revenueTrend[] = [
                        'date'  => $key,
                        'label' => $label,
                        'value' => $revenue,
                    ];
                    $statusTrend[] = [
                        'date'      => $key,
                        'label'     => $label,
                        'confirmed' => $statusRow['confirmed'],
                        'pending'   => $statusRow['pending'],
                        'cancelled' => $statusRow['cancelled'],
                        'completed' => $statusRow['completed'],
                    ];
                }

                // increment by one day
                $day = strtotime('+1 day', $day);
            }
        }

        // Conversion rate = bookings that landed in a "money-good" terminal
        // state (confirmed OR completed) / total bookings in the window.
        // This is the simplest defensible definition without an enquiries-
        // to-bookings funnel — operators tracking that should add the
        // enquiry-count denominator in a follow-up.
        $convertedCount = $statusCounts['confirmed'] + $statusCounts['completed'];
        $conversionRate = $totalCount > 0 ? ($convertedCount / $totalCount) * 100.0 : 0.0;

        $prevConversionRate = $prevTotalBookings > 0
            ? ($prevConfirmed / $prevTotalBookings) * 100.0
            : 0.0;
        $prevCancellationRate = $prevTotalBookings > 0
            ? ($prevCancelled / $prevTotalBookings) * 100.0
            : 0.0;

        $bookingStats = [
            'total'             => $totalCount,
            'confirmed'         => $statusCounts['confirmed'],
            'pending'           => $statusCounts['pending'],
            'cancelled'         => $statusCounts['cancelled'],
            'completed'         => $statusCounts['completed'],
            'cancellationRate'  => $cancellationRate,
            'conversionRate'    => $conversionRate,
            'averageBookingValue' => $averageBooking,
            'trend'             => $bookingTrend,
            // Period-over-period deltas (computed once, reused everywhere
            // the UI wants a small "↑ +12.4%" indicator next to the KPI).
            'previousTotal'      => $prevTotalBookings,
            'totalChange'        => $pctChange((float) $totalCount, (float) $prevTotalBookings),
            'previousConversionRate'  => $prevConversionRate,
            'conversionRateChange'    => $pctChange($conversionRate, $prevConversionRate),
            'previousCancellationRate' => $prevCancellationRate,
            'cancellationRateChange'   => $pctChange($cancellationRate, $prevCancellationRate),
        ];

        // ------------------------------------------------------------------
        // Trip performance (group by trip title).
        //
        // Bug fix: arsort() on an associative array whose values are
        // themselves arrays sorts by array-comparison rules (length, then
        // first differing element by key order). The result was
        // effectively non-deterministic — "Top Trips" never reflected the
        // actual top by count or revenue. We use uasort with an explicit
        // revenue-desc comparator. Ties break on count desc.
        // ------------------------------------------------------------------
        $trips = [];
        foreach ($bookings as $b) {
            $title = $b['trip_title'] ?? ($b['trip']['title'] ?? __('(Untitled Trip)', 'yatra'));
            $amount = isset($b['total_amount']) ? (float) $b['total_amount'] : 0.0;
            if (!isset($trips[$title])) {
                $trips[$title] = ['count' => 0, 'revenue' => 0.0];
            }
            $trips[$title]['count']++;
            $trips[$title]['revenue'] += $amount;
        }

        uasort($trips, static function (array $a, array $b): int {
            if ($b['revenue'] === $a['revenue']) {
                return $b['count'] <=> $a['count'];
            }
            return $b['revenue'] <=> $a['revenue'];
        });

        // Build a trip-title → occupancy map from departures so the
        // top-trips strip can show real seat utilization, not a 0
        // placeholder. We compute booked / capacity per trip across all
        // departures in the window. Trips with zero capacity emit 0.
        $occupancyByTripTitle = [];
        foreach ($departures as $d) {
            $tripTitle = $d['trip']['title'] ?? ($d['trip_title'] ?? '');
            if ($tripTitle === '') {
                continue;
            }
            $cap = (int) ($d['max_capacity'] ?? $d['total_spots'] ?? 0);
            $bkd = (int) ($d['booked_count'] ?? $d['travelers_count'] ?? 0);
            if (!isset($occupancyByTripTitle[$tripTitle])) {
                $occupancyByTripTitle[$tripTitle] = ['booked' => 0, 'capacity' => 0];
            }
            $occupancyByTripTitle[$tripTitle]['booked']   += $bkd;
            $occupancyByTripTitle[$tripTitle]['capacity'] += $cap;
        }

        $palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        $tripPerformance = [];
        $i = 0;
        foreach ($trips as $label => $stats) {
            if ($i >= 6) break;
            $occRow = $occupancyByTripTitle[$label] ?? null;
            $occ = ($occRow && $occRow['capacity'] > 0)
                ? round(($occRow['booked'] / $occRow['capacity']) * 100.0, 1)
                : 0.0;
            $tripPerformance[] = [
                'label'     => $label,
                'value'     => $stats['count'],
                'revenue'   => $stats['revenue'],
                'occupancy' => $occ,
                'color'     => $palette[$i % count($palette)],
            ];
            $i++;
        }

        // ------------------------------------------------------------------
        // Payment status breakdown
        // ------------------------------------------------------------------
        $byStatus = [];
        foreach ($payments as $p) {
            $status = strtolower((string) ($p['status'] ?? 'pending'));
            $amount = isset($p['amount']) ? (float) $p['amount'] : (isset($p['total_amount']) ? (float) $p['total_amount'] : 0.0);
            if (!isset($byStatus[$status])) {
                $byStatus[$status] = ['count' => 0, 'amount' => 0.0];
            }
            $byStatus[$status]['count']++;
            $byStatus[$status]['amount'] += $amount;
        }

        $statusOrder = [
            'paid'    => ['label' => __('Paid', 'yatra'),    'color' => '#10b981'],
            'pending' => ['label' => __('Pending', 'yatra'), 'color' => '#f59e0b'],
            'refunded'=> ['label' => __('Refunded', 'yatra'), 'color' => '#ef4444'],
            'partial' => ['label' => __('Partial', 'yatra'), 'color' => '#8b5cf6'],
        ];

        $paymentStatus = [];
        foreach ($statusOrder as $key => $meta) {
            if (!isset($byStatus[$key])) continue;
            $paymentStatus[] = [
                'label'  => $meta['label'],
                'value'  => $byStatus[$key]['count'],
                'amount' => $byStatus[$key]['amount'],
                'color'  => $meta['color'],
            ];
        }

        // ------------------------------------------------------------------
        // Operational stats from departures
        // ------------------------------------------------------------------
        $upcomingDepartures = 0;
        $totalCapacity = 0;
        $bookedCapacity = 0;
        $upcomingTrips = [];

        $todayTs = strtotime('today');

        foreach ($departures as $d) {
            $dateStr = $d['start_date'] ?? ($d['date'] ?? null);
            $depTs = $dateStr ? strtotime((string) $dateStr) : false;
            if ($depTs !== false && $depTs >= $todayTs) {
                $upcomingDepartures++;
                $upcomingTrips[] = [
                    'trip'     => $d['trip']['title'] ?? ($d['trip_title'] ?? __('Unknown Trip', 'yatra')),
                    'date'     => $dateStr,
                    'booked'   => (int) ($d['booked_count'] ?? $d['travelers_count'] ?? 0),
                    'capacity' => (int) ($d['max_capacity'] ?? $d['total_spots'] ?? 0),
                ];
            }

            $capacity = (int) ($d['max_capacity'] ?? $d['total_spots'] ?? 0);
            $booked = (int) ($d['booked_count'] ?? $d['travelers_count'] ?? 0);
            $totalCapacity += $capacity;
            $bookedCapacity += $booked;
        }

        $occupancyRate = $totalCapacity > 0 ? round(($bookedCapacity / $totalCapacity) * 100.0, 1) : 0.0;
        $averageGroupSize = $upcomingDepartures > 0 ? round($bookedCapacity / $upcomingDepartures, 1) : 0.0;

        $operationalStats = [
            'upcomingDepartures' => $upcomingDepartures,
            'totalCapacity'      => $totalCapacity,
            'bookedCapacity'     => $bookedCapacity,
            'occupancyRate'      => $occupancyRate,
            'averageGroupSize'   => $averageGroupSize,
            'upcomingTrips'      => $upcomingTrips,
        ];

        // ------------------------------------------------------------------
        // Customer analytics (group by email)
        // ------------------------------------------------------------------
        $customers = [];
        foreach ($bookings as $b) {
            $email = strtolower(trim((string) ($b['contact_email'] ?? $b['customer_email'] ?? '')));
            if ($email === '') {
                $email = __('Unknown', 'yatra');
            }
            $name = trim((string) (($b['contact_first_name'] ?? $b['customer_first_name'] ?? '') . ' ' . ($b['contact_last_name'] ?? $b['customer_last_name'] ?? '')));
            if ($name === '') {
                $name = $email;
            }
            $amount = isset($b['total_amount']) ? (float) $b['total_amount'] : 0.0;

            if (!isset($customers[$email])) {
                $customers[$email] = [
                    'name'     => $name,
                    'email'    => $email,
                    'bookings' => 0,
                    'revenue'  => 0.0,
                ];
            }
            $customers[$email]['bookings']++;
            $customers[$email]['revenue'] += $amount;
        }

        $customerList = array_values($customers);
        $totalCustomers = count($customerList);
        $newCustomers = 0;
        $returningCustomers = 0;
        $firstTime = 0;
        $returning23 = 0;
        $loyal4 = 0;
        $totalCustomerRevenue = 0.0;

        foreach ($customerList as $c) {
            $totalCustomerRevenue += $c['revenue'];
            if ($c['bookings'] === 1) {
                $newCustomers++;
                $firstTime++;
            } elseif ($c['bookings'] <= 3) {
                $returningCustomers++;
                $returning23++;
            } else {
                $returningCustomers++;
                $loyal4++;
            }
        }

        $repeatBookingRate = $totalCustomers > 0 ? ($returningCustomers / $totalCustomers) * 100.0 : 0.0;
        $customerLifetimeValue = $totalCustomers > 0 ? $totalCustomerRevenue / $totalCustomers : 0.0;

        usort($customerList, function ($a, $b) {
            return $b['revenue'] <=> $a['revenue'];
        });
        $topCustomers = array_slice($customerList, 0, 5);

        $customerSegments = [
            ['label' => __('First-time', 'yatra'),       'value' => $firstTime,    'color' => '#3b82f6'],
            ['label' => __('Returning (2-3)', 'yatra'), 'value' => $returning23, 'color' => '#10b981'],
            ['label' => __('Loyal (4+)', 'yatra'),       'value' => $loyal4,       'color' => '#f59e0b'],
        ];

        $customerAnalytics = [
            'newCustomers'          => $newCustomers,
            'returningCustomers'    => $returningCustomers,
            'totalCustomers'        => $totalCustomers,
            'customerLifetimeValue' => $customerLifetimeValue,
            'repeatBookingRate'     => $repeatBookingRate,
            'customerRetentionRate' => $repeatBookingRate,
            'topCustomers'          => $topCustomers,
            'customerSegments'      => $customerSegments,
        ];

        // --------------------------------------------------------------
        // Extended datasets for detailed reports UI
        // --------------------------------------------------------------

        // Revenue broken down by trip
        $revenueByTrip = [];
        foreach ($bookings as $b) {
            $tripTitle = $b['trip_title'] ?? ($b['trip']['title'] ?? __('(Untitled Trip)', 'yatra'));
            $amount = isset($b['total_amount']) ? (float) $b['total_amount'] : 0.0;
            $status = strtolower((string) ($b['payment_status'] ?? $b['status'] ?? 'pending'));

            if (!isset($revenueByTrip[$tripTitle])) {
                $revenueByTrip[$tripTitle] = [
                    'trip'          => $tripTitle,
                    'totalRevenue'  => 0.0,
                    'bookings'      => 0,
                    'paidTotal'     => 0.0,
                    'pendingTotal'  => 0.0,
                    'refundedTotal' => 0.0,
                ];
            }

            $revenueByTrip[$tripTitle]['totalRevenue'] += $amount;
            $revenueByTrip[$tripTitle]['bookings']++;

            if ($status === 'paid' || $status === 'completed') {
                $revenueByTrip[$tripTitle]['paidTotal'] += $amount;
            } elseif ($status === 'pending') {
                $revenueByTrip[$tripTitle]['pendingTotal'] += $amount;
            } elseif ($status === 'refunded' || $status === 'cancelled') {
                $revenueByTrip[$tripTitle]['refundedTotal'] += $amount;
            }
        }

        foreach ($revenueByTrip as &$tripRow) {
            $count = $tripRow['bookings'] > 0 ? $tripRow['bookings'] : 1;
            $tripRow['avgRevenuePerBooking'] = $tripRow['totalRevenue'] / $count;
        }
        unset($tripRow);
        $revenueByTripRows = array_values($revenueByTrip);

        // Flat bookings table used by detailed booking and cancellation views
        $bookingsTable = [];
        foreach ($bookings as $b) {
            $travelerCount = 0;
            $travelerCount += isset($b['adult_count']) ? (int) $b['adult_count'] : 0;
            $travelerCount += isset($b['child_count']) ? (int) $b['child_count'] : 0;
            $travelerCount += isset($b['senior_count']) ? (int) $b['senior_count'] : 0;
            $travelerCount += isset($b['student_count']) ? (int) $b['student_count'] : 0;

            if ($travelerCount === 0 && isset($b['travelers_count'])) {
                $travelerCount = (int) $b['travelers_count'];
            }

            $bookingsTable[] = [
                'id'                 => $b['id'] ?? null,
                'bookingNumber'      => $b['booking_number'] ?? ($b['id'] ?? null),
                'trip'               => $b['trip_title'] ?? ($b['trip']['title'] ?? __('(Untitled Trip)', 'yatra')),
                'departureDate'      => $b['travel_date'] ?? null,
                'travelerCount'      => $travelerCount,
                'price'              => isset($b['total_amount']) ? (float) $b['total_amount'] : 0.0,
                'paymentMethod'      => $b['payment_method'] ?? ($b['gateway'] ?? null),
                'status'             => strtolower((string) ($b['status'] ?? 'pending')),
                'cancellationReason' => $b['cancellation_reason'] ?? null,
                'refundAmount'       => isset($b['refund_amount']) ? (float) $b['refund_amount'] : 0.0,
            ];
        }

        // Traveler segments (adult / child / senior / student) and trend
        $travelerBuckets = [
            'adult'   => 0,
            'child'   => 0,
            'senior'  => 0,
            'student' => 0,
        ];
        $byDayTravelers = [];

        foreach ($bookings as $b) {
            $adult   = isset($b['adult_count']) ? (int) $b['adult_count'] : 0;
            $child   = isset($b['child_count']) ? (int) $b['child_count'] : 0;
            $senior  = isset($b['senior_count']) ? (int) $b['senior_count'] : 0;
            $student = isset($b['student_count']) ? (int) $b['student_count'] : 0;

            $travelerBuckets['adult']   += $adult;
            $travelerBuckets['child']   += $child;
            $travelerBuckets['senior']  += $senior;
            $travelerBuckets['student'] += $student;

            $createdAt = $b['created_at'] ?? ($b['travel_date'] ?? null);
            if (!$createdAt) {
                continue;
            }
            $ts = strtotime((string) $createdAt);
            if ($ts === false) {
                continue;
            }
            $dayKey = gmdate('Y-m-d', $ts);
            $totalTravelers = $adult + $child + $senior + $student;
            if (!isset($byDayTravelers[$dayKey])) {
                $byDayTravelers[$dayKey] = 0;
            }
            $byDayTravelers[$dayKey] += $totalTravelers;
        }

        $travelersTrend = [];
        if ($fromTs !== null && $toTs !== null && $fromTs <= $toTs) {
            $day = $fromTs;
            while ($day <= $toTs) {
                $key = gmdate('Y-m-d', $day);
                $count = $byDayTravelers[$key] ?? 0;
                $dt = \DateTimeImmutable::createFromFormat('Y-m-d', $key);
                if ($dt) {
                    $travelersTrend[] = [
                        'date'  => $key,
                        'label' => $dt->format('j M'),
                        'value' => $count,
                    ];
                }
                $day = strtotime('+1 day', $day);
            }
        }

        $totalTravelersAll = array_sum($travelerBuckets);
        $avgTravelersPerBooking = $totalBookings > 0 ? $totalTravelersAll / $totalBookings : 0.0;
        $topTravelerCategory = null;
        if ($totalTravelersAll > 0) {
            $maxVal = -1;
            foreach ($travelerBuckets as $key => $val) {
                if ($val > $maxVal) {
                    $maxVal = $val;
                    $topTravelerCategory = $key;
                }
            }
        }

        $travelerSegments = [
            'segments' => [
                ['label' => __('Adult', 'yatra'),   'key' => 'adult',   'value' => $travelerBuckets['adult']],
                ['label' => __('Child', 'yatra'),   'key' => 'child',   'value' => $travelerBuckets['child']],
                ['label' => __('Senior', 'yatra'), 'key' => 'senior',  'value' => $travelerBuckets['senior']],
                ['label' => __('Student', 'yatra'), 'key' => 'student', 'value' => $travelerBuckets['student']],
            ],
            'totalTravelers'         => $totalTravelersAll,
            'avgTravelersPerBooking' => $avgTravelersPerBooking,
            'topCategory'            => $topTravelerCategory,
            'trend'                  => $travelersTrend,
        ];

        // Departures table and occupancy datasets
        $departuresTable = [];
        $occupancyByDay = [];
        $capacityByDay = [];
        $seatUtilizationByTrip = [];

        foreach ($departures as $d) {
            $dateStr = $d['start_date'] ?? ($d['date'] ?? null);
            $tripTitle = $d['trip']['title'] ?? ($d['trip_title'] ?? __('Unknown Trip', 'yatra'));
            $capacity = (int) ($d['max_capacity'] ?? $d['total_spots'] ?? 0);
            $booked   = (int) ($d['booked_count'] ?? $d['travelers_count'] ?? 0);
            $left     = $capacity > 0 ? max(0, $capacity - $booked) : 0;
            $status   = strtolower((string) ($d['status'] ?? 'upcoming'));

            $departuresTable[] = [
                'date'        => $dateStr,
                'trip'        => $tripTitle,
                'maxSeats'    => $capacity,
                'bookedSeats' => $booked,
                'leftSeats'   => $left,
                'status'      => $status,
            ];

            if ($dateStr) {
                $dayKey = substr((string) $dateStr, 0, 10);
                if (!isset($occupancyByDay[$dayKey])) {
                    $occupancyByDay[$dayKey] = 0;
                    $capacityByDay[$dayKey] = 0;
                }
                $occupancyByDay[$dayKey] += $booked;
                $capacityByDay[$dayKey]  += $capacity;
            }

            if (!isset($seatUtilizationByTrip[$tripTitle])) {
                $seatUtilizationByTrip[$tripTitle] = ['trip' => $tripTitle, 'booked' => 0, 'capacity' => 0];
            }
            $seatUtilizationByTrip[$tripTitle]['booked'] += $booked;
            $seatUtilizationByTrip[$tripTitle]['capacity'] += $capacity;
        }

        $occupancyTrend = [];
        foreach ($occupancyByDay as $dayKey => $bookedSum) {
            $capSum = $capacityByDay[$dayKey] ?? 0;
            if ($capSum <= 0) {
                continue;
            }
            $dt = \DateTimeImmutable::createFromFormat('Y-m-d', $dayKey);
            if ($dt) {
                $occupancyTrend[] = [
                    'label' => $dt->format('j M'),
                    'value' => round(($bookedSum / $capSum) * 100.0, 1),
                ];
            }
        }

        $seatUtilization = [];
        foreach ($seatUtilizationByTrip as $row) {
            $cap = $row['capacity'] > 0 ? $row['capacity'] : 1;
            $seatUtilization[] = [
                'trip'        => $row['trip'],
                'utilization' => round(($row['booked'] / $cap) * 100.0, 1),
            ];
        }

        // Cancellations summary
        $totalCancellations = 0;
        $revenueLost = 0.0;
        foreach ($bookingsTable as $row) {
            if ($row['status'] === 'cancelled') {
                $totalCancellations++;
                $revenueLost += $row['refundAmount'] > 0 ? $row['refundAmount'] : $row['price'];
            }
        }

        $cancellationRatePercent = $totalCount > 0 ? ($totalCancellations / $totalCount) * 100.0 : 0.0;
        $cancellationsSummary = [
            'totalCancellations'     => $totalCancellations,
            'cancellationRate'       => $cancellationRatePercent,
            'revenueLost'            => $revenueLost,
        ];

        // Profitability placeholders (phase 2)
        $profitabilityPlaceholders = [
            'profitPerTrip'   => [],
            'costVsRevenue'   => [],
        ];

        // ------------------------------------------------------------------
        // Payment method breakdown — operators routinely want to know
        // which gateways are pulling weight (and which they could turn
        // off). Grouped by both count and gross revenue.
        // ------------------------------------------------------------------
        $methodBuckets = [];
        foreach ($bookings as $b) {
            $method = (string) ($b['payment_method'] ?? $b['gateway'] ?? '');
            if ($method === '') $method = __('Unknown', 'yatra');
            $method = strtolower($method);
            $amount = isset($b['total_amount']) ? (float) $b['total_amount'] : 0.0;
            if (!isset($methodBuckets[$method])) {
                $methodBuckets[$method] = ['method' => $method, 'count' => 0, 'revenue' => 0.0];
            }
            $methodBuckets[$method]['count']++;
            $methodBuckets[$method]['revenue'] += $amount;
        }
        uasort($methodBuckets, static function (array $a, array $b): int {
            return $b['revenue'] <=> $a['revenue'];
        });
        $paymentMethodBreakdown = array_values($methodBuckets);

        // ------------------------------------------------------------------
        // Lead time: average days between booking creation and travel
        // date. Long lead times = better cash float; short = last-minute
        // travellers (different marketing levers). Skip rows without
        // both timestamps.
        // ------------------------------------------------------------------
        $leadTotal = 0;
        $leadCount = 0;
        $leadBuckets = [
            'same_day'  => 0,  // 0 days
            'within_week' => 0, // 1-7
            'within_month' => 0, // 8-30
            'within_quarter' => 0, // 31-90
            'beyond_quarter' => 0, // 91+
        ];
        foreach ($bookings as $b) {
            $createdTs = isset($b['created_at']) ? strtotime((string) $b['created_at']) : false;
            $travelTs  = isset($b['travel_date']) ? strtotime((string) $b['travel_date']) : false;
            if ($createdTs === false || $travelTs === false || $travelTs < $createdTs) {
                continue;
            }
            $days = (int) floor(($travelTs - $createdTs) / DAY_IN_SECONDS);
            $leadTotal += $days;
            $leadCount++;
            if ($days === 0) {
                $leadBuckets['same_day']++;
            } elseif ($days <= 7) {
                $leadBuckets['within_week']++;
            } elseif ($days <= 30) {
                $leadBuckets['within_month']++;
            } elseif ($days <= 90) {
                $leadBuckets['within_quarter']++;
            } else {
                $leadBuckets['beyond_quarter']++;
            }
        }
        $leadTime = [
            'averageDays' => $leadCount > 0 ? round($leadTotal / $leadCount, 1) : 0.0,
            'sampleSize'  => $leadCount,
            'buckets'     => [
                ['label' => __('Same day', 'yatra'),         'value' => $leadBuckets['same_day'],         'color' => '#ef4444'],
                ['label' => __('Within a week', 'yatra'),    'value' => $leadBuckets['within_week'],      'color' => '#f59e0b'],
                ['label' => __('Within a month', 'yatra'),   'value' => $leadBuckets['within_month'],     'color' => '#3b82f6'],
                ['label' => __('Within a quarter', 'yatra'), 'value' => $leadBuckets['within_quarter'],   'color' => '#10b981'],
                ['label' => __('More than a quarter', 'yatra'), 'value' => $leadBuckets['beyond_quarter'], 'color' => '#8b5cf6'],
            ],
        ];

        // ------------------------------------------------------------------
        // Refunds summary — distinct from cancellations because a refund
        // requires a payment to have happened first. We aggregate from
        // bookings where refund_amount > 0 OR status = refunded.
        // ------------------------------------------------------------------
        $refundsCount = 0;
        $refundsTotal = 0.0;
        $refundsByMethod = [];
        foreach ($bookings as $b) {
            $refundAmt = isset($b['refund_amount']) ? (float) $b['refund_amount'] : 0.0;
            $status    = strtolower((string) ($b['status'] ?? ''));
            $isRefund  = $refundAmt > 0 || $status === 'refunded';
            if (!$isRefund) continue;
            $refundsCount++;
            $refundsTotal += $refundAmt > 0 ? $refundAmt : (float) ($b['total_amount'] ?? 0);
            $method = strtolower((string) ($b['payment_method'] ?? $b['gateway'] ?? __('Unknown', 'yatra')));
            if (!isset($refundsByMethod[$method])) {
                $refundsByMethod[$method] = ['method' => $method, 'count' => 0, 'amount' => 0.0];
            }
            $refundsByMethod[$method]['count']++;
            $refundsByMethod[$method]['amount'] += $refundAmt > 0 ? $refundAmt : (float) ($b['total_amount'] ?? 0);
        }
        $refundsSummary = [
            'count'         => $refundsCount,
            'total'         => $refundsTotal,
            'refundRate'    => $totalBookings > 0 ? ($refundsCount / $totalBookings) * 100.0 : 0.0,
            'avgRefund'     => $refundsCount > 0 ? $refundsTotal / $refundsCount : 0.0,
            'byMethod'      => array_values($refundsByMethod),
        ];

        // ------------------------------------------------------------------
        // Top destinations — group bookings by destination(s) so operators
        // can see geographic concentration. A trip can have multiple
        // destinations; we count each occurrence (a 2-destination booking
        // contributes 1 to each). The first/primary destination is what
        // most operators expect to see ranked.
        // ------------------------------------------------------------------
        $destinationBuckets = [];
        foreach ($bookings as $b) {
            $destinations = $b['trip']['destinations'] ?? ($b['destinations'] ?? []);
            if (!is_array($destinations) || empty($destinations)) {
                continue;
            }
            $primary = $destinations[0];
            $name = is_array($primary) ? ($primary['name'] ?? '') : (string) $primary;
            if ($name === '') continue;
            $amount = isset($b['total_amount']) ? (float) $b['total_amount'] : 0.0;
            if (!isset($destinationBuckets[$name])) {
                $destinationBuckets[$name] = ['label' => $name, 'value' => 0, 'revenue' => 0.0];
            }
            $destinationBuckets[$name]['value']++;
            $destinationBuckets[$name]['revenue'] += $amount;
        }
        uasort($destinationBuckets, static function (array $a, array $b): int {
            return $b['value'] <=> $a['value'];
        });
        $topDestinations = array_slice(array_values($destinationBuckets), 0, 8);

        return new WP_REST_Response([
            'success' => true,
            'data'    => [
                'date_range'         => [
                    'from'      => $dateFrom,
                    'to'        => $dateTo,
                    'prev_from' => $prevFrom,
                    'prev_to'   => $prevTo,
                ],
                'revenue_stats'      => $revenueStats,
                'revenue_trend'      => $revenueTrend,
                'booking_stats'      => $bookingStats,
                'booking_trend'      => $bookingTrend,
                'status_trend'       => $statusTrend,
                'trip_performance'   => $tripPerformance,
                'payment_status'     => $paymentStatus,
                'operational_stats'  => $operationalStats,
                'customer_analytics' => $customerAnalytics,
                // Extended datasets
                'revenue_by_trip'    => $revenueByTripRows,
                'bookings_table'     => $bookingsTable,
                'traveler_segments'  => $travelerSegments,
                'departures_table'   => $departuresTable,
                'occupancy_trend'    => $occupancyTrend,
                'seat_utilization'   => $seatUtilization,
                'cancellations'      => $cancellationsSummary,
                'profitability'      => $profitabilityPlaceholders,
                // New analytics blocks (3.0.5+)
                'payment_methods'    => $paymentMethodBreakdown,
                'lead_time'          => $leadTime,
                'refunds'            => $refundsSummary,
                'top_destinations'   => $topDestinations,
            ],
        ]);
    }

    /**
     * Helper to call an internal REST endpoint and return decoded data
     * in array form. This keeps all reporting logic in one place while
     * reusing existing controllers.
     *
     * @param string $method
     * @param string $route
     * @param array<string,mixed> $params
     * @return mixed
     */
    private function request(string $method, string $route, array $params = [])
    {
        $req = new \WP_REST_Request($method, $route);
        foreach ($params as $key => $value) {
            $req->set_param($key, $value);
        }
        $response = rest_do_request($req);
        if ($response instanceof \WP_REST_Response) {
            return $response->get_data();
        }
        return null;
    }
}
