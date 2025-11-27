<?php
/**
 * Booking Form Template (for Shortcode)
 * This template renders just the booking form without header/footer
 * Used by the [yatra_booking] shortcode on custom booking pages
 * 
 * @package Yatra
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get booking data from global (set by shortcode handler)
global $booking;

// If no valid booking data, show error
if (!$booking || !empty($booking->error)) {
    ?>
    <div class="yatra-booking-error" style="max-width: 600px; margin: 40px auto; padding: 40px; text-align: center; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <svg width="64" height="64" fill="none" stroke="#ef4444" viewBox="0 0 24 24" style="margin-bottom: 20px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 12px;">
            <?php echo esc_html($booking->error_title ?? __('No Trip Selected', 'yatra')); ?>
        </h2>
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px;">
            <?php echo esc_html($booking->error_message ?? __('Please select a trip first before proceeding to checkout.', 'yatra')); ?>
        </p>
        <a href="<?php echo esc_url(home_url('/trip/')); ?>" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <?php esc_html_e('Browse Trips', 'yatra'); ?>
        </a>
    </div>
    <?php
    return;
}

// Extract data from booking object
$trip = $booking->trip;
$travel_date = $booking->travel_date;
$total_travelers = $booking->travelers;
$deposit_required = $booking->deposit_required;
$deposit_percentage = $booking->deposit_percentage;
$partial_payment = $booking->partial_payment;
$partial_payment_percentage = $booking->partial_payment_percentage;
$enabled_gateways = $booking->enabled_gateways;

// Trip data
$trip_id = $trip->id ?? 0;
$trip_title = $trip->title ?? '';
$trip_slug = $trip->slug ?? '';
$trip_image = $trip->featured_image ?? 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80';
$trip_price = !empty($trip->sale_price) ? (float)$trip->sale_price : (float)($trip->original_price ?? 0);
$currency = $trip->currency ?? 'USD';
$min_travelers = (int)($trip->min_travelers ?? 1);
$max_travelers = (int)($trip->max_travelers ?? 20);
$duration_days = (int)($trip->duration_days ?? 1);
$difficulty_level = $trip->difficulty_level ?? 'moderate';

// Ensure travelers is within limits
$total_travelers = max($min_travelers, min($max_travelers, $total_travelers));

// Calculate total
$total_price = $trip_price * $total_travelers;
?>

<div class="yatra-booking-form-wrapper">
    <div class="yatra-booking-layout">
        <!-- Left Side: Booking Form -->
        <div class="yatra-booking-main">
            <div class="yatra-booking-header">
                <h2><?php esc_html_e('Complete Your Booking', 'yatra'); ?></h2>
                <p class="yatra-booking-subtitle"><?php esc_html_e('Please fill in your details to complete the booking', 'yatra'); ?></p>
            </div>

            <!-- Booking Form -->
            <form class="yatra-booking-form" id="yatra-booking-form">
                <input type="hidden" name="trip_id" value="<?php echo esc_attr($trip_id); ?>">
                <input type="hidden" name="trip_slug" value="<?php echo esc_attr($trip_slug); ?>">
                
                <!-- Primary Contact Information -->
                <div class="yatra-booking-section">
                    <h3 class="yatra-section-title"><?php esc_html_e('Contact Information', 'yatra'); ?></h3>
                    
                    <div class="yatra-form-row">
                        <div class="yatra-form-group">
                            <label for="contact-email"><?php esc_html_e('Email Address', 'yatra'); ?> <span class="required">*</span></label>
                            <input type="email" id="contact-email" name="contact_email" required>
                        </div>
                        
                        <div class="yatra-form-group">
                            <label for="contact-phone"><?php esc_html_e('Phone Number', 'yatra'); ?> <span class="required">*</span></label>
                            <input type="tel" id="contact-phone" name="contact_phone" required>
                        </div>
                    </div>

                    <div class="yatra-form-group">
                        <label for="contact-country"><?php esc_html_e('Country', 'yatra'); ?> <span class="required">*</span></label>
                        <select id="contact-country" name="contact_country" required>
                            <option value=""><?php esc_html_e('Select Country', 'yatra'); ?></option>
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
                    <h3 class="yatra-section-title"><?php esc_html_e('Traveler Information', 'yatra'); ?></h3>
                    <p class="yatra-section-description"><?php esc_html_e('Please provide details for each traveler', 'yatra'); ?></p>
                    
                    <div id="yatra-travelers-container">
                        <!-- Traveler forms will be dynamically generated by JavaScript -->
                    </div>
                </div>

                <!-- Payment Method Section -->
                <div class="yatra-booking-section">
                    <h3 class="yatra-section-title"><?php esc_html_e('Payment Method', 'yatra'); ?></h3>
                    
                    <div class="yatra-payment-methods">
                        <label class="yatra-payment-option">
                            <input type="radio" name="payment_method" value="full" checked>
                            <span class="yatra-payment-label">
                                <strong><?php esc_html_e('Pay in Full', 'yatra'); ?></strong>
                                <span><?php esc_html_e('Pay the total amount now', 'yatra'); ?></span>
                            </span>
                        </label>
                        
                        <?php if ($deposit_required): ?>
                        <label class="yatra-payment-option">
                            <input type="radio" name="payment_method" value="deposit">
                            <span class="yatra-payment-label">
                                <strong><?php esc_html_e('Pay Deposit', 'yatra'); ?></strong>
                                <span><?php echo sprintf(esc_html__('Pay %d%% now, balance later', 'yatra'), $deposit_percentage); ?></span>
                            </span>
                        </label>
                        <?php endif; ?>
                        
                        <?php if ($partial_payment): ?>
                        <label class="yatra-payment-option">
                            <input type="radio" name="payment_method" value="partial">
                            <span class="yatra-payment-label">
                                <strong><?php esc_html_e('Partial Payment', 'yatra'); ?></strong>
                                <span><?php echo sprintf(esc_html__('Pay %d%% now', 'yatra'), $partial_payment_percentage); ?></span>
                            </span>
                        </label>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Payment Gateway Section -->
                <?php if (!empty($enabled_gateways)): ?>
                <div class="yatra-booking-section">
                    <h3 class="yatra-section-title"><?php esc_html_e('Select Payment Gateway', 'yatra'); ?></h3>
                    
                    <div class="yatra-payment-gateways">
                        <?php 
                        $first = true;
                        foreach ($enabled_gateways as $gateway_id => $gateway): 
                        ?>
                        <label class="yatra-gateway-option">
                            <input type="radio" name="payment_gateway" value="<?php echo esc_attr($gateway_id); ?>" <?php echo $first ? 'checked' : ''; ?>>
                            <span class="yatra-gateway-icon">
                                <?php if (!empty($gateway['icon'])): ?>
                                    <img src="<?php echo esc_url($gateway['icon']); ?>" alt="<?php echo esc_attr($gateway['title']); ?>" width="40" height="40">
                                <?php else: ?>
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                                    </svg>
                                <?php endif; ?>
                            </span>
                            <span class="yatra-gateway-label">
                                <strong><?php echo esc_html($gateway['title']); ?></strong>
                                <?php if (!empty($gateway['description'])): ?>
                                    <span><?php echo esc_html($gateway['description']); ?></span>
                                <?php endif; ?>
                                <?php if (!empty($gateway['is_offline'])): ?>
                                    <span class="yatra-gateway-badge"><?php esc_html_e('Offline', 'yatra'); ?></span>
                                <?php endif; ?>
                            </span>
                        </label>
                        <?php 
                        $first = false;
                        endforeach; 
                        ?>
                    </div>
                </div>
                <?php endif; ?>

                <!-- Special Requests -->
                <div class="yatra-booking-section">
                    <div class="yatra-form-group">
                        <label for="special-requests"><?php esc_html_e('Special Requests or Notes', 'yatra'); ?></label>
                        <textarea id="special-requests" name="special_requests" rows="4" placeholder="<?php esc_attr_e('Any dietary requirements, accessibility needs, or other special requests...', 'yatra'); ?>"></textarea>
                    </div>
                </div>

                <!-- Terms and Conditions -->
                <div class="yatra-booking-section">
                    <label class="yatra-checkbox-label">
                        <input type="checkbox" name="terms" required>
                        <span><?php echo sprintf(esc_html__('I agree to the %sTerms and Conditions%s and %sPrivacy Policy%s', 'yatra'), '<a href="#" target="_blank">', '</a>', '<a href="#" target="_blank">', '</a>'); ?> <span class="required">*</span></span>
                    </label>
                </div>

                <!-- Submit Button -->
                <div class="yatra-booking-actions">
                    <button type="submit" class="yatra-booking-pay-btn">
                        <span><?php esc_html_e('Pay Now', 'yatra'); ?></span>
                        <span id="pay-amount"><?php echo esc_html(yatra_format_price($total_price, $currency)); ?></span>
                    </button>
                    <?php if (!empty($trip_slug)): ?>
                    <a href="<?php echo esc_url(home_url('/trip/' . $trip_slug . '/')); ?>" class="yatra-booking-cancel-btn">
                        <?php esc_html_e('Cancel', 'yatra'); ?>
                    </a>
                    <?php endif; ?>
                </div>
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
                        <input type="date" id="travel-date" name="travel_date" value="<?php echo esc_attr($travel_date); ?>" form="yatra-booking-form" required>
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
                        <img src="<?php echo esc_url($trip_image); ?>" alt="<?php echo esc_attr($trip_title); ?>">
                    </div>
                    <div class="yatra-summary-details">
                        <h4><?php echo esc_html($trip_title); ?></h4>
                        <div class="yatra-summary-meta">
                            <span><?php echo esc_html($duration_days); ?> <?php echo esc_html(_n('Day', 'Days', $duration_days, 'yatra')); ?></span>
                            <span>•</span>
                            <span><?php echo esc_html(ucfirst($difficulty_level)); ?></span>
                        </div>
                    </div>
                </div>

                <!-- Price Breakdown -->
                <div class="yatra-summary-pricing">
                    <div class="yatra-price-row">
                        <span><?php esc_html_e('Price per person', 'yatra'); ?></span>
                        <span><?php echo esc_html(yatra_format_price($trip_price, $currency)); ?></span>
                    </div>
                    <div class="yatra-price-row">
                        <span><?php esc_html_e('Number of travelers', 'yatra'); ?></span>
                        <span id="summary-travelers"><?php echo esc_html($total_travelers); ?></span>
                    </div>
                    <div class="yatra-price-row yatra-price-total">
                        <span><strong><?php esc_html_e('Total Amount', 'yatra'); ?></strong></span>
                        <span id="summary-total"><strong><?php echo esc_html(yatra_format_price($total_price, $currency)); ?></strong></span>
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
            </div>
        </div>
    </div>
</div>
