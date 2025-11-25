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
global $wp_query;
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

// Dummy trip data (in production, fetch from database)
$trip_data = (object) [
    'id' => 1,
    'title' => 'Everest Base Camp Trek - 14 Days Adventure',
    'slug' => 'everest-base-camp-trek',
    'image' => 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920&q=80',
    'duration_days' => 14,
    'duration_nights' => 13,
    'difficulty_level' => 'challenging',
    'min_travelers' => 2,
    'max_travelers' => 12,
    'original_price' => 1850.00,
    'sale_price' => 1650.00,
    'currency' => 'USD',
    'starting_location' => 'Kathmandu, Nepal',
    'ending_location' => 'Kathmandu, Nepal',
];

// Helper function to format price
function yatra_format_price($price, $currency = 'USD') {
    return $currency . ' ' . number_format($price, 0);
}

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
                    <div class="yatra-booking-section">
                        <h2 class="yatra-section-title">Payment Method</h2>
                        
                        <div class="yatra-payment-methods">
                            <label class="yatra-payment-option">
                                <input type="radio" name="payment_method" value="full" checked>
                                <span class="yatra-payment-label">
                                    <strong>Pay in Full</strong>
                                    <span>Pay the total amount now</span>
                                </span>
                            </label>
                            
                            <label class="yatra-payment-option">
                                <input type="radio" name="payment_method" value="deposit">
                                <span class="yatra-payment-label">
                                    <strong>Pay Deposit</strong>
                                    <span>Pay 30% now, balance later</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <!-- Payment Gateway Section -->
                    <div class="yatra-booking-section">
                        <h2 class="yatra-section-title">Select Payment Gateway</h2>
                        
                        <div class="yatra-payment-gateways">
                            <label class="yatra-gateway-option">
                                <input type="radio" name="payment_gateway" value="paypal" checked>
                                <span class="yatra-gateway-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="24" height="24" rx="4" fill="#003087"/>
                                        <path d="M9.5 8.5h2.5c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5H10v1.5h-1.5v-6.5zm1.5 3h1c.5 0 1-.5 1-1s-.5-1-1-1h-1v2z" fill="#fff"/>
                                    </svg>
                                </span>
                                <span class="yatra-gateway-label">
                                    <strong>PayPal</strong>
                                    <span>Pay securely with PayPal</span>
                                </span>
                            </label>
                            
                            <label class="yatra-gateway-option">
                                <input type="radio" name="payment_gateway" value="stripe">
                                <span class="yatra-gateway-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="24" height="24" rx="4" fill="#635BFF"/>
                                        <path d="M10.5 9h-2v6h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2zm0 3h-1v-2h1c.6 0 1 .4 1 1s-.4 1-1 1zm4-3h-2v6h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2zm0 3h-1v-2h1c.6 0 1 .4 1 1s-.4 1-1 1z" fill="#fff"/>
                                    </svg>
                                </span>
                                <span class="yatra-gateway-label">
                                    <strong>Stripe</strong>
                                    <span>Credit or debit card</span>
                                </span>
                            </label>
                            
                            <label class="yatra-gateway-option">
                                <input type="radio" name="payment_gateway" value="bank_transfer">
                                <span class="yatra-gateway-icon">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                                    </svg>
                                </span>
                                <span class="yatra-gateway-label">
                                    <strong>Bank Transfer</strong>
                                    <span>Direct bank transfer</span>
                                </span>
                            </label>
                        </div>
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
                        <button type="submit" class="yatra-booking-pay-btn">
                            <span>Pay Now</span>
                            <span id="pay-amount"><?php echo yatra_format_price($trip_data->sale_price * 2, $trip_data->currency); ?></span>
                        </button>
                        <a href="<?php echo esc_url(home_url('/trip/' . $trip_data->slug)); ?>" class="yatra-booking-cancel-btn">
                            Cancel
                        </a>
                    </div>
                </form>
            </div>

            <!-- Right Side: Booking Summary -->
            <div class="yatra-booking-sidebar">
                <div class="yatra-booking-summary">
                    <h3>Booking Summary</h3>
                    
                    <!-- Travel Details -->
                    <div class="yatra-summary-travel-details">
                        <div class="yatra-summary-form-group">
                            <label for="travel-date">Travel Date <span class="required">*</span></label>
                            <input type="date" id="travel-date" name="travel_date" form="yatra-booking-form" required>
                        </div>
                        
                        <div class="yatra-summary-form-group">
                            <label for="number-of-travelers">Number of Travelers</label>
                            <div class="yatra-traveler-selector">
                                <button type="button" class="yatra-quantity-btn minus" data-field="travelers">-</button>
                                <input type="number" id="number-of-travelers" name="number_of_travelers" value="2" min="2" max="12" readonly form="yatra-booking-form">
                                <button type="button" class="yatra-quantity-btn plus" data-field="travelers">+</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Trip Info -->
                    <div class="yatra-summary-trip">
                        <div class="yatra-summary-image">
                            <img src="<?php echo esc_url($trip_data->image); ?>" alt="<?php echo esc_attr($trip_data->title); ?>">
                        </div>
                        <div class="yatra-summary-details">
                            <h4><?php echo esc_html($trip_data->title); ?></h4>
                            <div class="yatra-summary-meta">
                                <span><?php echo esc_html($trip_data->duration_days); ?> Days</span>
                                <span>•</span>
                                <span><?php echo esc_html(ucfirst($trip_data->difficulty_level)); ?></span>
                            </div>
                        </div>
                    </div>

                    <!-- Price Breakdown -->
                    <div class="yatra-summary-pricing">
                        <div class="yatra-price-row">
                            <span>Price per person</span>
                            <span><?php echo yatra_format_price($trip_data->sale_price, $trip_data->currency); ?></span>
                        </div>
                        <div class="yatra-price-row">
                            <span>Number of travelers</span>
                            <span id="summary-travelers">2</span>
                        </div>
                        <div class="yatra-price-row yatra-price-total">
                            <span><strong>Total Amount</strong></span>
                            <span id="summary-total"><strong><?php echo yatra_format_price($trip_data->sale_price * 2, $trip_data->currency); ?></strong></span>
                        </div>
                    </div>

                    <!-- Important Info -->
                    <div class="yatra-summary-info">
                        <h4>Important Information</h4>
                        <ul>
                            <li>Free cancellation up to 48 hours before departure</li>
                            <li>Instant confirmation</li>
                            <li>24/7 customer support</li>
                            <li>Secure payment processing</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>


