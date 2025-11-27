<?php
/**
 * Booking Page Template
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get trip slug from query var
global $wp_query, $wpdb;
$trip_slug = $wp_query->get('yatra_booking_trip_slug');

// Get booking parameters from URL
$booking_date = isset($_GET['date']) ? sanitize_text_field($_GET['date']) : '';
$booking_adults = isset($_GET['adults']) ? absint($_GET['adults']) : 1;
$booking_children = isset($_GET['children']) ? absint($_GET['children']) : 0;
$booking_price = isset($_GET['price']) ? floatval($_GET['price']) : 0;
$total_travelers = $booking_adults + $booking_children;
if ($total_travelers < 1) {
    $total_travelers = 1;
}

// Fetch trip data from database
$trip_data = null;
if (!empty($trip_slug)) {
    $trips_table = $wpdb->prefix . 'yatra_trips';
    $trip_data = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$trips_table} WHERE slug = %s AND status = 'publish' LIMIT 1",
        $trip_slug
    ));
}

// Fallback if no trip found
if (!$trip_data) {
    $trip_data = (object) [
        'id' => 0,
        'title' => __('Trip Not Found', 'yatra'),
        'slug' => '',
        'featured_image' => '',
        'duration_days' => 0,
        'duration_nights' => 0,
        'difficulty_level' => '',
        'min_travelers' => 1,
        'max_travelers' => 10,
        'original_price' => 0,
        'sale_price' => 0,
        'currency' => 'USD',
        'starting_location' => '',
        'ending_location' => '',
    ];
}

// Get settings
$settings = get_option('yatra_settings', []);
$deposit_required = !empty($settings['deposit_required']);
$deposit_percentage = isset($settings['deposit_percentage']) ? (int)$settings['deposit_percentage'] : 20;
$partial_payment = !empty($settings['partial_payment']);
$partial_payment_percentage = isset($settings['partial_payment_percentage']) ? (int)$settings['partial_payment_percentage'] : 30;

// Get enabled payment gateways
$gateway_configs = isset($settings['gateway_configs']) ? $settings['gateway_configs'] : [];
$gateway_order = isset($settings['gateway_order']) ? $settings['gateway_order'] : [];

// Get gateway definitions from registry
$enabled_gateways = [];
if (class_exists('Yatra\PaymentGateways\PaymentGatewayRegistry')) {
    $registry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
    $all_gateways = $registry->getAll();
    
    // Sort by gateway_order if available
    if (!empty($gateway_order)) {
        $sorted_gateways = [];
        foreach ($gateway_order as $gateway_id) {
            if (isset($all_gateways[$gateway_id])) {
                $sorted_gateways[$gateway_id] = $all_gateways[$gateway_id];
            }
        }
        // Add any remaining gateways not in the order
        foreach ($all_gateways as $gateway_id => $gateway) {
            if (!isset($sorted_gateways[$gateway_id])) {
                $sorted_gateways[$gateway_id] = $gateway;
            }
        }
        $all_gateways = $sorted_gateways;
    }
    
    foreach ($all_gateways as $gateway_id => $gateway) {
        $config = isset($gateway_configs[$gateway_id]) ? $gateway_configs[$gateway_id] : [];
        if (!empty($config['enabled'])) {
            $enabled_gateways[$gateway_id] = [
                'id' => $gateway_id,
                'title' => $gateway->getTitle(),
                'description' => $gateway->getDescription(),
                'icon' => $gateway->getIcon(),
                'is_offline' => $gateway->isOffline(),
            ];
        }
    }
}

// Fallback to default gateways if none enabled
if (empty($enabled_gateways)) {
    $enabled_gateways = [
        'pay_later' => [
            'id' => 'pay_later',
            'title' => __('Book Now, Pay Later', 'yatra'),
            'description' => __('Reserve now and pay before the trip', 'yatra'),
            'icon' => '',
            'is_offline' => true,
        ],
    ];
}

// Calculate price
$trip_price = !empty($trip_data->sale_price) ? (float)$trip_data->sale_price : (float)$trip_data->original_price;
$currency = !empty($trip_data->currency) ? $trip_data->currency : 'USD';
$trip_image = !empty($trip_data->featured_image) ? $trip_data->featured_image : 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80';
$min_travelers = !empty($trip_data->min_travelers) ? (int)$trip_data->min_travelers : 1;
$max_travelers = !empty($trip_data->max_travelers) ? (int)$trip_data->max_travelers : 20;

// Helper functions are loaded from includes/helpers.php

get_header();
?>

<div class="yatra-booking-page">
    <div class="yatra-booking-container">
        <div class="yatra-booking-layout">
            <!-- Left Side: Booking Form -->
            <div class="yatra-booking-main">
                <div class="yatra-booking-header">
                    <h1>Complete Your Booking</h1>
                    <p class="yatra-booking-subtitle">Please fill in your details to complete the booking</p>
                </div>

                <!-- Booking Form -->
                <form class="yatra-booking-form" id="yatra-booking-form">
                    <!-- Primary Contact Information -->
                    <div class="yatra-booking-section">
                        <h2 class="yatra-section-title">Contact Information</h2>
                        
                        <div class="yatra-form-row">
                            <div class="yatra-form-group">
                                <label for="contact-email">Email Address <span class="required">*</span></label>
                                <input type="email" id="contact-email" name="contact_email" required>
                            </div>
                            
                            <div class="yatra-form-group">
                                <label for="contact-phone">Phone Number <span class="required">*</span></label>
                                <input type="tel" id="contact-phone" name="contact_phone" required>
                            </div>
                        </div>

                        <div class="yatra-form-group">
                            <label for="contact-country">Country <span class="required">*</span></label>
                            <select id="contact-country" name="contact_country" required>
                                <option value="">Select Country</option>
                                <option value="US">United States</option>
                                <option value="UK">United Kingdom</option>
                                <option value="CA">Canada</option>
                                <option value="AU">Australia</option>
                                <option value="NP">Nepal</option>
                                <option value="IN">India</option>
                            </select>
                        </div>
                    </div>

                    <!-- Traveler Information Section -->
                    <div class="yatra-booking-section">
                        <h2 class="yatra-section-title">Traveler Information</h2>
                        <p class="yatra-section-description">Please provide details for each traveler</p>
                        
                        <div id="yatra-travelers-container">
                            <!-- Traveler forms will be dynamically generated here -->
                        </div>
                    </div>

                    <!-- Payment Method Section -->
                    <?php if ($deposit_required || $partial_payment) : ?>
                    <div class="yatra-booking-section">
                        <h2 class="yatra-section-title"><?php esc_html_e('Payment Method', 'yatra'); ?></h2>
                        
                        <div class="yatra-payment-methods">
                            <label class="yatra-payment-option">
                                <input type="radio" name="payment_method" value="full" checked>
                                <span class="yatra-payment-label">
                                    <strong><?php esc_html_e('Pay in Full', 'yatra'); ?></strong>
                                    <span><?php esc_html_e('Pay the total amount now', 'yatra'); ?></span>
                                </span>
                            </label>
                            
                            <?php if ($deposit_required) : ?>
                            <label class="yatra-payment-option">
                                <input type="radio" name="payment_method" value="deposit">
                                <span class="yatra-payment-label">
                                    <strong><?php esc_html_e('Pay Deposit', 'yatra'); ?></strong>
                                    <span><?php printf(esc_html__('Pay %d%% now, balance later', 'yatra'), $deposit_percentage); ?></span>
                                </span>
                            </label>
                            <?php endif; ?>
                            
                            <?php if ($partial_payment) : ?>
                            <label class="yatra-payment-option">
                                <input type="radio" name="payment_method" value="partial">
                                <span class="yatra-payment-label">
                                    <strong><?php esc_html_e('Partial Payment', 'yatra'); ?></strong>
                                    <span><?php printf(esc_html__('Pay %d%% now, rest before trip', 'yatra'), $partial_payment_percentage); ?></span>
                                </span>
                            </label>
                            <?php endif; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Payment Gateway Section -->
                    <div class="yatra-booking-section">
                        <h2 class="yatra-section-title"><?php esc_html_e('Select Payment Gateway', 'yatra'); ?></h2>
                        
                        <div class="yatra-payment-gateways">
                            <?php 
                            $first_gateway = true;
                            foreach ($enabled_gateways as $gateway_id => $gateway) : 
                            ?>
                            <label class="yatra-gateway-option<?php echo $gateway['is_offline'] ? ' yatra-gateway-offline' : ''; ?>">
                                <input type="radio" name="payment_gateway" value="<?php echo esc_attr($gateway_id); ?>" <?php checked($first_gateway); ?>>
                                <span class="yatra-gateway-icon">
                                    <?php if (!empty($gateway['icon'])) : ?>
                                        <img src="<?php echo esc_url($gateway['icon']); ?>" alt="<?php echo esc_attr($gateway['title']); ?>" width="32" height="32">
                                    <?php else : ?>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                            <line x1="1" y1="10" x2="23" y2="10"></line>
                                        </svg>
                                    <?php endif; ?>
                                </span>
                                <span class="yatra-gateway-label">
                                    <strong><?php echo esc_html($gateway['title']); ?></strong>
                                    <span><?php echo esc_html($gateway['description']); ?></span>
                                </span>
                                <?php if ($gateway['is_offline']) : ?>
                                    <span class="yatra-gateway-badge"><?php esc_html_e('No payment now', 'yatra'); ?></span>
                                <?php endif; ?>
                            </label>
                            <?php 
                            $first_gateway = false;
                            endforeach; 
                            ?>
                        </div>
                        
                        <?php if (count($enabled_gateways) === 0) : ?>
                        <p class="yatra-no-gateways-message">
                            <?php esc_html_e('No payment gateways are currently available. Please contact the administrator.', 'yatra'); ?>
                        </p>
                        <?php endif; ?>
                    </div>

                    <!-- Terms and Conditions -->
                    <div class="yatra-booking-section">
                        <label class="yatra-checkbox-label">
                            <input type="checkbox" name="terms" required>
                            <span>I agree to the <a href="#" target="_blank">Terms and Conditions</a> and <a href="#" target="_blank">Privacy Policy</a> <span class="required">*</span></span>
                        </label>
                    </div>

                    <!-- Special Requests -->
                    <div class="yatra-booking-section">
                        <div class="yatra-form-group">
                            <label for="special-requests">Special Requests or Notes</label>
                            <textarea id="special-requests" name="special_requests" rows="4" placeholder="Any dietary requirements, accessibility needs, or other special requests..."></textarea>
                        </div>
                    </div>

                    <!-- Terms and Conditions -->
                    <div class="yatra-booking-section">
                        <label class="yatra-checkbox-label">
                            <input type="checkbox" name="terms" required>
                            <span>I agree to the <a href="#" target="_blank">Terms and Conditions</a> and <a href="#" target="_blank">Privacy Policy</a> <span class="required">*</span></span>
                        </label>
                    </div>

                    <!-- Submit Button -->
                    <div class="yatra-booking-actions">
                        <button type="submit" class="yatra-booking-pay-btn" id="yatra-submit-booking">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            <span id="pay-button-text"><?php esc_html_e('Complete Booking', 'yatra'); ?></span>
                            <span id="pay-amount"><?php echo yatra_format_price($trip_price * $total_travelers, $currency); ?></span>
                        </button>
                        <?php if (!empty($trip_data->slug)) : ?>
                        <a href="<?php echo esc_url(home_url('/trip/' . $trip_data->slug)); ?>" class="yatra-booking-cancel-btn">
                            <?php esc_html_e('Cancel', 'yatra'); ?>
                        </a>
                        <?php endif; ?>
                    </div>
                    
                    <input type="hidden" name="trip_id" value="<?php echo esc_attr($trip_data->id); ?>">
                    <input type="hidden" name="trip_price" value="<?php echo esc_attr($trip_price); ?>">
                    <input type="hidden" name="currency" value="<?php echo esc_attr($currency); ?>">
                    <?php wp_nonce_field('yatra_booking_nonce', 'yatra_booking_nonce'); ?>
                </form>
            </div>

            <!-- Right Side: Booking Summary -->
            <div class="yatra-booking-sidebar">
                <div class="yatra-booking-summary">
                    <h3><?php esc_html_e('Booking Summary', 'yatra'); ?></h3>
                    
                    <!-- Travel Details -->
                    <div class="yatra-summary-travel-details">
                        <div class="yatra-summary-form-group">
                            <label for="travel-date"><?php esc_html_e('Travel Date', 'yatra'); ?> <span class="required">*</span></label>
                            <input type="date" id="travel-date" name="travel_date" form="yatra-booking-form" required value="<?php echo esc_attr($booking_date); ?>">
                        </div>
                        
                        <div class="yatra-summary-form-group">
                            <label for="number-of-travelers"><?php esc_html_e('Number of Travelers', 'yatra'); ?></label>
                            <div class="yatra-traveler-selector">
                                <button type="button" class="yatra-quantity-btn minus" data-field="travelers">-</button>
                                <input type="number" id="number-of-travelers" name="number_of_travelers" value="<?php echo esc_attr($total_travelers); ?>" min="<?php echo esc_attr($min_travelers); ?>" max="<?php echo esc_attr($max_travelers); ?>" readonly form="yatra-booking-form">
                                <button type="button" class="yatra-quantity-btn plus" data-field="travelers">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Trip Info -->
                    <div class="yatra-summary-trip">
                        <div class="yatra-summary-image">
                            <img src="<?php echo esc_url($trip_image); ?>" alt="<?php echo esc_attr($trip_data->title); ?>">
                        </div>
                        <div class="yatra-summary-details">
                            <h4><?php echo esc_html($trip_data->title); ?></h4>
                            <div class="yatra-summary-meta">
                                <?php if (!empty($trip_data->duration_days)) : ?>
                                <span><?php echo esc_html($trip_data->duration_days); ?> <?php esc_html_e('Days', 'yatra'); ?></span>
                                <?php endif; ?>
                                <?php if (!empty($trip_data->difficulty_level)) : ?>
                                <span>•</span>
                                <span><?php echo esc_html(ucfirst($trip_data->difficulty_level)); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <!-- Price Breakdown -->
                    <div class="yatra-summary-pricing">
                        <div class="yatra-price-row">
                            <span><?php esc_html_e('Price per person', 'yatra'); ?></span>
                            <span data-price="<?php echo esc_attr($trip_price); ?>"><?php echo yatra_format_price($trip_price, $currency); ?></span>
                        </div>
                        <div class="yatra-price-row">
                            <span><?php esc_html_e('Number of travelers', 'yatra'); ?></span>
                            <span id="summary-travelers"><?php echo esc_html($total_travelers); ?></span>
                        </div>
                        
                        <?php if ($deposit_required) : ?>
                        <div class="yatra-price-row yatra-price-deposit" style="display: none;">
                            <span><?php printf(esc_html__('Deposit (%d%%)', 'yatra'), $deposit_percentage); ?></span>
                            <span id="summary-deposit"><?php echo yatra_format_price(($trip_price * $total_travelers) * ($deposit_percentage / 100), $currency); ?></span>
                        </div>
                        <?php endif; ?>
                        
                        <div class="yatra-price-row yatra-price-total">
                            <span><strong><?php esc_html_e('Total Amount', 'yatra'); ?></strong></span>
                            <span id="summary-total"><strong><?php echo yatra_format_price($trip_price * $total_travelers, $currency); ?></strong></span>
                        </div>
                        
                        <div class="yatra-price-row yatra-price-due" style="display: none;">
                            <span><?php esc_html_e('Due Now', 'yatra'); ?></span>
                            <span id="summary-due"><strong><?php echo yatra_format_price($trip_price * $total_travelers, $currency); ?></strong></span>
                        </div>
                    </div>

                    <!-- Important Info -->
                    <div class="yatra-summary-info">
                        <h4><?php esc_html_e('Important Information', 'yatra'); ?></h4>
                        <ul>
                            <li><?php esc_html_e('Free cancellation up to 48 hours before departure', 'yatra'); ?></li>
                            <li><?php esc_html_e('Instant confirmation', 'yatra'); ?></li>
                            <li><?php esc_html_e('24/7 customer support', 'yatra'); ?></li>
                            <li><?php esc_html_e('Secure payment processing', 'yatra'); ?></li>
                        </ul>
                    </div>
                    
                    <!-- Selected Gateway Info (will be updated dynamically) -->
                    <div class="yatra-gateway-info" id="yatra-gateway-info" style="display: none;">
                        <h4><?php esc_html_e('Payment Information', 'yatra'); ?></h4>
                        <div id="yatra-gateway-details"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>


