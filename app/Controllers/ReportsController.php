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

        $revenueStats = [
            'total'    => $totalRevenue,
            'bookings' => $totalBookings,
            'average'  => $averageBooking,
            'previous' => 0.0,
            'change'   => 0.0,
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
        // the selected range (e.g. 1..7 when filtering 7 days).
        $byDayCount = [];
        $byDayRevenue = [];

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
            }
            $byDayCount[$dayKey]++;
            $byDayRevenue[$dayKey] += $amount;
        }

        $totalCount = array_sum($statusCounts);
        $cancelled = $statusCounts['cancelled'];
        $cancellationRate = $totalCount > 0 ? ($cancelled / $totalCount) * 100.0 : 0.0;

        // Build a continuous list of DAYS across the selected range so that
        // the charts always reflect the full date window (including days
        // with zero bookings), rather than only the days that have data.
        $bookingTrend = [];
        $revenueTrend = [];

        if ($fromTs !== null && $toTs !== null && $fromTs <= $toTs) {
            $day = $fromTs;

            while ($day <= $toTs) {
                $key = gmdate('Y-m-d', $day);
                $count   = $byDayCount[$key] ?? 0;
                $revenue = $byDayRevenue[$key] ?? 0.0;

                $dt = \DateTimeImmutable::createFromFormat('Y-m-d', $key);
                if ($dt) {
                    // Label as "1 Nov", "2 Nov" etc. You can tweak format if needed.
                    $label = $dt->format('j M');
                    $bookingTrend[] = [
                        'label' => $label,
                        'value' => $count,
                    ];
                    $revenueTrend[] = [
                        'label' => $label,
                        'value' => $revenue,
                    ];
                }

                // increment by one day
                $day = strtotime('+1 day', $day);
            }
        }

        $bookingStats = [
            'total'             => $totalCount,
            'confirmed'         => $statusCounts['confirmed'],
            'pending'           => $statusCounts['pending'],
            'cancelled'         => $statusCounts['cancelled'],
            'completed'         => $statusCounts['completed'],
            'cancellationRate'  => $cancellationRate,
            'conversionRate'    => 0.0,
            'averageBookingValue' => $averageBooking,
            'trend'             => $bookingTrend,
        ];

        // ------------------------------------------------------------------
        // Trip performance (group by trip title)
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

        arsort($trips);
        $palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        $tripPerformance = [];
        $i = 0;
        foreach ($trips as $label => $stats) {
            if ($i >= 6) break;
            $tripPerformance[] = [
                'label'     => $label,
                'value'     => $stats['count'],
                'revenue'   => $stats['revenue'],
                'occupancy' => 0,
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

        return new WP_REST_Response([
            'success' => true,
            'data'    => [
                'revenue_stats'      => $revenueStats,
                'revenue_trend'      => $revenueTrend,
                'booking_stats'      => $bookingStats,
                'booking_trend'      => $bookingTrend,
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
