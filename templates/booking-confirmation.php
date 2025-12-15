<?php
/**
 * Booking Confirmation Template
 * 
 * Displays booking confirmation after successful booking
 * 
 * @package Yatra
 * 
 * Global variables available:
 * - $booking_data or $GLOBALS['yatra_booking']
 */

if (!defined('ABSPATH')) {
    exit;
}

// Get booking data
$booking = $GLOBALS['yatra_booking'] ?? null;

if (!$booking) {
    wp_safe_redirect(home_url('/'));
    exit;
}

// Format dates
$travel_date_formatted = date_i18n(get_option('date_format'), strtotime($booking->travel_date));
$booking_date_formatted = date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($booking->created_at));

// Get status color
$status_colors = [
    'pending' => ['bg' => '#fef3c7', 'text' => '#d97706', 'label' => 'Pending'],
    'confirmed' => ['bg' => '#d1fae5', 'text' => '#059669', 'label' => 'Confirmed'],
    'processing' => ['bg' => '#dbeafe', 'text' => '#2563eb', 'label' => 'Processing'],
    'completed' => ['bg' => '#d1fae5', 'text' => '#059669', 'label' => 'Completed'],
    'cancelled' => ['bg' => '#fee2e2', 'text' => '#dc2626', 'label' => 'Cancelled'],
    'refunded' => ['bg' => '#fce7f3', 'text' => '#db2777', 'label' => 'Refunded'],
    'on_hold' => ['bg' => '#e5e7eb', 'text' => '#6b7280', 'label' => 'On Hold'],
];

$status_style = $status_colors[$booking->status] ?? $status_colors['pending'];

get_header();
?>

