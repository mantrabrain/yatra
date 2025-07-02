<?php
/**
 * Admin Dashboard View
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get dashboard statistics
$total_trips = $this->getTotalTrips();
$total_bookings = $this->getTotalBookings();
$total_revenue = $this->getTotalRevenue();
$pending_bookings = $this->getPendingBookings();
?>

<div class="wrap">
    <h1><?php echo esc_html__('Yatra Dashboard', 'yatra'); ?></h1>
    
    <div class="yatra-dashboard-stats">
        <div class="yatra-stat-card">
            <div class="yatra-stat-icon">
                <span class="dashicons dashicons-palmtree"></span>
            </div>
            <div class="yatra-stat-content">
                <h3><?php echo esc_html($total_trips); ?></h3>
                <p><?php echo esc_html__('Total Trips', 'yatra'); ?></p>
            </div>
        </div>
        
        <div class="yatra-stat-card">
            <div class="yatra-stat-icon">
                <span class="dashicons dashicons-calendar-alt"></span>
            </div>
            <div class="yatra-stat-content">
                <h3><?php echo esc_html($total_bookings); ?></h3>
                <p><?php echo esc_html__('Total Bookings', 'yatra'); ?></p>
            </div>
        </div>
        
        <div class="yatra-stat-card">
            <div class="yatra-stat-icon">
                <span class="dashicons dashicons-money-alt"></span>
            </div>
            <div class="yatra-stat-content">
                <h3><?php echo esc_html(number_format($total_revenue, 2)); ?></h3>
                <p><?php echo esc_html__('Total Revenue', 'yatra'); ?></p>
            </div>
        </div>
        
        <div class="yatra-stat-card">
            <div class="yatra-stat-icon">
                <span class="dashicons dashicons-clock"></span>
            </div>
            <div class="yatra-stat-content">
                <h3><?php echo esc_html($pending_bookings); ?></h3>
                <p><?php echo esc_html__('Pending Bookings', 'yatra'); ?></p>
            </div>
        </div>
    </div>
    
    <div class="yatra-dashboard-content">
        <div class="yatra-dashboard-section">
            <h2><?php echo esc_html__('Recent Bookings', 'yatra'); ?></h2>
            <?php $this->displayRecentBookings(); ?>
        </div>
        
        <div class="yatra-dashboard-section">
            <h2><?php echo esc_html__('Popular Trips', 'yatra'); ?></h2>
            <?php $this->displayPopularTrips(); ?>
        </div>
    </div>
</div>

<style>
.yatra-dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.yatra-stat-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.yatra-stat-icon {
    margin-right: 15px;
}

.yatra-stat-icon .dashicons {
    font-size: 2.5em;
    color: #0073aa;
}

.yatra-stat-content h3 {
    margin: 0 0 5px 0;
    font-size: 2em;
    color: #333;
}

.yatra-stat-content p {
    margin: 0;
    color: #666;
    font-size: 0.9em;
}

.yatra-dashboard-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 30px;
}

.yatra-dashboard-section {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.yatra-dashboard-section h2 {
    margin-top: 0;
    border-bottom: 2px solid #0073aa;
    padding-bottom: 10px;
}

@media (max-width: 768px) {
    .yatra-dashboard-content {
        grid-template-columns: 1fr;
    }
}
</style>

<?php
// Helper methods for dashboard data
function getTotalTrips() {
    global $wpdb;
    return $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}yatra_trips WHERE status = 'active'") ?: 0;
}

function getTotalBookings() {
    global $wpdb;
    return $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}yatra_bookings") ?: 0;
}

function getTotalRevenue() {
    global $wpdb;
    return $wpdb->get_var("SELECT SUM(total_amount) FROM {$wpdb->prefix}yatra_bookings WHERE booking_status = 'confirmed'") ?: 0;
}

function getPendingBookings() {
    global $wpdb;
    return $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}yatra_bookings WHERE booking_status = 'pending'") ?: 0;
}

function displayRecentBookings() {
    global $wpdb;
    
    $bookings = $wpdb->get_results("
        SELECT b.*, t.title as trip_title 
        FROM {$wpdb->prefix}yatra_bookings b
        LEFT JOIN {$wpdb->prefix}yatra_trips t ON b.trip_id = t.id
        ORDER BY b.booking_date DESC 
        LIMIT 5
    ");
    
    if (empty($bookings)) {
        echo '<p>' . esc_html__('No recent bookings found.', 'yatra') . '</p>';
        return;
    }
    
    echo '<table class="wp-list-table widefat fixed striped">';
    echo '<thead><tr>';
    echo '<th>' . esc_html__('Booking #', 'yatra') . '</th>';
    echo '<th>' . esc_html__('Trip', 'yatra') . '</th>';
    echo '<th>' . esc_html__('Status', 'yatra') . '</th>';
    echo '<th>' . esc_html__('Amount', 'yatra') . '</th>';
    echo '<th>' . esc_html__('Date', 'yatra') . '</th>';
    echo '</tr></thead>';
    echo '<tbody>';
    
    foreach ($bookings as $booking) {
        echo '<tr>';
        echo '<td>' . esc_html($booking->booking_number) . '</td>';
        echo '<td>' . esc_html($booking->trip_title) . '</td>';
        echo '<td>' . esc_html(ucfirst($booking->booking_status)) . '</td>';
        echo '<td>' . esc_html(number_format($booking->total_amount, 2)) . '</td>';
        echo '<td>' . esc_html(date('M j, Y', strtotime($booking->booking_date))) . '</td>';
        echo '</tr>';
    }
    
    echo '</tbody></table>';
}

function displayPopularTrips() {
    global $wpdb;
    
    $trips = $wpdb->get_results("
        SELECT t.*, COUNT(b.id) as booking_count
        FROM {$wpdb->prefix}yatra_trips t
        LEFT JOIN {$wpdb->prefix}yatra_bookings b ON t.id = b.trip_id
        WHERE t.status = 'active'
        GROUP BY t.id
        ORDER BY booking_count DESC
        LIMIT 5
    ");
    
    if (empty($trips)) {
        echo '<p>' . esc_html__('No trips found.', 'yatra') . '</p>';
        return;
    }
    
    echo '<table class="wp-list-table widefat fixed striped">';
    echo '<thead><tr>';
    echo '<th>' . esc_html__('Trip', 'yatra') . '</th>';
    echo '<th>' . esc_html__('Bookings', 'yatra') . '</th>';
    echo '<th>' . esc_html__('Price', 'yatra') . '</th>';
    echo '<th>' . esc_html__('Rating', 'yatra') . '</th>';
    echo '</tr></thead>';
    echo '<tbody>';
    
    foreach ($trips as $trip) {
        echo '<tr>';
        echo '<td>' . esc_html($trip->title) . '</td>';
        echo '<td>' . esc_html($trip->booking_count) . '</td>';
        echo '<td>' . esc_html(number_format($trip->base_price, 2)) . '</td>';
        echo '<td>' . esc_html(number_format($trip->average_rating, 1)) . ' / 5</td>';
        echo '</tr>';
    }
    
    echo '</tbody></table>';
}
?> 