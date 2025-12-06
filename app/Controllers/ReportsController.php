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
            $title = $b['trip_title'] ?? ($b['trip']['title'] ?? __('(Untitled Trip)', 'Untitled Trip'));
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
            'paid'    => ['label' => __('Paid', 'Paid'),    'color' => '#10b981'],
            'pending' => ['label' => __('Pending', 'Pending'), 'color' => '#f59e0b'],
            'refunded'=> ['label' => __('Refunded', 'Refunded'), 'color' => '#ef4444'],
            'partial' => ['label' => __('Partial', 'Partial'), 'color' => '#8b5cf6'],
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
                    'trip'     => $d['trip']['title'] ?? ($d['trip_title'] ?? __('Unknown Trip', 'Unknown Trip')),
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
                $email = __('Unknown', 'Unknown');
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
            ['label' => __('First-time', 'First-time'),       'value' => $firstTime,    'color' => '#3b82f6'],
            ['label' => __('Returning (2-3)', 'Returning (2-3)'), 'value' => $returning23, 'color' => '#10b981'],
            ['label' => __('Loyal (4+)', 'Loyal (4+)'),       'value' => $loyal4,       'color' => '#f59e0b'],
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
