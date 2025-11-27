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
?>

<div class="yatra-booking-page">
    <div class="yatra-booking-container">
        <div class="yatra-booking-layout">
            <!-- Left Side: Booking Form -->
            <div class="yatra-booking-main">
                <div class="yatra-booking-header">
                    <h1><?php esc_html_e('Complete Your Booking', 'yatra'); ?></h1>
                    <p class="yatra-booking-subtitle"><?php esc_html_e('Please fill in your details to complete the booking', 'yatra'); ?></p>
                </div>

                <!-- Booking Form -->
                <form class="yatra-booking-form" id="yatra-booking-form">
                    <!-- Primary Contact Information -->
                    <div class="yatra-booking-section">
                        <h2 class="yatra-section-title"><?php esc_html_e('Contact Information', 'yatra'); ?></h2>
                        
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
                                <option value="US"><?php esc_html_e('United States', 'yatra'); ?></option>
                                <option value="UK"><?php esc_html_e('United Kingdom', 'yatra'); ?></option>
                                <option value="CA"><?php esc_html_e('Canada', 'yatra'); ?></option>
                                <option value="AU"><?php esc_html_e('Australia', 'yatra'); ?></option>
                                <option value="NP"><?php esc_html_e('Nepal', 'yatra'); ?></option>
                                <option value="IN"><?php esc_html_e('India', 'yatra'); ?></option>
                            </select>
                        </div>
                    </div>

                    <!-- Traveler Information Section -->
                    <div class="yatra-booking-section">
                        <h2 class="yatra-section-title"><?php esc_html_e('Traveler Information', 'yatra'); ?></h2>
                        <p class="yatra-section-description"><?php esc_html_e('Please provide details for each traveler', 'yatra'); ?></p>
                        
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
                        
                        <?php if (empty($enabled_gateways)) : ?>
                        <p class="yatra-no-gateways-message">
                            <?php esc_html_e('No payment gateways are currently available. Please contact the administrator.', 'yatra'); ?>
                        </p>
                        <?php endif; ?>
                    </div>

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
                            <span><?php printf(
                                esc_html__('I agree to the %1$sTerms and Conditions%2$s and %3$sPrivacy Policy%4$s', 'yatra'),
                                '<a href="#" target="_blank">', '</a>',
                                '<a href="#" target="_blank">', '</a>'
                            ); ?> <span class="required">*</span></span>
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
                            <span id="pay-amount"><?php echo esc_html(yatra_format_price($trip->price * $total_travelers, $trip->currency)); ?></span>
                        </button>
                        <a href="<?php echo esc_url(home_url('/trip/' . $trip->slug)); ?>" class="yatra-booking-cancel-btn">
                            <?php esc_html_e('Cancel', 'yatra'); ?>
                        </a>
                    </div>
                    
                    <input type="hidden" name="trip_id" value="<?php echo esc_attr($trip->id); ?>">
                    <input type="hidden" name="trip_price" value="<?php echo esc_attr($trip->price); ?>">
                    <input type="hidden" name="currency" value="<?php echo esc_attr($trip->currency); ?>">
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
                            <input type="date" id="travel-date" name="travel_date" form="yatra-booking-form" required value="<?php echo esc_attr($travel_date); ?>">
                        </div>
                        
                        <div class="yatra-summary-form-group">
                            <label for="number-of-travelers"><?php esc_html_e('Number of Travelers', 'yatra'); ?></label>
                            <div class="yatra-traveler-selector">
                                <button type="button" class="yatra-quantity-btn minus" data-field="travelers">-</button>
                                <input type="number" id="number-of-travelers" name="number_of_travelers" value="<?php echo esc_attr($total_travelers); ?>" min="<?php echo esc_attr($trip->min_travelers); ?>" max="<?php echo esc_attr($trip->max_travelers); ?>" readonly form="yatra-booking-form">
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
                                <?php if ($trip->duration_days > 0) : ?>
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
                            <span data-price="<?php echo esc_attr($trip->price); ?>"><?php echo esc_html(yatra_format_price($trip->price, $trip->currency)); ?></span>
                        </div>
                        <div class="yatra-price-row">
                            <span><?php esc_html_e('Number of travelers', 'yatra'); ?></span>
                            <span id="summary-travelers"><?php echo esc_html($total_travelers); ?></span>
                        </div>
                        
                        <?php if ($deposit_required) : ?>
                        <div class="yatra-price-row yatra-price-deposit" style="display: none;">
                            <span><?php printf(esc_html__('Deposit (%d%%)', 'yatra'), $deposit_percentage); ?></span>
                            <span id="summary-deposit"><?php echo esc_html(yatra_format_price(($trip->price * $total_travelers) * ($deposit_percentage / 100), $trip->currency)); ?></span>
                        </div>
                        <?php endif; ?>
                        
                        <div class="yatra-price-row yatra-price-total">
                            <span><strong><?php esc_html_e('Total Amount', 'yatra'); ?></strong></span>
                            <span id="summary-total"><strong><?php echo esc_html(yatra_format_price($trip->price * $total_travelers, $trip->currency)); ?></strong></span>
                        </div>
                        
                        <div class="yatra-price-row yatra-price-due" style="display: none;">
                            <span><?php esc_html_e('Due Now', 'yatra'); ?></span>
                            <span id="summary-due"><strong><?php echo esc_html(yatra_format_price($trip->price * $total_travelers, $trip->currency)); ?></strong></span>
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

<?php get_footer(); ?>
