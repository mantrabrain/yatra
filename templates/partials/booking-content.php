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
 * - $is_remaining_payment
 * - $remaining_amount
 * - $existing_booking_id
 * - $booking_reference
 */

if (!defined('ABSPATH')) {
    exit;
}

// Prepare variables for form fields partial
$trip_id = $trip->id;
$trip_slug = $trip->slug ?? '';
$is_remaining_payment = !empty($booking->is_remaining_payment);
$remaining_amount = isset($booking->remaining_amount) ? (float) $booking->remaining_amount : null;
$existing_booking_id = $booking->existing_booking_id ?? 0;
$booking_reference = $booking->booking_reference ?? '';
$amount_paid = isset($booking->amount_paid) ? (float) $booking->amount_paid : null;
$total_amount = isset($booking->total_amount) ? (float) $booking->total_amount : null;

// Check if login is required
$require_login = \Yatra\Services\SettingsService::get('require_login', false);
$allow_guest_checkout = \Yatra\Services\SettingsService::get('allow_guest_checkout', true);
$needs_authentication = !is_user_logged_in() && ($require_login || !$allow_guest_checkout);

// Get group discount from booking object (calculated in AppServiceProvider)
$group_discount = $booking->group_discount ?? null;
$group_discount_amount = $group_discount['amount'] ?? 0;
$group_discount_code = $group_discount['code'] ?? null;
$group_discount_label = $group_discount['label'] ?? __('Group Discount', 'yatra');
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
                        <h1>
                            <?php
                            if (!empty($booking->is_remaining_payment)) {
                                esc_html_e('Pay Remaining Balance', 'yatra');
                            } else {
                                esc_html_e('Complete Your Booking', 'yatra');
                            }
                            ?>
                        </h1>
                        <p class="yatra-booking-subtitle">
                            <?php
                            $reference_label = $booking_reference ? '#' . $booking_reference : '';

                            if ($is_remaining_payment) {
                                echo esc_html(
                                    sprintf(
                                        /* translators: %s booking reference */
                                        __('You are paying the remaining balance for Booking %s.', 'yatra'),
                                        $reference_label ?: __('(unknown reference)', 'yatra')
                                    )
                                );
                            } else {
                                esc_html_e('Please fill in your details to complete the booking', 'yatra');
                            }
                            ?>
                        </p>
                        <?php if ($is_remaining_payment && !empty($remaining_amount)) : ?>
                            <div class="yatra-remaining-banner">
                                <strong><?php esc_html_e('Amount Due Now', 'yatra'); ?>:</strong>
                                <span><?php echo esc_html(yatra_format_price($remaining_amount)); ?></span>
                                <?php if (!empty($amount_paid)) : ?>
                                    <small>
                                        <?php
                                        printf(
                                            /* translators: %s formatted amount */
                                            esc_html__('Amount already paid: %s', 'yatra'),
                                            yatra_format_price($amount_paid)
                                        );
                                        ?>
                                    </small>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>
                    </div>

                    <!-- Booking Form -->
                    <form
                        class="yatra-booking-form"
                        id="yatra-booking-form"
                        data-payment-due="<?php echo esc_attr($is_remaining_payment && $remaining_amount ? $remaining_amount : ($trip->price * $total_travelers)); ?>"
                        data-is-remaining-payment="<?php echo esc_attr($is_remaining_payment ? 'yes' : 'no'); ?>"
                    >
                        <?php 
                        // Pass pricing type info to form fields partial
                        $pricing_type = $booking->pricing_type ?? 'regular';
                        $price_types = $booking->price_types ?? [];
                        $traveler_counts = $booking->traveler_counts ?? [];
                        // Include shared booking form fields
                        include YATRA_PLUGIN_PATH . 'templates/partials/booking-form-fields.php'; 
                        ?>

                    <!-- Submit Button -->
                    <div class="yatra-booking-actions">
                        <button type="submit" class="yatra-booking-pay-btn" id="yatra-submit-booking">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="CurrentColor" stroke-width="2">
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
                    <div class="yatra-booking-form-errors" id="yatra-booking-form-errors" aria-live="polite"></div>
                    
                    <input type="hidden" name="trip_price" value="<?php echo esc_attr($trip->price); ?>">
                    <input type="hidden" name="currency" value="<?php echo esc_attr(\Yatra\Services\SettingsService::getCurrency()); ?>">
                    <?php wp_nonce_field('yatra_booking_nonce', 'yatra_booking_nonce'); ?>
                </form>
                <?php endif; ?>
            </div>

            <!-- Right Side: Booking Summary -->
            <div class="yatra-booking-sidebar">
                <?php
                $default_total = $trip->price * $total_travelers;
                $summary_total_amount = $is_remaining_payment && !empty($total_amount)
                    ? (float) $total_amount
                    : $default_total;
                $summary_due_amount = $is_remaining_payment && $remaining_amount !== null
                    ? (float) $remaining_amount
                    : $default_total;
                ?>

                <?php if ($is_remaining_payment) : ?>
                <!-- Simplified Remaining Payment Sidebar -->
                <div class="yatra-booking-summary yatra-remaining-summary" data-summary-total="<?php echo esc_attr($summary_total_amount); ?>" data-summary-due="<?php echo esc_attr($summary_due_amount); ?>" data-is-remaining="yes">
                    <h3><?php esc_html_e('Payment Summary', 'yatra'); ?></h3>
                    
                    <!-- Booking Reference -->
                    <div class="yatra-remaining-reference">
                        <div class="yatra-reference-badge">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            <span><?php esc_html_e('Booking Reference', 'yatra'); ?></span>
                        </div>
                        <strong class="yatra-reference-value">#<?php echo esc_html($booking_reference); ?></strong>
                    </div>

                    <!-- Trip Info Card -->
                    <div class="yatra-remaining-trip-card">
                        <div class="yatra-remaining-trip-image">
                            <img src="<?php echo esc_url($trip->featured_image); ?>" alt="<?php echo esc_attr($trip->title); ?>">
                        </div>
                        <div class="yatra-remaining-trip-info">
                            <h4><?php echo esc_html($trip->title); ?></h4>
                            <div class="yatra-remaining-trip-meta">
                                <span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($travel_date))); ?>
                                </span>
                                <span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                    </svg>
                                    <?php echo esc_html($total_travelers . ' ' . _n('traveler', 'travelers', $total_travelers, 'yatra')); ?>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Breakdown -->
                    <div class="yatra-remaining-breakdown">
                        <div class="yatra-remaining-row">
                            <span><?php esc_html_e('Original Booking Total', 'yatra'); ?></span>
                            <span><?php echo esc_html(yatra_format_price($total_amount)); ?></span>
                        </div>
                        <div class="yatra-remaining-row yatra-remaining-paid">
                            <span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <?php esc_html_e('Amount Already Paid', 'yatra'); ?>
                            </span>
                            <span class="yatra-paid-amount"><?php echo esc_html(yatra_format_price($amount_paid)); ?></span>
                        </div>
                        <div class="yatra-remaining-row yatra-remaining-due">
                            <span><strong><?php esc_html_e('Remaining Balance', 'yatra'); ?></strong></span>
                            <span class="yatra-due-amount"><strong><?php echo esc_html(yatra_format_price($remaining_amount)); ?></strong></span>
                        </div>
                    </div>

                    <!-- Due Now Highlight -->
                    <div class="yatra-remaining-due-now">
                        <div class="yatra-due-now-label">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            <?php esc_html_e('Amount Due Now', 'yatra'); ?>
                        </div>
                        <div class="yatra-due-now-amount" id="summary-due">
                            <?php echo esc_html(yatra_format_price($remaining_amount)); ?>
                        </div>
                    </div>

                    <!-- Secure Payment Badge -->
                    <div class="yatra-remaining-secure">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <span><?php esc_html_e('Secure SSL encrypted payment', 'yatra'); ?></span>
                    </div>
                </div>
                <?php else : ?>
                <!-- Regular Booking Summary -->
                <div class="yatra-booking-summary" data-summary-total="<?php echo esc_attr($summary_total_amount); ?>" data-summary-due="<?php echo esc_attr($summary_due_amount); ?>" data-is-remaining="no">
                    <h3><?php esc_html_e('Booking Summary', 'yatra'); ?></h3>
                    
                    <!-- Travel Details -->
                    <div class="yatra-summary-travel-details">
                        <?php 
                        $departure_time = $booking->departure_time ?? '';
                        $is_day_trip = $booking->is_day_trip ?? false;
                        $pricing_type = $booking->pricing_type ?? 'regular';
                        $price_types = $booking->price_types ?? [];
                        $traveler_counts = $booking->traveler_counts ?? [];
                        ?>
                        
                        <div class="yatra-summary-form-group">
                            <label for="travel-date"><?php esc_html_e('Travel Date', 'yatra'); ?> <span class="required">*</span></label>
                            <?php if ($is_day_trip && !empty($departure_time)): ?>
                                <!-- Single day trip with time slot - show as read-only -->
                                <div class="yatra-selected-datetime">
                                    <span class="yatra-date-display"><?php echo esc_html(date_i18n(get_option('date_format'), strtotime($travel_date))); ?></span>
                                    <span class="yatra-time-display"><?php echo esc_html(\Yatra\Helpers\FormatHelper::formatTimeForDisplay($departure_time)); ?></span>
                                </div>
                                <input type="hidden" id="travel-date" name="travel_date" form="yatra-booking-form" value="<?php echo esc_attr($travel_date); ?>">
                                <input type="hidden" name="departure_time" form="yatra-booking-form" value="<?php echo esc_attr($departure_time); ?>">
                            <?php else: ?>
                            <input type="date" id="travel-date" name="travel_date" form="yatra-booking-form" required value="<?php echo esc_attr($travel_date); ?>">
                            <?php endif; ?>
                        </div>
                        
                        <?php if ($pricing_type === 'traveler_based' && !empty($price_types)): ?>
                        <!-- Traveler-based pricing: Dropdown selector -->
                        <div class="yatra-summary-form-group yatra-traveler-categories">
                            <label><?php esc_html_e('Travelers', 'yatra'); ?></label>
                            <?php 
                            $total_price = 0;
                            $display_parts = [];
                            foreach ($price_types as $index => $pt) {
                                $pt = (object) $pt;
                                $category_id = $pt->category_id ?? $index;
                                $category_label = $pt->category_label ?? __('Traveler', 'yatra');
                                $category_price = isset($pt->effective_price) ? (float) $pt->effective_price : ($pt->sale_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                                $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : ($index === 0 ? 1 : 0);
                                if ($count > 0) {
                                    $display_parts[] = $category_label . ' x ' . $count;
                                }
                                $total_price += $category_price * $count;
                            }
                            $display_text = !empty($display_parts) ? implode(', ', $display_parts) : __('Select travelers', 'yatra');
                            ?>
                            <div class="yatra-booking-participants-select" id="yatra-booking-travelers-select">
                                <div class="yatra-booking-field-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <div class="yatra-booking-participants-display" id="yatra-travelers-display">
                                    <?php echo esc_html($display_text); ?>
                                </div>
                                <svg class="yatra-select-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                                
                                <!-- Dropdown -->
                                <div class="yatra-booking-quantity-dropdown" id="yatra-travelers-dropdown">
                                    <?php foreach ($price_types as $index => $pt): 
                                        $pt = (object) $pt;
                                        $category_id = $pt->category_id ?? $index;
                                        $category_label = $pt->category_label ?? __('Traveler', 'yatra');
                                        $category_price = isset($pt->effective_price) ? (float) $pt->effective_price : ($pt->sale_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                                        $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : ($index === 0 ? 1 : 0);
                                        $age_info = '';
                                        if (isset($pt->age_min) || isset($pt->age_max)) {
                                            if (isset($pt->age_min) && isset($pt->age_max)) {
                                                $age_info = sprintf(__('(Age %d-%d)', 'yatra'), $pt->age_min, $pt->age_max);
                                            } elseif (isset($pt->age_min)) {
                                                $age_info = sprintf(__('(Age %d+)', 'yatra'), $pt->age_min);
                                            } else {
                                                $age_info = sprintf(__('(Up to age %d)', 'yatra'), $pt->age_max);
                                            }
                                        }
                                    ?>
                                    <div class="yatra-quantity-row" data-category-id="<?php echo esc_attr($category_id); ?>" data-price="<?php echo esc_attr($category_price); ?>">
                                        <div class="yatra-quantity-label">
                                            <span class="yatra-quantity-title"><?php echo esc_html($category_label); ?></span>
                                            <?php if ($age_info): ?>
                                            <span class="yatra-quantity-subtitle"><?php echo esc_html($age_info); ?></span>
                                            <?php endif; ?>
                                            <span class="yatra-quantity-price"><?php echo esc_html(yatra_format_price($category_price)); ?></span>
                                        </div>
                                        <div class="yatra-quantity-controls">
                                            <button type="button" class="yatra-qty-btn yatra-qty-minus" data-category="<?php echo esc_attr($category_id); ?>" <?php echo $count <= 0 ? 'disabled' : ''; ?>>
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                                </svg>
                                            </button>
                                            <input type="number" 
                                                   name="traveler_counts[<?php echo esc_attr($category_id); ?>]" 
                                                   class="yatra-qty-input"
                                                   value="<?php echo esc_attr($count); ?>" 
                                                   min="0" 
                                                   max="<?php echo esc_attr($trip->max_travelers ?? 20); ?>" 
                                                   readonly
                                                   data-category-id="<?php echo esc_attr($category_id); ?>"
                                                   data-price="<?php echo esc_attr($category_price); ?>"
                                                   form="yatra-booking-form">
                                            <button type="button" class="yatra-qty-btn yatra-qty-plus" data-category="<?php echo esc_attr($category_id); ?>">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                        <?php else: ?>
                        <!-- Regular pricing: Dropdown selector -->
                        <div class="yatra-summary-form-group">
                            <label for="number-of-travelers"><?php esc_html_e('Number of Travelers', 'yatra'); ?></label>
                            <div class="yatra-booking-participants-select" id="yatra-booking-travelers-select-regular">
                                <div class="yatra-booking-field-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <div class="yatra-booking-participants-display" id="yatra-travelers-display-regular">
                                    <?php echo esc_html($total_travelers . ' ' . _n('traveler', 'travelers', $total_travelers, 'yatra')); ?>
                                </div>
                                <svg class="yatra-select-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                                
                                <!-- Dropdown -->
                                <div class="yatra-booking-quantity-dropdown" id="yatra-travelers-dropdown-regular">
                                    <div class="yatra-quantity-row">
                                        <div class="yatra-quantity-label">
                                            <span class="yatra-quantity-title"><?php esc_html_e('Travelers', 'yatra'); ?></span>
                                            <span class="yatra-quantity-price"><?php echo esc_html(yatra_format_price($trip->price)); ?> <?php esc_html_e('per person', 'yatra'); ?></span>
                                        </div>
                                        <div class="yatra-quantity-controls">
                                            <button type="button" class="yatra-qty-btn yatra-qty-minus" data-field="travelers" <?php echo $total_travelers <= ($trip->min_travelers ?? 1) ? 'disabled' : ''; ?>>
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                                </svg>
                                            </button>
                                            <input type="number" 
                                                   id="number-of-travelers" 
                                                   name="number_of_travelers" 
                                                   class="yatra-qty-input"
                                                   value="<?php echo esc_attr($total_travelers); ?>" 
                                                   min="<?php echo esc_attr($trip->min_travelers ?? 1); ?>" 
                                                   max="<?php echo esc_attr($trip->max_travelers ?? 20); ?>" 
                                                   readonly 
                                                   form="yatra-booking-form">
                                            <button type="button" class="yatra-qty-btn yatra-qty-plus" data-field="travelers">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <?php endif; ?>
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

                    <!-- Coupon Code Section -->
                    <div class="yatra-coupon-section">
                        <div class="yatra-coupon-toggle">
                            <button type="button" id="yatra-coupon-toggle-btn" class="yatra-coupon-toggle-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"></path>
                                    <path d="M12 2v10"></path>
                                    <path d="m4.93 10.93 1.41 1.41"></path>
                                    <path d="m17.66 10.93-1.41 1.41"></path>
                                    <circle cx="12" cy="2" r="2"></circle>
                                </svg>
                                <?php esc_html_e('Have a coupon code?', 'yatra'); ?>
                                <svg class="yatra-coupon-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>
                        <div class="yatra-coupon-form" id="yatra-coupon-form" style="display: none;">
                            <div class="yatra-coupon-input-group">
                                <input type="text" id="yatra-coupon-code" name="coupon_code" placeholder="<?php esc_attr_e('Enter coupon code', 'yatra'); ?>" class="yatra-coupon-input" autocomplete="off">
                                <button type="button" id="yatra-apply-coupon" class="yatra-apply-coupon-btn">
                                    <?php esc_html_e('Apply', 'yatra'); ?>
                                </button>
                            </div>
                            <div id="yatra-coupon-message" class="yatra-coupon-message" style="display: none;"></div>
                        </div>
                        <!-- Applied Coupon Display -->
                        <div class="yatra-applied-coupon" id="yatra-applied-coupon" style="display: none;">
                            <div class="yatra-applied-coupon-info">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <span class="yatra-coupon-code-display"></span>
                                <span class="yatra-coupon-discount"></span>
                            </div>
                            <button type="button" id="yatra-remove-coupon" class="yatra-remove-coupon-btn" title="<?php esc_attr_e('Remove coupon', 'yatra'); ?>">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Additional Services Section (Premium Feature) -->
                    <?php
                    /**
                     * Filter: Get additional services for this trip
                     * Allows premium modules to add extra services to the booking
                     */
                    $additional_services = apply_filters('yatra_booking_additional_services', [], $trip_id, $total_travelers, $traveler_counts ?? [], $travel_date);
                    
                    // Get selected services from session (set from popup)
                    $session = yatra_get_booking_session();
                    $selected_service_ids = isset($session['additional_services']) && is_array($session['additional_services']) 
                        ? array_map('intval', $session['additional_services']) 
                        : [];
                    
                    if (!empty($additional_services)) :
                    ?>
                    <div class="yatra-additional-services-section">
                        <div class="yatra-services-header">
                            <h4><?php esc_html_e('Additional Services', 'yatra'); ?></h4>
                            <p class="yatra-services-subtitle"><?php esc_html_e('Enhance your trip with these optional add-ons', 'yatra'); ?></p>
                        </div>
                        <div class="yatra-services-list" id="yatra-additional-services">
                            <?php foreach ($additional_services as $service) : 
                                $service_id = (int) $service['id'];
                                $service_name = $service['name'];
                                $service_description = $service['description'] ?? '';
                                $service_price = (float) $service['price'];
                                $service_price_per = $service['price_per'] ?? 'person';
                                $service_image = $service['image_url'] ?? '';
                                // Check is_required - handle various formats (bool, string "1", int 1)
                                $is_required = isset($service['is_required']) && ($service['is_required'] === true || $service['is_required'] === 1 || $service['is_required'] === '1');
                                $is_included = isset($service['is_included']) && ($service['is_included'] === true || $service['is_included'] === 1 || $service['is_included'] === '1');
                                $is_selected = in_array($service_id, $selected_service_ids, false);
                                
                                $price_label = yatra_format_price($service_price);
                                if ($service_price_per === 'person') {
                                    $price_label .= ' ' . __('per person', 'yatra');
                                } elseif ($service_price_per === 'day') {
                                    $price_label .= ' ' . __('per day', 'yatra');
                                } else {
                                    $price_label .= ' ' . __('per booking', 'yatra');
                                }
                                if ($is_included) {
                                    $price_label = __('Included', 'yatra');
                                }
                                
                                // Determine checked and disabled states
                                $is_checked = $is_required || $is_included || $is_selected;
                                $is_disabled = $is_required || $is_included;
                            ?>
                            <div class="yatra-service-item <?php echo $is_required ? 'yatra-service-required' : ''; ?> <?php echo $is_checked ? 'yatra-service-selected' : ''; ?>"
                                 data-service-id="<?php echo esc_attr($service_id); ?>"
                                 data-service-price="<?php echo esc_attr($service_price); ?>"
                                 data-service-price-per="<?php echo esc_attr($service_price_per); ?>"
                                 data-is-required="<?php echo $is_required ? '1' : '0'; ?>">
                                <label class="yatra-service-label">
                                    <input type="checkbox" 
                                           name="additional_services[]" 
                                           value="<?php echo esc_attr($service_id); ?>"
                                           <?php echo $is_checked ? 'checked' : ''; ?>
                                           <?php echo $is_disabled ? 'disabled' : ''; ?>
                                           form="yatra-booking-form">
                                    <div class="yatra-service-info">
                                        <span class="yatra-service-name"><?php echo esc_html($service_name); ?></span>
                                        <?php if ($service_description) : ?>
                                        <span class="yatra-service-description"><?php echo esc_html($service_description); ?></span>
                                        <?php endif; ?>
                                    </div>
                                    <span class="yatra-service-price"><?php echo esc_html($price_label); ?></span>
                                </label>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Price Breakdown -->
                    <div class="yatra-summary-pricing" id="yatra-summary-pricing" data-pricing-type="<?php echo esc_attr($pricing_type); ?>" data-is-remaining="<?php echo esc_attr($is_remaining_payment ? 'yes' : 'no'); ?>">
                        <!-- This section is loaded/updated via AJAX -->
                        <?php if ($pricing_type === 'traveler_based' && !empty($price_types)): 
                            // Calculate total for traveler-based pricing
                            $calculated_total = 0;
                            foreach ($price_types as $index => $pt) {
                                $pt = (object) $pt;
                                $category_id = $pt->category_id ?? $index;
                                $category_price = isset($pt->effective_price) ? (float) $pt->effective_price : ($pt->sale_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                                $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : ($index === 0 ? 1 : 0);
                                $calculated_total += $category_price * $count;
                            }
                        ?>
                        <!-- Traveler-based price breakdown -->
                        <div class="yatra-price-breakdown-categories" id="price-breakdown-categories">
                            <?php foreach ($price_types as $index => $pt): 
                                $pt = (object) $pt;
                                $category_id = $pt->category_id ?? $index;
                                $category_label = $pt->category_label ?? __('Traveler', 'yatra');
                                $category_price = isset($pt->effective_price) ? (float) $pt->effective_price : ($pt->sale_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
                                $count = isset($traveler_counts[$category_id]) ? (int) $traveler_counts[$category_id] : ($index === 0 ? 1 : 0);
                                $subtotal = $category_price * $count;
                                if ($count > 0):
                            ?>
                            <div class="yatra-price-row yatra-category-subtotal" data-category-id="<?php echo esc_attr($category_id); ?>">
                                <span><?php echo esc_html($category_label); ?> x <span class="category-count"><?php echo esc_html($count); ?></span></span>
                                <span class="category-subtotal"><?php echo esc_html(yatra_format_price($subtotal)); ?></span>
                            </div>
                            <?php endif; endforeach; ?>
                        </div>
                        
                        <!-- Gross Total (subtotal before discounts) -->
                        <div class="yatra-price-row yatra-price-subtotal">
                            <span><strong><?php esc_html_e('Gross Total', 'yatra'); ?></strong></span>
                            <span id="summary-gross-total"><strong><?php echo esc_html(yatra_format_price($calculated_total)); ?></strong></span>
                        </div>
                        
                        <!-- Coupon Discount Row (hidden by default) -->
                        <div class="yatra-price-row yatra-price-discount" id="yatra-discount-row" style="display: none;">
                            <span class="yatra-discount-label">
                                <?php esc_html_e('Discount', 'yatra'); ?>
                                <span class="yatra-discount-code"></span>
                            </span>
                            <span id="summary-discount" class="yatra-discount-amount">-$0.00</span>
                        </div>
                        
                        <?php if ($group_discount && $group_discount_amount > 0) : ?>
                        <!-- Group Discount Row -->
                        <div class="yatra-price-row yatra-price-discount yatra-group-discount-row" id="yatra-group-discount-row" 
                             data-discount-type="<?php echo esc_attr($group_discount['type'] ?? ''); ?>"
                             data-discount-value="<?php echo esc_attr($group_discount['value'] ?? $group_discount_amount); ?>"
                             data-discount-code="<?php echo esc_attr($group_discount_code ?? ''); ?>">
                            <span class="yatra-discount-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <?php echo esc_html($group_discount_label); ?>
                            </span>
                            <span class="yatra-discount-amount" style="color: #059669; font-weight: 500;">-<?php echo esc_html(yatra_format_price($group_discount_amount)); ?></span>
                        </div>
                        <?php endif; ?>
                        
                        <!-- Additional Services (individual rows rendered from AJAX) -->
                        <div id="yatra-services-breakdown-traveler" class="yatra-services-breakdown"></div>
                        
                        <?php if ($deposit_required) : ?>
                        <div class="yatra-price-row yatra-price-deposit" style="display: none;">
                            <span><?php printf(esc_html__('Deposit (%d%%)', 'yatra'), $deposit_percentage); ?></span>
                            <span id="summary-deposit"><?php echo esc_html(yatra_format_price(($calculated_total - $group_discount_amount) * ($deposit_percentage / 100))); ?></span>
                        </div>
                        <?php endif; ?>
                        
                        <div class="yatra-price-row yatra-price-total">
                            <span><strong><?php esc_html_e('Net Amount', 'yatra'); ?></strong></span>
                            <span id="summary-total"><strong><?php echo esc_html(yatra_format_price($calculated_total - $group_discount_amount)); ?></strong></span>
                        </div>
                        
                        <div class="yatra-price-row yatra-price-due" style="display: none;">
                            <span><?php esc_html_e('Due Now', 'yatra'); ?></span>
                            <span id="summary-due"><strong><?php echo esc_html(yatra_format_price($calculated_total)); ?></strong></span>
                        </div>
                        
                        <?php else: ?>
                        <!-- Regular pricing breakdown -->
                        <div class="yatra-price-row">
                            <span><?php esc_html_e('Price per person', 'yatra'); ?></span>
                            <span data-price="<?php echo esc_attr($trip->price); ?>"><?php echo esc_html(yatra_format_price($trip->price)); ?></span>
                        </div>
                        <div class="yatra-price-row">
                            <span><?php esc_html_e('Number of travelers', 'yatra'); ?></span>
                            <span id="summary-travelers"><?php echo esc_html($total_travelers); ?></span>
                        </div>
                        
                        <!-- Gross Total (subtotal before discounts) -->
                        <div class="yatra-price-row yatra-price-subtotal">
                            <span><strong><?php esc_html_e('Gross Total', 'yatra'); ?></strong></span>
                            <span id="summary-gross-total"><strong><?php echo esc_html(yatra_format_price($summary_total_amount)); ?></strong></span>
                        </div>
                        
                        <!-- Coupon Discount Row (hidden by default) -->
                        <div class="yatra-price-row yatra-price-discount" id="yatra-discount-row-regular" style="display: none;">
                            <span class="yatra-discount-label">
                                <?php esc_html_e('Discount', 'yatra'); ?>
                                <span class="yatra-discount-code"></span>
                            </span>
                            <span class="yatra-discount-amount">-$0.00</span>
                        </div>
                        
                        <?php if ($group_discount && $group_discount_amount > 0) : ?>
                        <!-- Group Discount Row (Regular Pricing) -->
                        <div class="yatra-price-row yatra-price-discount yatra-group-discount-row" id="yatra-group-discount-row-regular" 
                             data-discount-type="<?php echo esc_attr($group_discount['type'] ?? ''); ?>"
                             data-discount-value="<?php echo esc_attr($group_discount['value'] ?? $group_discount_amount); ?>"
                             data-discount-code="<?php echo esc_attr($group_discount_code ?? ''); ?>">
                            <span class="yatra-discount-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <?php echo esc_html($group_discount_label); ?>
                            </span>
                            <span class="yatra-discount-amount" style="color: #059669; font-weight: 500;">-<?php echo esc_html(yatra_format_price($group_discount_amount)); ?></span>
                        </div>
                        <?php endif; ?>
                        
                        <!-- Additional Services (individual rows rendered from AJAX) -->
                        <div id="yatra-services-breakdown-regular" class="yatra-services-breakdown"></div>
                        
                        <?php if ($deposit_required) : ?>
                        <div class="yatra-price-row yatra-price-deposit" style="display: none;">
                            <span><?php printf(esc_html__('Deposit (%d%%)', 'yatra'), $deposit_percentage); ?></span>
                            <span id="summary-deposit"><?php echo esc_html(yatra_format_price(($summary_total_amount - $group_discount_amount) * ($deposit_percentage / 100))); ?></span>
                        </div>
                        <?php endif; ?>
                        
                        <div class="yatra-price-row yatra-price-total">
                            <span><strong><?php esc_html_e('Net Amount', 'yatra'); ?></strong></span>
                            <span id="summary-total"><strong><?php echo esc_html(yatra_format_price($summary_total_amount - $group_discount_amount)); ?></strong></span>
                        </div>
                        
                        <div class="yatra-price-row yatra-price-due" style="<?php echo $is_remaining_payment ? '' : 'display: none;'; ?>">
                            <span>
                                <?php
                                echo $is_remaining_payment
                                    ? esc_html__('Remaining Balance Due', 'yatra')
                                    : esc_html__('Due Now', 'yatra');
                                ?>
                            </span>
                            <span id="summary-due"><strong><?php echo esc_html(yatra_format_price($summary_due_amount)); ?></strong></span>
                        </div>
                        <?php endif; ?>
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
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

