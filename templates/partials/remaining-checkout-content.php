<?php
if (!defined('ABSPATH')) {
    exit;
}

$booking = $booking ?? ($GLOBALS['yatra_booking'] ?? null);

if (!$booking || empty($booking->has_session)) {
    echo '<div class="yatra-booking-error">' . esc_html__('No active booking session was found. Please initiate the remaining payment from your account page.', 'yatra') . '</div>';
    return;
}

if (empty($booking->is_remaining_payment)) {
    echo '<div class="yatra-booking-error">' . esc_html__('This page is only for remaining balance payments. Please use the regular booking form.', 'yatra') . '</div>';
    return;
}

if (empty($booking->remaining_amount) || $booking->remaining_amount <= 0) {
    echo '<div class="yatra-booking-error">' . esc_html__('This booking is already fully paid.', 'yatra') . '</div>';
    return;
}

$trip = $booking->trip ?? null;

if (!$trip) {
    echo '<div class="yatra-booking-error">' . esc_html__('Trip information is missing for this booking.', 'yatra') . '</div>';
    return;
}

$trip_id = $trip->id;
$trip_slug = $trip->slug ?? '';
$travel_date = $booking->travel_date;
$total_travelers = $booking->travelers;
$remaining_amount = $booking->remaining_amount;
$amount_paid = $booking->amount_paid ?? 0;
$total_amount = $booking->total_amount ?? ($remaining_amount + $amount_paid);
$enabled_gateways = $booking->enabled_gateways ?? [];
$booking_reference = $booking->booking_reference ?? '';
$existing_booking_id = $booking->existing_booking_id ?? 0;
$pricing_type = $booking->pricing_type ?? 'regular';
$price_types = $booking->price_types ?? [];
$traveler_counts = $booking->traveler_counts ?? [];
$is_remaining_payment = true;
?>