<div class="yatra-wrapper yatra-confirmation-wrapper">
    <div class="yatra-confirmation-container">
        
        <!-- Success Header -->
        <div class="yatra-confirmation-header">
            <div class="yatra-confirmation-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="9,12 12,15 16,10"></polyline>
                </svg>
            </div>
            <h1 class="yatra-confirmation-title">
                <?php 
                if ($booking->status === 'confirmed') {
                    esc_html_e('Booking Confirmed!', 'yatra');
                } elseif ($booking->status === 'pending') {
                    esc_html_e('Booking Received!', 'yatra');
                } elseif ($booking->status === 'cancelled') {
                    esc_html_e('Booking Cancelled', 'yatra');
                } else {
                    esc_html_e('Booking Submitted!', 'yatra');
                }
                ?>
            </h1>
            <p class="yatra-confirmation-subtitle">
                <?php 
                if ($booking->status === 'confirmed') {
                    esc_html_e('Thank you for your booking. We look forward to hosting you!', 'yatra');
                } elseif ($booking->status === 'pending') {
                    esc_html_e('Thank you for your booking. Your booking is pending confirmation.', 'yatra');
                } elseif ($booking->status === 'cancelled') {
                    esc_html_e('This booking has been cancelled.', 'yatra');
                } else {
                    esc_html_e('Thank you for your booking submission.', 'yatra');
                }
                ?>
            </p>
            <div class="yatra-confirmation-reference">
                <span class="yatra-ref-label"><?php esc_html_e('Booking Reference:', 'yatra'); ?></span>
                <span class="yatra-ref-code"><?php echo esc_html($booking->reference); ?></span>
            </div>
        </div>

        <div class="yatra-confirmation-content">
            <!-- Trip Summary Card -->
            <div class="yatra-confirmation-card yatra-trip-summary-card">
                <div class="yatra-trip-summary">
                    <?php if (!empty($booking->featured_image)) : ?>
                    <div class="yatra-trip-image">
                        <img src="<?php echo esc_url($booking->featured_image); ?>" alt="<?php echo esc_attr($booking->trip_title); ?>">
                    </div>
                    <?php endif; ?>
                    
                    <div class="yatra-trip-info">
                        <h2 class="yatra-trip-name"><?php echo esc_html($booking->trip_title); ?></h2>

                        <?php if (!empty($booking->trip_average_rating) && $booking->trip_review_count >= 0) : ?>
                        <div class="yatra-trip-rating">
                            <div class="yatra-rating-stars">
                                <?php
                                $filled_stars = floor($booking->trip_average_rating);
                                $has_half = ($booking->trip_average_rating - $filled_stars) >= 0.5;
                                for ($i = 1; $i <= 5; $i++) :
                                    $class = $i <= $filled_stars ? 'yatra-star-filled' : ($has_half && $i === $filled_stars + 1 ? 'yatra-star-half' : '');
                                ?>
                                    <span class="yatra-star <?php echo esc_attr($class); ?>">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"></polygon></svg>
                                    </span>
                                <?php endfor; ?>
                            </div>
                            <div class="yatra-rating-meta">
                                <strong><?php echo esc_html(number_format($booking->trip_average_rating, 1)); ?></strong>
                                <span>
                                    <?php
                                    /* translators: %d review count */
                                    printf(esc_html(_n('%d Review', '%d Reviews', (int) $booking->trip_review_count, 'yatra')), (int) $booking->trip_review_count);
                                    ?>
                                </span>
                            </div>
                        </div>
                        <?php endif; ?>

                        <div class="yatra-trip-meta">
                            <?php if (!empty($booking->duration_days)) : ?>
                            <span class="yatra-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <?php printf(esc_html__('%d Days / %d Nights', 'yatra'), (int) $booking->duration_days, (int) $booking->duration_nights); ?>
                            </span>
                            <?php endif; ?>
                            
                            <?php if (!empty($booking->difficulty_level)) : ?>
                            <span class="yatra-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                <?php echo esc_html(ucfirst($booking->difficulty_level)); ?>
                            </span>
                            <?php endif; ?>
                        </div>
                        
                        <?php if (!empty($booking->starting_location)) : ?>
                        <p class="yatra-trip-location">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <?php echo esc_html($booking->starting_location); ?>
                            <?php if (!empty($booking->ending_location) && $booking->ending_location !== $booking->starting_location) : ?>
                                → <?php echo esc_html($booking->ending_location); ?>
                            <?php endif; ?>
                        </p>
                        <?php endif; ?>

                        <?php if (!empty($booking->trip_destinations_list)) : ?>
                        <div class="yatra-trip-tags">
                            <span class="yatra-tag-label"><?php esc_html_e('Destinations:', 'yatra'); ?></span>
                            <div class="yatra-tag-group">
                                <?php foreach ($booking->trip_destinations_list as $destination) : ?>
                                    <span class="yatra-tag-item"><?php echo esc_html($destination); ?></span>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        <?php endif; ?>

                        <?php if (!empty($booking->trip_activities_list)) : ?>
                        <div class="yatra-trip-tags">
                            <span class="yatra-tag-label"><?php esc_html_e('Activities:', 'yatra'); ?></span>
                            <div class="yatra-tag-group">
                                <?php foreach ($booking->trip_activities_list as $activity) : ?>
                                    <span class="yatra-tag-item"><?php echo esc_html($activity); ?></span>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        <?php endif; ?>

                        <?php if (!empty($booking->trip_categories_list)) : ?>
                        <div class="yatra-trip-tags">
                            <span class="yatra-tag-label"><?php esc_html_e('Trip Type:', 'yatra'); ?></span>
                            <div class="yatra-tag-group">
                                <?php foreach ($booking->trip_categories_list as $category) : ?>
                                    <span class="yatra-tag-item"><?php echo esc_html($category); ?></span>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Booking Details -->
            <div class="yatra-confirmation-grid">
                <!-- Left Column -->
                <div class="yatra-confirmation-column">
                    <!-- Booking Info Card -->
                    <div class="yatra-confirmation-card">
                        <h3 class="yatra-card-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <?php esc_html_e('Booking Information', 'yatra'); ?>
                        </h3>
                        
                        <div class="yatra-info-grid">
                            <div class="yatra-info-item">
                                <span class="yatra-info-label"><?php esc_html_e('Status', 'yatra'); ?></span>
                                <span class="yatra-info-value">
                                    <span class="yatra-status-badge" style="background: <?php echo esc_attr($status_style['bg']); ?>; color: <?php echo esc_attr($status_style['text']); ?>;">
                                        <?php echo esc_html($status_style['label']); ?>
                                    </span>
                                </span>
                            </div>
                            <div class="yatra-info-item">
                                <span class="yatra-info-label"><?php esc_html_e('Travel Date', 'yatra'); ?></span>
                                <span class="yatra-info-value"><?php echo esc_html($travel_date_formatted); ?></span>
                            </div>
                            <div class="yatra-info-item">
                                <span class="yatra-info-label"><?php esc_html_e('Number of Travelers', 'yatra'); ?></span>
                                <span class="yatra-info-value"><?php echo esc_html($booking->travelers_count); ?></span>
                            </div>
                            <div class="yatra-info-item">
                                <span class="yatra-info-label"><?php esc_html_e('Booked On', 'yatra'); ?></span>
                                <span class="yatra-info-value"><?php echo esc_html($booking_date_formatted); ?></span>
                            </div>
                        </div>
                    </div>

                    <!-- Travelers Card -->
                    <?php if (!empty($booking->travelers)) : ?>
                    <div class="yatra-confirmation-card">
                        <h3 class="yatra-card-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <?php esc_html_e('Travelers', 'yatra'); ?>
                        </h3>
                        
                        <div class="yatra-travelers-list">
                            <?php foreach ($booking->travelers as $index => $traveler) : 
                                $traveler_name = trim(($traveler['first_name'] ?? '') . ' ' . ($traveler['last_name'] ?? ''));
                            ?>
                            <div class="yatra-traveler-item">
                                <span class="yatra-traveler-number"><?php echo esc_html($index + 1); ?></span>
                                <div class="yatra-traveler-details">
                                    <span class="yatra-traveler-name">
                                        <?php echo esc_html($traveler_name ?: __('Traveler', 'yatra') . ' ' . ($index + 1)); ?>
                                    </span>
                                    <?php if (!empty($traveler['date_of_birth'])) : ?>
                                    <span class="yatra-traveler-dob">
                                        <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($traveler['date_of_birth']))); ?>
                                    </span>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>

                    <?php
                    // Allow gateways to inject cards (e.g., Bank Transfer instructions)
                    do_action('yatra_booking_confirmation_after_details', $booking);
                    ?>
                </div>

                <!-- Right Column -->
                <div class="yatra-confirmation-column">
                    <!-- Payment Summary Card -->
                    <div class="yatra-confirmation-card yatra-payment-card">
                        <h3 class="yatra-card-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            <?php esc_html_e('Payment Summary', 'yatra'); ?>
                        </h3>
                        
                        <div class="yatra-payment-rows">
                            <?php 
                            // Calculate gross amount (total before discount)
                            $gross_amount = $booking->total_amount + ($booking->discount_amount ?? 0);
                            ?>
                            <div class="yatra-payment-row">
                                <span><?php esc_html_e('Total Amount', 'yatra'); ?></span>
                                <span><?php echo esc_html(yatra_format_price($gross_amount)); ?></span>
                            </div>
                            
                            <?php if (!empty($booking->discount_amount) && $booking->discount_amount > 0) : ?>
                            <div class="yatra-payment-row yatra-discount-row">
                                <span><?php esc_html_e('Group Discount', 'yatra'); ?></span>
                                <span style="color: #059669; font-weight: 500;">-<?php echo esc_html(yatra_format_price($booking->discount_amount)); ?></span>
                            </div>
                            <?php endif; ?>
                            
                            <div class="yatra-payment-row">
                                <span><?php esc_html_e('Net Amount', 'yatra'); ?></span>
                                <span><?php echo esc_html(yatra_format_price($booking->total_amount)); ?></span>
                            </div>
                            
                            <?php if (($booking->amount_paid ?? 0) > 0) : ?>
                            <div class="yatra-payment-row">
                                <span><?php esc_html_e('Amount Paid', 'yatra'); ?></span>
                                <span><?php echo esc_html(yatra_format_price($booking->amount_paid)); ?></span>
                            </div>
                            <?php endif; ?>
                            
                            <?php if ($booking->amount_due > 0) : ?>
                            <div class="yatra-payment-row yatra-due-row">
                                <span><?php esc_html_e('Amount Due', 'yatra'); ?></span>
                                <span><?php echo esc_html(yatra_format_price($booking->amount_due)); ?></span>
                            </div>
                            <?php endif; ?>
                        </div>
                        
                        <div class="yatra-payment-method">
                            <span class="yatra-pm-label"><?php esc_html_e('Payment Method:', 'yatra'); ?></span>
                            <span class="yatra-pm-value"><?php echo esc_html(ucwords(str_replace('_', ' ', $booking->payment_gateway))); ?></span>
                        </div>
                    </div>

                    <!-- Contact Info Card -->
                    <div class="yatra-confirmation-card">
                        <h3 class="yatra-card-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <?php esc_html_e('Contact Information', 'yatra'); ?>
                        </h3>
                        
                        <div class="yatra-contact-info">
                            <?php 
                            $contact_name = trim(($booking->contact['first_name'] ?? $booking->contact_first_name ?? '') . ' ' . ($booking->contact['last_name'] ?? $booking->contact_last_name ?? ''));
                            ?>
                            <?php if ($contact_name) : ?>
                            <p class="yatra-contact-item">
                                <strong><?php esc_html_e('Name:', 'yatra'); ?></strong>
                                <?php echo esc_html($contact_name); ?>
                            </p>
                            <?php endif; ?>
                            
                            <p class="yatra-contact-item">
                                <strong><?php esc_html_e('Email:', 'yatra'); ?></strong>
                                <?php echo esc_html($booking->contact_email); ?>
                            </p>
                            
                            <p class="yatra-contact-item">
                                <strong><?php esc_html_e('Phone:', 'yatra'); ?></strong>
                                <?php echo esc_html($booking->contact_phone); ?>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- What's Next Section -->
            <div class="yatra-confirmation-card yatra-whats-next">
                <h3 class="yatra-card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 16 16 12 12 8"></polyline>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <?php esc_html_e("What's Next?", 'yatra'); ?>
                </h3>
                
                <div class="yatra-next-steps">
                    <div class="yatra-step">
                        <span class="yatra-step-number">1</span>
                        <div class="yatra-step-content">
                            <h4><?php esc_html_e('Check Your Email', 'yatra'); ?></h4>
                            <p><?php esc_html_e('We\'ve sent a confirmation email with all the details to your registered email address.', 'yatra'); ?></p>
                        </div>
                    </div>
                    
                    <div class="yatra-step">
                        <span class="yatra-step-number">2</span>
                        <div class="yatra-step-content">
                            <h4><?php esc_html_e('Detailed Itinerary', 'yatra'); ?></h4>
                            <p><?php esc_html_e('You\'ll receive a detailed itinerary and preparation guide within 24-48 hours.', 'yatra'); ?></p>
                        </div>
                    </div>
                    
                    <div class="yatra-step">
                        <span class="yatra-step-number">3</span>
                        <div class="yatra-step-content">
                            <h4><?php esc_html_e('Prepare for Adventure', 'yatra'); ?></h4>
                            <p><?php esc_html_e('Ensure all travelers have valid passports (with 6+ months validity) and any required visas.', 'yatra'); ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="yatra-confirmation-actions">
                <a href="<?php echo esc_url(home_url('/')); ?>" class="yatra-btn yatra-btn-secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <?php esc_html_e('Return to Home', 'yatra'); ?>
                </a>
                
                <?php 
                // Get latest payment for this booking to enable invoice download
                $paymentRepository = new \Yatra\Repositories\PaymentRepository();
                $latestPayment = $paymentRepository->findLatestByBookingId((int) $booking->id);
                if ($latestPayment && in_array($latestPayment->status, ['completed', 'paid'], true)) : 
                ?>
                <a href="<?php echo esc_url(rest_url('yatra/v1/payment/' . $latestPayment->id . '/invoice')); ?>" 
                   target="_blank" 
                   class="yatra-btn yatra-btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <?php esc_html_e('Download Invoice', 'yatra'); ?>
                </a>
                <?php endif; ?>
                
                <button onclick="window.print();" class="yatra-btn yatra-btn-outline">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    <?php esc_html_e('Print Confirmation', 'yatra'); ?>
                </button>
            </div>

        </div>
    </div>
