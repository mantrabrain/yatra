<?php
/**
 * Booking Page Template
 * 
 * Data is prepared by AppServiceProvider::prepareBookingData()
 * Template only handles presentation - no database queries
 * 
 * @package Yatra
 * @global object $booking Booking data object (set by AppServiceProvider)
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Access global $booking object (set by controller)
global $booking;

// Handle error states
if (!empty($booking->error)) {
    get_header();
    ?>
    <div class="yatra-booking-page">
        <div class="yatra-booking-container">
            <div class="yatra-booking-error" style="max-width: 600px; margin: 80px auto; padding: 40px; text-align: center; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <svg width="64" height="64" fill="none" stroke="#ef4444" viewBox="0 0 24 24" style="margin-bottom: 20px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <?php if ($booking->error === 'no_session') : ?>
                    <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 12px;">
                        <?php esc_html_e('No Trip Selected', 'yatra'); ?>
                    </h1>
                    <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px;">
                        <?php esc_html_e('Please select a trip first before proceeding to checkout.', 'yatra'); ?>
                    </p>
                <?php else : ?>
                    <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 12px;">
                        <?php esc_html_e('Trip Not Available', 'yatra'); ?>
                    </h1>
                    <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px;">
                        <?php esc_html_e('The selected trip is no longer available. Please choose another trip.', 'yatra'); ?>
                    </p>
                <?php endif; ?>
                <a href="<?php echo esc_url(home_url('/trip/')); ?>" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <?php esc_html_e('Browse Trips', 'yatra'); ?>
                </a>
            </div>
        </div>
    </div>
    <?php
    get_footer();
    exit;
}

// Extract data from booking object for easier access in template
$trip = $booking->trip;
$travel_date = $booking->travel_date;
$total_travelers = $booking->travelers;
$deposit_required = $booking->deposit_required;
$deposit_percentage = $booking->deposit_percentage;
$partial_payment = $booking->partial_payment;
$partial_payment_percentage = $booking->partial_payment_percentage;
$enabled_gateways = $booking->enabled_gateways;

get_header();

// Include the shared booking content partial
include YATRA_PLUGIN_PATH . 'templates/partials/booking-content.php';

get_footer();
