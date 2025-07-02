<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Report service for generating reports and analytics
 */
class ReportService
{
    /**
     * Get dashboard statistics
     */
    public function getDashboardStats(): array
    {
        global $wpdb;

        $stats = [];

        // Total bookings
        $stats['total_bookings'] = (int) $wpdb->get_var("
            SELECT COUNT(*) FROM {$wpdb->prefix}yatra_bookings
        ");

        // Total revenue
        $stats['total_revenue'] = (float) $wpdb->get_var("
            SELECT SUM(total_amount) FROM {$wpdb->prefix}yatra_bookings 
            WHERE booking_status = 'confirmed'
        ");

        // Pending bookings
        $stats['pending_bookings'] = (int) $wpdb->get_var("
            SELECT COUNT(*) FROM {$wpdb->prefix}yatra_bookings 
            WHERE booking_status = 'pending'
        ");

        // Total trips
        $stats['total_trips'] = (int) $wpdb->get_var("
            SELECT COUNT(*) FROM {$wpdb->prefix}yatra_trips 
            WHERE status = 'active'
        ");

        // Recent bookings
        $stats['recent_bookings'] = $wpdb->get_results("
            SELECT b.*, t.title as trip_title, d.name as destination_name
            FROM {$wpdb->prefix}yatra_bookings b
            LEFT JOIN {$wpdb->prefix}yatra_trips t ON b.trip_id = t.id
            LEFT JOIN {$wpdb->prefix}yatra_destinations d ON t.destination_id = d.id
            ORDER BY b.booking_date DESC
            LIMIT 5
        ");

        // Monthly revenue
        $stats['monthly_revenue'] = $wpdb->get_results("
            SELECT 
                DATE_FORMAT(booking_date, '%Y-%m') as month,
                SUM(total_amount) as revenue,
                COUNT(*) as bookings
            FROM {$wpdb->prefix}yatra_bookings 
            WHERE booking_status = 'confirmed'
            AND booking_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
            ORDER BY month DESC
        ");

        return $stats;
    }

    /**
     * Get booking report
     */
    public function getBookingReport(array $filters = []): array
    {
        global $wpdb;

        $where = [];
        $params = [];

        // Date range filter
        if (!empty($filters['start_date'])) {
            $where[] = "b.booking_date >= %s";
            $params[] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $where[] = "b.booking_date <= %s";
            $params[] = $filters['end_date'];
        }

        // Status filter
        if (!empty($filters['status'])) {
            $where[] = "b.booking_status = %s";
            $params[] = $filters['status'];
        }

        // Trip filter
        if (!empty($filters['trip_id'])) {
            $where[] = "b.trip_id = %d";
            $params[] = (int) $filters['trip_id'];
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "
            SELECT 
                b.*,
                t.title as trip_title,
                d.name as destination_name,
                td.start_date as trip_start_date
            FROM {$wpdb->prefix}yatra_bookings b
            LEFT JOIN {$wpdb->prefix}yatra_trips t ON b.trip_id = t.id
            LEFT JOIN {$wpdb->prefix}yatra_destinations d ON t.destination_id = d.id
            LEFT JOIN {$wpdb->prefix}yatra_trip_dates td ON b.trip_date_id = td.id
            {$whereClause}
            ORDER BY b.booking_date DESC
        ";

        if (!empty($params)) {
            $results = $wpdb->get_results($wpdb->prepare($sql, ...$params));
        } else {
            $results = $wpdb->get_results($sql);
        }

        return $results ?: [];
    }

    /**
     * Get revenue report
     */
    public function getRevenueReport(array $filters = []): array
    {
        global $wpdb;

        $where = [];
        $params = [];

        // Date range filter
        if (!empty($filters['start_date'])) {
            $where[] = "b.booking_date >= %s";
            $params[] = $filters['start_date'];
        }

        if (!empty($filters['end_date'])) {
            $where[] = "b.booking_date <= %s";
            $params[] = $filters['end_date'];
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "
            SELECT 
                DATE_FORMAT(b.booking_date, '%Y-%m-%d') as date,
                SUM(b.total_amount) as revenue,
                COUNT(*) as bookings,
                AVG(b.total_amount) as avg_booking_value
            FROM {$wpdb->prefix}yatra_bookings b
            {$whereClause}
            AND b.booking_status = 'confirmed'
            GROUP BY DATE_FORMAT(b.booking_date, '%Y-%m-%d')
            ORDER BY date DESC
        ";

        if (!empty($params)) {
            $results = $wpdb->get_results($wpdb->prepare($sql, ...$params));
        } else {
            $results = $wpdb->get_results($sql);
        }

        return $results ?: [];
    }

    /**
     * Get popular trips report
     */
    public function getPopularTripsReport(int $limit = 10): array
    {
        global $wpdb;

        $sql = "
            SELECT 
                t.id,
                t.title,
                t.base_price,
                d.name as destination_name,
                COUNT(b.id) as total_bookings,
                SUM(b.total_amount) as total_revenue,
                AVG(b.total_amount) as avg_booking_value
            FROM {$wpdb->prefix}yatra_trips t
            LEFT JOIN {$wpdb->prefix}yatra_destinations d ON t.destination_id = d.id
            LEFT JOIN {$wpdb->prefix}yatra_bookings b ON t.id = b.trip_id
            WHERE t.status = 'active'
            GROUP BY t.id
            ORDER BY total_bookings DESC, total_revenue DESC
            LIMIT %d
        ";

        $results = $wpdb->get_results($wpdb->prepare($sql, $limit));
        return $results ?: [];
    }

    /**
     * Get destination performance report
     */
    public function getDestinationPerformanceReport(): array
    {
        global $wpdb;

        $sql = "
            SELECT 
                d.id,
                d.name,
                COUNT(t.id) as total_trips,
                COUNT(b.id) as total_bookings,
                SUM(b.total_amount) as total_revenue,
                AVG(b.total_amount) as avg_booking_value
            FROM {$wpdb->prefix}yatra_destinations d
            LEFT JOIN {$wpdb->prefix}yatra_trips t ON d.id = t.destination_id
            LEFT JOIN {$wpdb->prefix}yatra_bookings b ON t.id = b.trip_id
            WHERE d.status = 'active'
            GROUP BY d.id
            ORDER BY total_revenue DESC
        ";

        $results = $wpdb->get_results($sql);
        return $results ?: [];
    }
} 