</div>

<style>
/* Confirmation Page Styles */
.yatra-confirmation-wrapper {
    max-width: 1300px;
    margin: 0 auto;
    padding: 40px 20px;
}

.yatra-confirmation-container {
    max-width: 900px;
    margin: 0 auto;
}

.yatra-confirmation-header {
    text-align: center;
    margin-bottom: 40px;
}

.yatra-confirmation-icon {
    width: 100px;
    height: 100px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.5s ease-out;
}

.yatra-confirmation-icon svg {
    width: 50px;
    height: 50px;
    color: white;
}

@keyframes scaleIn {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
}

.yatra-confirmation-title {
    font-size: 36px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 12px;
}

.yatra-confirmation-subtitle {
    font-size: 18px;
    color: #6b7280;
    margin: 0 0 24px;
}

.yatra-confirmation-reference {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: #f3f4f6;
    padding: 12px 24px;
    border-radius: 100px;
}

.yatra-ref-label {
    color: #6b7280;
    font-size: 14px;
}

.yatra-ref-code {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    font-family: monospace;
    letter-spacing: 1px;
}

.yatra-confirmation-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
}

.yatra-card-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
}

.yatra-card-title svg {
    width: 22px;
    height: 22px;
    color: #3b82f6;
}

.yatra-trip-summary-card {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-color: #bfdbfe;
}

