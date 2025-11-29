<?php
/**
 * Booking Content Partial
 * 
 * Main booking form and sidebar content - used by both:
 * - booking.php (with header/footer)
 * - shortcode (without header/footer)
 * 
 * @package Yatra
 * 
 * Expected variables from parent:
 * - $booking (global object)
 * - $trip
 * - $travel_date
 * - $total_travelers
 * - $deposit_required
 * - $deposit_percentage
 * - $partial_payment
 * - $partial_payment_percentage
 * - $enabled_gateways
 */

if (!defined('ABSPATH')) {
    exit;
}

// Prepare variables for form fields partial
$trip_id = $trip->id;
$trip_slug = $trip->slug ?? '';

// Check if login is required
$require_login = \Yatra\Services\SettingsService::get('require_login', false);
$allow_guest_checkout = \Yatra\Services\SettingsService::get('allow_guest_checkout', true);
$needs_authentication = !is_user_logged_in() && ($require_login || !$allow_guest_checkout);
?>

<div class="yatra-booking-page">
    <div class="yatra-booking-container">
        <div class="yatra-booking-layout">
            <!-- Left Side: Auth Form or Booking Form -->
            <div class="yatra-booking-main">
                <?php if ($needs_authentication) : ?>
                    <!-- Show Login/Registration Form -->
                    <div class="yatra-booking-header">
                        <h1><?php esc_html_e('Login Required', 'yatra'); ?></h1>
                        <p class="yatra-booking-subtitle"><?php esc_html_e('Please login or create an account to continue with your booking', 'yatra'); ?></p>
                    </div>

                    <?php 
                    // Include the authentication form partial
                    include YATRA_PLUGIN_PATH . 'templates/partials/booking-auth.php'; 
                    ?>
                <?php else : ?>
                    <!-- Show Booking Form -->
                    <div class="yatra-booking-header">
                        <h1><?php esc_html_e('Complete Your Booking', 'yatra'); ?></h1>
                        <p class="yatra-booking-subtitle"><?php esc_html_e('Please fill in your details to complete the booking', 'yatra'); ?></p>
                    </div>

                    <!-- Booking Form -->
                    <form class="yatra-booking-form" id="yatra-booking-form">
                        <?php 
                        // Include shared booking form fields
                        include YATRA_PLUGIN_PATH . 'templates/partials/booking-form-fields.php'; 
                        ?>

                    <!-- Submit Button -->
                    <div class="yatra-booking-actions">
                        <button type="submit" class="yatra-booking-pay-btn" id="yatra-submit-booking">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            <span id="pay-button-text"><?php esc_html_e('Complete Booking', 'yatra'); ?></span>
                            <span id="pay-amount"><?php echo esc_html(yatra_format_price($trip->price * $total_travelers)); ?></span>
                        </button>
                        <a href="<?php echo esc_url(home_url('/trip/' . $trip->slug)); ?>" class="yatra-booking-cancel-btn">
                            <?php esc_html_e('Cancel', 'yatra'); ?>
                        </a>
                    </div>
                    
                    <input type="hidden" name="trip_price" value="<?php echo esc_attr($trip->price); ?>">
                    <input type="hidden" name="currency" value="<?php echo esc_attr($trip->currency); ?>">
                    <?php wp_nonce_field('yatra_booking_nonce', 'yatra_booking_nonce'); ?>
                </form>
                <?php endif; ?>
            </div>

            <!-- Right Side: Booking Summary -->
            <div class="yatra-booking-sidebar">
                <div class="yatra-booking-summary">
                    <h3><?php esc_html_e('Booking Summary', 'yatra'); ?></h3>
                    
                    <!-- Travel Details -->
                    <div class="yatra-summary-travel-details">
                        <div class="yatra-summary-form-group">
                            <label for="travel-date"><?php esc_html_e('Travel Date', 'yatra'); ?> <span class="required">*</span></label>
                            <input type="date" id="travel-date" name="travel_date" form="yatra-booking-form" required value="<?php echo esc_attr($travel_date); ?>">
                        </div>
                        
                        <div class="yatra-summary-form-group">
                            <label for="number-of-travelers"><?php esc_html_e('Number of Travelers', 'yatra'); ?></label>
                            <div class="yatra-traveler-selector">
                                <button type="button" class="yatra-quantity-btn minus" data-field="travelers">-</button>
                                <input type="number" id="number-of-travelers" name="number_of_travelers" value="<?php echo esc_attr($total_travelers); ?>" min="<?php echo esc_attr($trip->min_travelers ?? 1); ?>" max="<?php echo esc_attr($trip->max_travelers ?? 20); ?>" readonly form="yatra-booking-form">
                                <button type="button" class="yatra-quantity-btn plus" data-field="travelers">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Trip Info -->
                    <div class="yatra-summary-trip">
                        <div class="yatra-summary-image">
                            <img src="<?php echo esc_url($trip->featured_image); ?>" alt="<?php echo esc_attr($trip->title); ?>">
                        </div>
                        <div class="yatra-summary-details">
                            <h4><?php echo esc_html($trip->title); ?></h4>
                            <div class="yatra-summary-meta">
                                <?php if (!empty($trip->duration_days) && $trip->duration_days > 0) : ?>
                                <span><?php echo esc_html($trip->duration_days); ?> <?php esc_html_e('Days', 'yatra'); ?></span>
                                <?php endif; ?>
                                <?php if (!empty($trip->difficulty_level)) : ?>
                                <span>•</span>
                                <span><?php echo esc_html(ucfirst($trip->difficulty_level)); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <!-- Price Breakdown -->
                    <div class="yatra-summary-pricing">
                        <div class="yatra-price-row">
                            <span><?php esc_html_e('Price per person', 'yatra'); ?></span>
                            <span data-price="<?php echo esc_attr($trip->price); ?>"><?php echo esc_html(yatra_format_price($trip->price)); ?></span>
                        </div>
                        <div class="yatra-price-row">
                            <span><?php esc_html_e('Number of travelers', 'yatra'); ?></span>
                            <span id="summary-travelers"><?php echo esc_html($total_travelers); ?></span>
                        </div>
                        
                        <?php if ($deposit_required) : ?>
                        <div class="yatra-price-row yatra-price-deposit" style="display: none;">
                            <span><?php printf(esc_html__('Deposit (%d%%)', 'yatra'), $deposit_percentage); ?></span>
                            <span id="summary-deposit"><?php echo esc_html(yatra_format_price(($trip->price * $total_travelers) * ($deposit_percentage / 100))); ?></span>
                        </div>
                        <?php endif; ?>
                        
                        <div class="yatra-price-row yatra-price-total">
                            <span><strong><?php esc_html_e('Total Amount', 'yatra'); ?></strong></span>
                            <span id="summary-total"><strong><?php echo esc_html(yatra_format_price($trip->price * $total_travelers)); ?></strong></span>
                        </div>
                        
                        <div class="yatra-price-row yatra-price-due" style="display: none;">
                            <span><?php esc_html_e('Due Now', 'yatra'); ?></span>
                            <span id="summary-due"><strong><?php echo esc_html(yatra_format_price($trip->price * $total_travelers)); ?></strong></span>
                        </div>
                    </div>

                    <!-- Cancellation & Refund Policy -->
                    <?php 
                    $cancellation_policy = $booking->cancellation_policy ?? 'full_refund';
                    $cancellation_days = $booking->cancellation_days ?? 7;
                    $refund_policy = $booking->refund_policy ?? '';
                    
                    $policy_labels = [
                        'full_refund' => __('Full refund available', 'yatra'),
                        'partial_refund' => __('Partial refund available', 'yatra'),
                        'no_refund' => __('No refund', 'yatra'),
                        'flexible' => __('Flexible cancellation', 'yatra'),
                    ];
                    $policy_label = $policy_labels[$cancellation_policy] ?? __('Standard policy', 'yatra');
                    ?>
                    <div class="yatra-summary-info yatra-cancellation-policy">
                        <h4><?php esc_html_e('Cancellation Policy', 'yatra'); ?></h4>
                        <ul>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 6v6l4 2"></path>
                                </svg>
                                <?php 
                                printf(
                                    /* translators: %d: number of days */
                                    esc_html__('Free cancellation up to %d days before departure', 'yatra'), 
                                    (int) $cancellation_days
                                ); 
                                ?>
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <?php echo esc_html($policy_label); ?>
                            </li>
                            <?php if (!empty($refund_policy)) : ?>
                            <li class="yatra-refund-details">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4"></path>
                                    <path d="M12 8h.01"></path>
                                </svg>
                                <?php echo esc_html($refund_policy); ?>
                            </li>
                            <?php endif; ?>
                        </ul>
                    </div>
                    
                    <!-- Booking Assurance -->
                    <div class="yatra-summary-info">
                        <h4><?php esc_html_e('Booking Assurance', 'yatra'); ?></h4>
                        <ul>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <?php esc_html_e('Instant confirmation', 'yatra'); ?>
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <?php esc_html_e('24/7 customer support', 'yatra'); ?>
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                    <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                                <?php esc_html_e('Secure payment processing', 'yatra'); ?>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Selected Gateway Info -->
                    <div class="yatra-gateway-info" id="yatra-gateway-info" style="display: none;">
                        <h4><?php esc_html_e('Payment Information', 'yatra'); ?></h4>
                        <div id="yatra-gateway-details"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