<div class="yatra-booking-layout">
    <div class="yatra-booking-main">
        <div class="yatra-booking-header">
            <h1><?php esc_html_e('Pay Remaining Balance', 'yatra'); ?></h1>
            <p class="yatra-booking-subtitle">
                <?php
                echo esc_html(
                    sprintf(
                        __('You are paying the remaining balance for Booking %s.', 'yatra'),
                        $booking_reference ? '#' . $booking_reference : __('(unknown)', 'yatra')
                    )
                );
                ?>
            </p>
            <div class="yatra-reference-badge">
                <span><?php esc_html_e('Booking Reference', 'yatra'); ?></span>
                <strong><?php echo esc_html($booking_reference ? '#' . $booking_reference : __('Not available', 'yatra')); ?></strong>
            </div>
            <div class="yatra-remaining-banner">
                <div>
                    <strong><?php esc_html_e('Amount Due Now', 'yatra'); ?>:</strong>
                    <span><?php echo esc_html(yatra_format_price((float) $remaining_amount, null, false)); ?></span>
                </div>
                <div>
                    <strong><?php esc_html_e('Amount Paid', 'yatra'); ?>:</strong>
                    <span><?php echo esc_html(yatra_format_price((float) $amount_paid, null, false)); ?></span>
                </div>
                <div>
                    <strong><?php esc_html_e('Total Cost', 'yatra'); ?>:</strong>
                    <span><?php echo esc_html(yatra_format_price((float) $total_amount, null, false)); ?></span>
                </div>
            </div>
            <div class="yatra-remaining-details">
                <div class="yatra-remaining-detail">
                    <span><?php esc_html_e('Trip', 'yatra'); ?></span>
                    <strong><?php echo esc_html($trip->title); ?></strong>
                </div>
                <div class="yatra-remaining-detail">
                    <span><?php esc_html_e('Travel Date', 'yatra'); ?></span>
                    <strong><?php echo esc_html(date_i18n(get_option('date_format'), strtotime($travel_date))); ?></strong>
                </div>
                <div class="yatra-remaining-detail">
                    <span><?php esc_html_e('Travelers', 'yatra'); ?></span>
                    <strong><?php echo esc_html($total_travelers); ?></strong>
                </div>
                <div class="yatra-remaining-detail">
                    <span><?php esc_html_e('Status', 'yatra'); ?></span>
                    <strong><?php esc_html_e('Partial Payment', 'yatra'); ?></strong>
                </div>
            </div>
        </div>

        <form
            class="yatra-booking-form"
            id="yatra-booking-form"
            data-payment-due="<?php echo esc_attr($remaining_amount); ?>"
            data-is-remaining-payment="yes"
        >
            <?php
            // Ensure the booking form partial knows we're in remaining-payment mode
            $existing_booking_id = $existing_booking_id;
            $booking_reference = $booking_reference;
            $remaining_amount = $remaining_amount;
            $amount_paid = $amount_paid;
            $total_amount = $total_amount;
            ?>
            <?php include YATRA_PLUGIN_PATH . 'templates/partials/booking-form-fields.php'; ?>

            <div class="yatra-booking-actions">
                <button type="submit" class="yatra-booking-pay-btn" id="yatra-submit-booking">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span id="pay-button-text"><?php esc_html_e('Pay Remaining Balance', 'yatra'); ?></span>
                    <span id="pay-amount"><?php echo esc_html(yatra_format_price((float) $remaining_amount, null, false)); ?></span>
                </button>
                <a href="<?php echo esc_url(home_url('/my-account?tab=bookings')); ?>" class="yatra-booking-cancel-btn">
                    <?php esc_html_e('Back to My Bookings', 'yatra'); ?>
                </a>
            </div>

            <input type="hidden" name="trip_price" value="<?php echo esc_attr($trip->price); ?>">
            <input type="hidden" name="currency" value="<?php echo esc_attr(\Yatra\Services\SettingsService::getCurrency()); ?>">
            <?php wp_nonce_field('yatra_booking_nonce', 'yatra_booking_nonce'); ?>
        </form>
    </div>

    <div class="yatra-booking-sidebar">
        <div class="yatra-booking-summary">
            <h3><?php esc_html_e('Booking Summary', 'yatra'); ?></h3>
            <ul class="yatra-summary-list">
                <li>
                    <span><?php esc_html_e('Trip', 'yatra'); ?>:</span>
                    <strong><?php echo esc_html($trip->title); ?></strong>
                </li>
                <li>
                    <span><?php esc_html_e('Travel Date', 'yatra'); ?>:</span>
                    <strong><?php echo esc_html(date_i18n(get_option('date_format'), strtotime($travel_date))); ?></strong>
                </li>
                <li>
                    <span><?php esc_html_e('Travelers', 'yatra'); ?>:</span>
                    <strong><?php echo esc_html($total_travelers); ?></strong>
                </li>
            </ul>

            <div class="yatra-price-summary">
                <div class="yatra-price-row">
                    <span><?php esc_html_e('Total Amount', 'yatra'); ?></span>
                    <strong><?php echo esc_html(yatra_format_price((float) $total_amount, null, false)); ?></strong>
                </div>
                <div class="yatra-price-row">
                    <span><?php esc_html_e('Paid', 'yatra'); ?></span>
                    <strong><?php echo esc_html(yatra_format_price((float) $amount_paid, null, false)); ?></strong>
                </div>
                <div class="yatra-price-row due">
                    <span><?php esc_html_e('Due Now', 'yatra'); ?></span>
                    <strong><?php echo esc_html(yatra_format_price((float) $remaining_amount, null, false)); ?></strong>
                </div>
            </div>

            <div class="yatra-summary-info">
                <h4><?php esc_html_e('Why pay now?', 'yatra'); ?></h4>
                <ul>
                    <li><?php esc_html_e('Secure your spot instantly', 'yatra'); ?></li>
                    <li><?php esc_html_e('Receive updated confirmation via email', 'yatra'); ?></li>
                    <li><?php esc_html_e('Access travel documents inside your account', 'yatra'); ?></li>
                </ul>
            </div>

        </div>
    </div>
</div>