.yatra-trip-summary {
    display: flex;
    gap: 24px;
    align-items: center;
}

.yatra-trip-image {
    width: 120px;
    height: 120px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
}

.yatra-trip-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.yatra-trip-name {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 12px;
}

.yatra-trip-meta {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 8px;
}

.yatra-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #4b5563;
}

.yatra-meta-item svg {
    width: 16px;
    height: 16px;
}

.yatra-trip-location {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #6b7280;
    margin: 0;
}

.yatra-trip-location svg {
    width: 16px;
    height: 16px;
}

.yatra-confirmation-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

@media (max-width: 768px) {
    .yatra-confirmation-grid {
        grid-template-columns: 1fr;
    }
    
    .yatra-trip-summary {
        flex-direction: column;
        text-align: center;
    }
}

.yatra-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.yatra-info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.yatra-info-label {
    font-size: 13px;
    color: #6b7280;
}

.yatra-info-value {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
}

.yatra-status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
}

.yatra-travelers-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.yatra-traveler-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
}

.yatra-traveler-number {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    font-size: 13px;
    font-weight: 600;
}

.yatra-traveler-name {
    font-weight: 600;
    color: #111827;
}

.yatra-traveler-dob {
    font-size: 13px;
    color: #6b7280;
}

.yatra-payment-card {
    background: #fafafa;
}

