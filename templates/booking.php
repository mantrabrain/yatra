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
if (empty($booking) || (!is_object($booking))) {
    $booking = (object) [
        'error' => 'no_session',
    ];
}

if (!empty($booking->error)) {
    get_header();
    ?>
    <style>
        .yatra-error-page {
            min-height: 70vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        .yatra-error-card {
            max-width: 480px;
            width: 100%;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            padding: 48px 40px;
            text-align: center;
        }
        .yatra-error-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .yatra-error-icon svg {
            width: 40px;
            height: 40px;
            color: #d97706;
        }
        .yatra-error-icon.error {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        }
        .yatra-error-icon.error svg {
            color: #dc2626;
        }
        .yatra-error-title {
            font-size: 26px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 12px;
            line-height: 1.3;
        }
        .yatra-error-message {
            font-size: 15px;
            color: #64748b;
            margin: 0 0 32px;
            line-height: 1.6;
        }
        .yatra-error-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .yatra-error-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 28px;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        .yatra-error-btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: #ffffff;
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
        }
        .yatra-error-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.5);
            color: #ffffff;
        }
        .yatra-error-btn-secondary {
            background: #f1f5f9;
            color: #475569;
        }
        .yatra-error-btn-secondary:hover {
            background: #e2e8f0;
            color: #334155;
        }
        .yatra-error-divider {
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 24px 0;
            color: #94a3b8;
            font-size: 13px;
        }
        .yatra-error-divider::before,
        .yatra-error-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #e2e8f0;
        }
    </style>
    <div class="yatra-error-page">
        <div class="yatra-error-card">
            <?php if ($booking->error === 'no_session') : ?>
                <div class="yatra-error-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                </div>
                <h1 class="yatra-error-title"><?php esc_html_e('No Trip Selected', 'yatra'); ?></h1>
                <p class="yatra-error-message">
                    <?php esc_html_e('It looks like you haven\'t selected a trip yet. Browse our amazing destinations and find your perfect adventure!', 'yatra'); ?>
                </p>
            <?php else : ?>
                <div class="yatra-error-icon error">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <h1 class="yatra-error-title"><?php esc_html_e('Trip Not Available', 'yatra'); ?></h1>
                <p class="yatra-error-message">
                    <?php esc_html_e('Sorry, the trip you\'re looking for is no longer available. Don\'t worry, we have plenty of other exciting adventures waiting for you!', 'yatra'); ?>
                </p>
            <?php endif; ?>
            <div class="yatra-error-actions">
                <a href="<?php echo esc_url(home_url('/trip/')); ?>" class="yatra-error-btn yatra-error-btn-primary">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <?php esc_html_e('Explore Trips', 'yatra'); ?>
                </a>
                <div class="yatra-error-divider"><?php esc_html_e('or', 'yatra'); ?></div>
                <a href="<?php echo esc_url(home_url()); ?>" class="yatra-error-btn yatra-error-btn-secondary">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    <?php esc_html_e('Back to Home', 'yatra'); ?>
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