.yatra-payment-rows {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
}

.yatra-payment-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
}

.yatra-payment-row:last-child {
    border-bottom: none;
    background: #111827;
    color: white;
    font-weight: 600;
}

.yatra-discount-row span:last-child {
    color: #22c55e;
}

.yatra-payment-method {
    margin-top: 16px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
}

.yatra-pm-label {
    color: #6b7280;
}

.yatra-pm-value {
    font-weight: 600;
    color: #111827;
}

.yatra-contact-info p {
    margin: 0 0 8px;
}

.yatra-whats-next {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-color: #bbf7d0;
}

.yatra-next-steps {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.yatra-step {
    display: flex;
    gap: 16px;
}

.yatra-step-number {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #22c55e;
    color: white;
    border-radius: 50%;
    font-weight: 600;
    flex-shrink: 0;
}

.yatra-step-content h4 {
    margin: 0 0 4px;
    font-size: 16px;
    color: #111827;
}

.yatra-step-content p {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
}

.yatra-confirmation-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 32px;
}

.yatra-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.yatra-btn svg {
    width: 18px;
    height: 18px;
}

.yatra-btn-secondary {
    background: #3b82f6;
    color: white;
}

.yatra-btn-secondary:hover {
    background: #2563eb;
}

.yatra-btn-outline {
    background: white;
    color: #374151;
    border: 2px solid #e5e7eb;
}

.yatra-btn-outline:hover {
    border-color: #3b82f6;
    color: #3b82f6;
}

/* Print Styles */
@media print {
    .yatra-confirmation-actions {
        display: none;
    }
    
    .yatra-confirmation-wrapper {
        padding: 0;
    }
}
</style>

<?php get_footer(); ?>

