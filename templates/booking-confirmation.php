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

// Completed booking: ensure checkout session and its transient cannot repopulate the booking form.
if (function_exists('yatra_clear_booking_session')) {
    yatra_clear_booking_session();
}

// Format dates
$travel_date_formatted = \Yatra\Helpers\FormatHelper::formatDate((string) ($booking->travel_date ?? ''));
$booking_date_formatted = \Yatra\Helpers\FormatHelper::formatDateTime((string) ($booking->created_at ?? ''));

// "Balance just paid" context detection.
// A `?balance=paid` query arg is appended by the remaining-payment flows
// (see PaymentGatewayController::create_remaining_balance_intent and
// BookingSessionController::process_remaining_payment). We only render the
// "balance paid" copy when BOTH the flag is present AND the booking actually
// reports a paid status — that way a stale bookmarked URL or a tampered
// query string can't show misleading content if a balance is still due.
$is_balance_paid_request = isset($_GET['balance']) && sanitize_key((string) $_GET['balance']) === 'paid';
$booking_payment_status = (string) ($booking->payment_status ?? '');
$booking_amount_due = (float) ($booking->amount_due ?? 0);
$booking_is_fully_paid = $booking_payment_status === 'paid' || $booking_amount_due <= 0.01;
$show_balance_paid_banner = $is_balance_paid_request && $booking_is_fully_paid;

// Resolve the most recent gateway used on this booking.
// `$booking->payment_gateway` is the *initial* method chosen at booking time
// (e.g. Pay Later), which is misleading when the customer later settled the
// balance via a different gateway (e.g. Stripe). Show the latest payment's
// gateway in the Payment Method line; fall back to the booking's stored
// gateway when no payment row exists yet.
$display_payment_gateway = (string) ($booking->payment_gateway ?? '');
if (!empty($booking->id)) {
    try {
        $latest_payment = (new \Yatra\Repositories\PaymentRepository())->findLatestByBookingId((int) $booking->id);
        if ($latest_payment) {
            $latest_gateway = (string) ($latest_payment->payment_gateway ?? $latest_payment->gateway ?? '');
            if ($latest_gateway !== '') {
                $display_payment_gateway = $latest_gateway;
            }
        }
    } catch (\Throwable $e) {
        // Repository unavailable for some reason — keep the booking's stored gateway.
    }
}

// Resolved customer account URL (configurable via Settings → Permalink → Account base).
$yatra_account_url = home_url('/' . \Yatra\Services\SettingsService::getAccountBase());

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

// Ensure Font Awesome CSS is available for icon-picker rendered icons (fa-solid/fa-regular).
// This template can be displayed outside normal "trip page" contexts, so we explicitly
// register/enqueue the shared stylesheet dependencies before printing the header.
if (class_exists(\Yatra\Providers\FrontendAssetsProvider::class)) {
    \Yatra\Providers\FrontendAssetsProvider::registerCoreFrontendStylesheets();
    if (wp_style_is('yatra-fontawesome-6', 'registered')) {
        wp_enqueue_style('yatra-fontawesome-6');
    }
    if (wp_style_is('yatra-common', 'registered')) {
        wp_enqueue_style('yatra-common');
    }
}

yatra_get_header();

// Hook for Pro modules to add custom scripts (Facebook Pixel, etc.)
do_action('yatra_booking_confirmation_header', $booking);
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
                if ($show_balance_paid_banner) {
                    esc_html_e('Balance Paid!', 'yatra');
                } elseif ($booking->status === 'confirmed') {
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
                if ($show_balance_paid_banner) {
                    esc_html_e('Your remaining balance has been received. This booking is now fully paid.', 'yatra');
                } elseif ($booking->status === 'confirmed') {
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

        <?php if ($show_balance_paid_banner) : ?>
            <div class="yatra-balance-paid-banner" role="status" aria-live="polite" style="margin: 16px 0; padding: 14px 18px; background: #d1fae5; border: 1px solid #6ee7b7; border-left: 4px solid #059669; border-radius: 8px; color: #065f46; display: flex; gap: 12px; align-items: flex-start;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex: 0 0 22px; width: 22px; height: 22px; margin-top: 1px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div style="flex: 1; line-height: 1.45;">
                    <strong style="display: block; margin-bottom: 2px;">
                        <?php esc_html_e('Balance payment received.', 'yatra'); ?>
                    </strong>
                    <span>
                        <?php
                        printf(
                            /* translators: 1: booking reference number (HTML <strong> wrapped), 2: link labelled "payment history" pointing to the customer account page (HTML <a> wrapped) */
                            wp_kses(
                                __('You\'ve completed payment for booking %1$s. A receipt has been emailed to you. View or download your %2$s anytime from your account.', 'yatra'),
                                ['a' => ['href' => true], 'strong' => []]
                            ),
                            '<strong>' . esc_html((string) ($booking->reference ?? '')) . '</strong>',
                            '<a href="' . esc_url(add_query_arg('tab', 'payments', $yatra_account_url)) . '">' . esc_html__('payment history', 'yatra') . '</a>'
                        );
                        ?>
                    </span>
                </div>
            </div>
        <?php endif; ?>

        <?php
        // Resolve featured image URL (handle attachment ID or direct URL)
        $featured_image_url = '';
        if (!empty($booking->featured_image)) {
            if (is_numeric($booking->featured_image)) {
                $featured_image_url = wp_get_attachment_url((int) $booking->featured_image) ?: '';
            } else {
                $featured_image_url = $booking->featured_image;
            }
        }
        ?>

        <div class="yatra-confirmation-content">
            <!-- Trip Summary Card -->
            <div class="yatra-confirmation-card yatra-trip-summary-card">
                <div class="yatra-trip-summary">
                    <?php if (!empty($featured_image_url)) : ?>
                    <div class="yatra-trip-image">
                        <img src="<?php echo esc_url($featured_image_url); ?>" alt="<?php echo esc_attr($booking->trip_title); ?>">
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
                                <?php
                                $days = (int) ($booking->duration_days ?? 0);
                                $nights = (int) ($booking->duration_nights ?? 0);

                                if ($days > 0 && $nights > 0) {
                                    printf(
                                        esc_html__('%d Days / %d Nights', 'yatra'),
                                        $days,
                                        $nights
                                    );
                                } elseif ($days > 0) {
                                    printf(
                                        /* translators: %d day count */
                                        esc_html(_n('%d Day', '%d Days', $days, 'yatra')),
                                        $days
                                    );
                                } elseif ($nights > 0) {
                                    printf(
                                        /* translators: %d night count */
                                        esc_html(_n('%d Night', '%d Nights', $nights, 'yatra')),
                                        $nights
                                    );
                                }
                                ?>
                            </span>
                            <?php endif; ?>
                            
                            <?php if (!empty($booking->difficulty_level)) : ?>
                            <span class="yatra-meta-item">
                                <?php
                                $difficulty = \Yatra\Models\Trip::resolveDifficultyDisplay(
                                    (string) $booking->difficulty_level
                                );

                                // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                                echo yatra_stored_picker_icon_markup(
                                    $difficulty['icon_picker'] ?? null,
                                    '',
                                    'yatra-icon-sm'
                                );

                                echo esc_html($difficulty['level'] ?? (string) $booking->difficulty_level);
                                ?>
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

                        <?php if (!empty($booking->trip_attributes_list)) : ?>
                        <div class="yatra-trip-tags">
                            <span class="yatra-tag-label"><?php esc_html_e('Features:', 'yatra'); ?></span>
                            <div class="yatra-tag-group">
                                <?php foreach ($booking->trip_attributes_list as $attribute) : ?>
                                    <span class="yatra-tag-item yatra-attribute-tag"><?php echo esc_html($attribute); ?></span>
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
                                        <?php echo esc_html(\Yatra\Helpers\FormatHelper::formatDate((string) $traveler['date_of_birth'])); ?>
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
                            // ── Raw figures from DB ───────────────────────────────────
                            $db_subtotal           = (float) ($booking->subtotal ?? $booking->total_amount);
                            $discount_amount       = (float) ($booking->discount_amount ?? 0);
                            $itinerary_costs_total = (float) ($booking->itinerary_costs_total ?? 0);
                            $tax_amount            = (float) ($booking->tax_amount ?? 0);
                            $tax_inclusive         = !empty($booking->tax_inclusive);
                            $total_amount          = (float) $booking->total_amount;
                            $amount_paid           = (float) ($booking->amount_paid ?? 0);
                            $amount_due            = (float) ($booking->amount_due ?? 0);

                            // ── Tax breakdown (built first so it can gate later rows) ─
                            $tax_breakdown = [];
                            if (!empty($booking->tax_details)) {
                                $taxes = json_decode($booking->tax_details, true) ?: [];
                                foreach ($taxes as $tax) {
                                    $tax_breakdown[] = [
                                        'name'   => $tax['name'] ?? __('Tax', 'yatra'),
                                        'rate'   => (float) ($tax['rate'] ?? 0),
                                        'amount' => (float) ($tax['amount'] ?? 0),
                                    ];
                                }
                            } elseif ($tax_amount > 0) {
                                $tax_breakdown[] = [
                                    'name'   => __('Tax', 'yatra'),
                                    'rate'   => (float) ($booking->tax_rate ?? 0),
                                    'amount' => $tax_amount,
                                ];
                            }

                            // ── Itinerary costs ───────────────────────────────────────
                            $itinerary_costs = [];
                            if (!empty($booking->itinerary_costs)) {
                                $itinerary_costs = json_decode($booking->itinerary_costs, true) ?: [];
                            }

                            // ── Additional services ───────────────────────────────────
                            $raw_services = apply_filters('yatra_booking_get_services', [], (int) ($booking->id ?? 0));
                            $selected_services = [];
                            if (!empty($raw_services) && is_array($raw_services)) {
                                foreach ($raw_services as $s) {
                                    $arr = is_array($s) ? $s : (array) $s;
                                    if (!isset($arr['selected']) || !empty($arr['selected'])) {
                                        $selected_services[] = $arr;
                                    }
                                }
                            }
                            $services_total = 0.0;
                            foreach ($selected_services as $s) {
                                $services_total += (float) ($s['total_price'] ?? $s['calculated_price'] ?? $s['total_cost'] ?? $s['amount'] ?? $s['unit_price'] ?? $s['price'] ?? 0);
                            }

                            // ── Derived amounts ───────────────────────────────────────
                            // base_trip_cost: the trip price without services (services are embedded in db_subtotal by Pro)
                            $base_trip_cost = $db_subtotal - $services_total;
                            // taxable_amount: what tax is calculated on
                            $taxable_amount = max(0.0, $db_subtotal - $discount_amount) + $itinerary_costs_total;

                            $has_services    = !empty($selected_services);
                            $has_discount    = $discount_amount > 0;
                            $has_itinerary   = !empty($itinerary_costs) && $itinerary_costs_total > 0;
                            $has_tax         = !empty($tax_breakdown);
                            $show_taxable_row = $has_tax && ($has_discount || $has_itinerary);
                            ?>

                            <!-- Trip Base Price (always the first line) -->
                            <div class="yatra-payment-row">
                                <span>
                                    <?php esc_html_e('Trip Base Price', 'yatra'); ?>
                                    <?php if ($tax_inclusive): ?>
                                        <span style="display:inline-flex;align-items:center;padding:1px 6px;border-radius:4px;font-size:0.72em;font-weight:600;background:#eff6ff;color:#1d4ed8;margin-left:5px;letter-spacing:0;">
                                            <?php esc_html_e('Tax Incl.', 'yatra'); ?>
                                        </span>
                                    <?php endif; ?>
                                </span>
                                <span><?php echo esc_html(yatra_format_price($base_trip_cost, $booking->currency)); ?></span>
                            </div>

                            <?php if ($has_services): ?>
                            <!-- Additional Services section header -->
                            <div class="yatra-payment-row" style="margin-top: 4px;">
                                <span style="font-size: 0.75em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">
                                    + <?php esc_html_e('Additional Services', 'yatra'); ?>
                                </span>
                                <span></span>
                            </div>
                            <!-- Service line items -->
                            <?php foreach ($selected_services as $svc): ?>
                                <?php
                                $svc_name   = $svc['service_name'] ?? $svc['name'] ?? $svc['title'] ?? $svc['label'] ?? __('Service', 'yatra');
                                $svc_amount = (float) ($svc['total_price'] ?? $svc['calculated_price'] ?? $svc['total_cost'] ?? $svc['amount'] ?? $svc['unit_price'] ?? $svc['price'] ?? 0);
                                ?>
                                <div class="yatra-payment-row" style="margin-left: 16px;">
                                    <span><?php echo esc_html($svc_name); ?></span>
                                    <span><?php echo esc_html(yatra_format_price($svc_amount, $booking->currency, false)); ?></span>
                                </div>
                            <?php endforeach; ?>
                            <!-- Gross Total = Trip Base Price + Services -->
                            <div class="yatra-payment-row" style="border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 6px;">
                                <span><strong><?php esc_html_e('Gross Total', 'yatra'); ?></strong></span>
                                <span><strong><?php echo esc_html(yatra_format_price($db_subtotal, $booking->currency)); ?></strong></span>
                            </div>
                            <?php endif; ?>

                            <?php if ($has_discount): ?>
                            <!-- Discount -->
                            <div class="yatra-payment-row">
                                <span><?php esc_html_e('Discount', 'yatra'); ?></span>
                                <span style="color: #059669; font-weight: 500;">-<?php echo esc_html(yatra_format_price($discount_amount, $booking->currency)); ?></span>
                            </div>
                            <?php endif; ?>

                            <?php if ($has_itinerary): ?>
                            <!-- Itinerary costs header -->
                            <div class="yatra-payment-row" style="margin-top: 4px;">
                                <span><strong><?php esc_html_e('Itinerary Costs', 'yatra'); ?></strong></span>
                                <span></span>
                            </div>
                            <?php foreach ($itinerary_costs as $cost): ?>
                            <div class="yatra-payment-row" style="margin-left: 20px;">
                                <span>
                                    <?php echo esc_html($cost['name']); ?>
                                    <?php if (!empty($cost['price_per'])): ?>
                                        <small style="opacity: 0.65;">
                                        <?php
                                        if ($cost['price_per'] === 'person') {
                                            esc_html_e('(per person)', 'yatra');
                                        } elseif ($cost['price_per'] === 'group') {
                                            esc_html_e('(per booking)', 'yatra');
                                        } else {
                                            esc_html_e('(flat rate)', 'yatra');
                                        }
                                        ?>
                                        </small>
                                    <?php endif; ?>
                                </span>
                                <span><?php echo esc_html(yatra_format_price($cost['total_cost'] ?? $cost['price'], $booking->currency)); ?></span>
                            </div>
                            <?php endforeach; ?>
                            <?php endif; ?>

                            <?php if (!$tax_inclusive && $show_taxable_row): ?>
                            <!-- Taxable Amount (only for exclusive tax when there are deductions above it) -->
                            <div class="yatra-payment-row" style="border-top: 1px dashed #e5e7eb; margin-top: 8px; padding-top: 8px;">
                                <span><strong><?php esc_html_e('Taxable Amount', 'yatra'); ?></strong></span>
                                <span><strong><?php echo esc_html(yatra_format_price($taxable_amount, $booking->currency)); ?></strong></span>
                            </div>
                            <?php endif; ?>

                            <?php if ($has_tax && !$tax_inclusive): ?>
                            <!-- Exclusive tax: shown as an addition before Net Amount -->
                            <div class="yatra-payment-row" style="margin-top: 4px;">
                                <span style="font-size: 0.75em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">
                                    + <?php esc_html_e('Tax', 'yatra'); ?>
                                </span>
                                <span></span>
                            </div>
                            <?php foreach ($tax_breakdown as $tax): ?>
                            <div class="yatra-payment-row" style="margin-left: 16px;">
                                <span>
                                    <?php echo esc_html($tax['name']); ?>
                                    <?php if ($tax['rate'] > 0): ?>
                                        (<?php echo esc_html($tax['rate']); ?>%)
                                    <?php endif; ?>
                                </span>
                                <span>+<?php echo esc_html(yatra_format_price($tax['amount'], $booking->currency)); ?></span>
                            </div>
                            <?php endforeach; ?>
                            <?php endif; ?>

                            <!-- Net Amount -->
                            <div class="yatra-payment-row" style="border-top: 2px solid #111827; margin-top: 10px; padding-top: 10px;">
                                <span style="font-size: 1.05em;"><strong><?php esc_html_e('Net Amount', 'yatra'); ?></strong></span>
                                <span style="font-size: 1.05em;"><strong><?php echo esc_html(yatra_format_price($total_amount, $booking->currency)); ?></strong></span>
                            </div>

                            <?php if ($has_tax && $tax_inclusive): ?>
                            <!-- Inclusive tax: shown as an informational footnote after Net Amount -->
                            <?php foreach ($tax_breakdown as $tax): ?>
                            <div class="yatra-payment-row" style="margin-top: 4px; opacity: 0.7;">
                                <span style="font-size: 0.85em; font-style: italic;">
                                    <?php
                                    printf(
                                        /* translators: %1$s = tax name, %2$s = rate, %3$s = amount */
                                        esc_html__('Incl. %1$s%2$s: %3$s', 'yatra'),
                                        esc_html($tax['name']),
                                        $tax['rate'] > 0 ? ' (' . esc_html($tax['rate']) . '%)' : '',
                                        esc_html(yatra_format_price($tax['amount'], $booking->currency))
                                    );
                                    ?>
                                </span>
                                <span></span>
                            </div>
                            <?php endforeach; ?>
                            <?php endif; ?>

                            <?php if ($amount_paid > 0): ?>
                            <div class="yatra-payment-row" style="margin-top: 6px;">
                                <span><?php esc_html_e('Amount Paid', 'yatra'); ?></span>
                                <span style="color: #059669;"><?php echo esc_html(yatra_format_price($amount_paid, $booking->currency)); ?></span>
                            </div>
                            <?php endif; ?>

                            <?php if ($amount_due > 0): ?>
                            <div class="yatra-payment-row yatra-due-row">
                                <span><strong><?php esc_html_e('Due Now', 'yatra'); ?></strong></span>
                                <span><strong><?php echo esc_html(yatra_format_price($amount_due, $booking->currency)); ?></strong></span>
                            </div>
                            <?php endif; ?>
                        </div>
                        
                        <div class="yatra-payment-method">
                            <span class="yatra-pm-label"><?php esc_html_e('Payment Method:', 'yatra'); ?></span>
                            <span class="yatra-pm-value"><?php echo esc_html(ucwords(str_replace('_', ' ', (string) $display_payment_gateway))); ?></span>
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
                            // Try to get contact data from multiple sources
                            $contact_data = [];
                            if (!empty($booking->contact_data)) {
                                $contact_data = json_decode($booking->contact_data, true) ?: [];
                            }
                            
                            $contact_name = trim((
                                $contact_data['first_name'] ?? 
                                $booking->contact_first_name ?? 
                                ($booking->contact['first_name'] ?? '')
                            ) . ' ' . (
                                $contact_data['last_name'] ?? 
                                $booking->contact_last_name ?? 
                                ($booking->contact['last_name'] ?? '')
                            ));
                            
                            $contact_email = $contact_data['email'] ?? $booking->contact_email ?? ($booking->contact['email'] ?? '');
                            $contact_phone = $contact_data['phone'] ?? $booking->contact_phone ?? ($booking->contact['phone'] ?? '');
                            ?>
                            
                            <?php if ($contact_name) : ?>
                            <p class="yatra-contact-item">
                                <strong><?php esc_html_e('Name:', 'yatra'); ?></strong>
                                <?php echo esc_html($contact_name); ?>
                            </p>
                            <?php endif; ?>
                            
                            <?php if ($contact_email) : ?>
                            <p class="yatra-contact-item">
                                <strong><?php esc_html_e('Email:', 'yatra'); ?></strong>
                                <?php echo esc_html($contact_email); ?>
                            </p>
                            <?php endif; ?>
                            
                            <?php if ($contact_phone) : ?>
                            <p class="yatra-contact-item">
                                <strong><?php esc_html_e('Phone:', 'yatra'); ?></strong>
                                <?php echo esc_html($contact_phone); ?>
                            </p>
                            <?php endif; ?>
                            
                            <?php if (!$contact_name && !$contact_email && !$contact_phone) : ?>
                            <p class="yatra-contact-item">
                                <em><?php esc_html_e('Contact information not available', 'yatra'); ?></em>
                            </p>
                            <?php endif; ?>
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
                            <p><?php esc_html_e('Ensure all travelers have valid ID or travel documents and any required visas for your destination.', 'yatra'); ?></p>
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
                // Get latest payment for this booking to enable invoice download.
                // The invoice endpoint authorises via: admin → owner → signed invoice_token → guest booking_token.
                // We always issue a signed invoice_token here so the link works for guests
                // (no session required) AND for logged-in users who don't own the booking
                // (e.g. site admins viewing the page) — without re-checking login on the client.
                $paymentRepository = new \Yatra\Repositories\PaymentRepository();
                $latestPayment = $paymentRepository->findLatestByBookingId((int) $booking->id);
                if ($latestPayment && in_array($latestPayment->status, ['completed', 'paid'], true)) :
                    $invoiceToken = \Yatra\Controllers\PaymentGatewayController::issueInvoiceToken(
                        (int) $latestPayment->id,
                        (int) ($latestPayment->booking_id ?? $booking->id)
                    );
                    $invoiceUrl = add_query_arg(
                        [
                            'download' => '1',
                            'invoice_token' => $invoiceToken,
                        ],
                        rest_url('yatra/v1/payment/' . (int) $latestPayment->id . '/invoice')
                    );
                ?>
                <a href="<?php echo esc_url($invoiceUrl); ?>" 
                   target="_blank" 
                   rel="noopener"
                   class="yatra-btn yatra-btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <?php esc_html_e('Download Invoice', 'yatra'); ?>
                </a>
                <?php endif; ?>
                
                <button type="button" data-yatra-print="confirmation" class="yatra-btn yatra-btn-outline">
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

    .yatra-info-grid {
        grid-template-columns: 1fr;
        gap: 12px;
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
    padding: 12px 14px;
    background: #f9fafb;
    border: 1px solid #eef2f7;
    border-radius: 12px;
}

.yatra-info-label {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.2;
}

.yatra-info-value {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    line-height: 1.25;
    text-align: left;
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

/* =====================================================================
   Print Styles — produce a clean, single-page-friendly receipt.
   Triggered by the print button (adds .yatra-printing-confirmation
   to <body> + clones the confirmation card into .yatra-print-root).
   ===================================================================== */
@media print {
    @page {
        size: A4;
        margin: 9mm 10mm;
    }

    /* Force browsers to print our colors / borders */
    body.yatra-printing-confirmation,
    body.yatra-printing-confirmation * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
    }

    /* Reset body, kill animations & transitions */
    body.yatra-printing-confirmation {
        background: #fff !important;
        color: #111827 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Helvetica, Arial, sans-serif !important;
        font-size: 10pt !important;
        line-height: 1.45 !important;
    }
    body.yatra-printing-confirmation *,
    body.yatra-printing-confirmation *::before,
    body.yatra-printing-confirmation *::after {
        animation: none !important;
        transition: none !important;
        box-shadow: none !important;
        text-shadow: none !important;
    }

    /* Hide everything except our cloned print root */
    body.yatra-printing-confirmation > *:not(.yatra-print-root) {
        display: none !important;
    }
    body.yatra-printing-confirmation .yatra-print-root,
    body.yatra-printing-confirmation .yatra-print-root * {
        visibility: visible;
    }
    body.yatra-printing-confirmation .yatra-print-root {
        position: static !important;
        left: auto;
        top: auto;
        width: 100%;
        margin: 0;
        padding: 0;
    }

    /* Wrappers — remove screen padding/widths */
    body.yatra-printing-confirmation .yatra-confirmation-wrapper,
    body.yatra-printing-confirmation .yatra-confirmation-container {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    /* Hide things that don't belong on paper */
    body.yatra-printing-confirmation .yatra-confirmation-actions,
    body.yatra-printing-confirmation .yatra-no-print,
    body.yatra-printing-confirmation .yatra-whats-next,
    body.yatra-printing-confirmation .yatra-trip-rating {
        display: none !important;
    }

    /* Confirmation header — compact, two-column with status icon left & ref right */
    body.yatra-printing-confirmation .yatra-confirmation-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 16pt !important;
        text-align: left !important;
        margin: 0 0 8pt !important;
        padding: 0 0 6pt !important;
        border-bottom: 1pt solid #111827 !important;
    }
    body.yatra-printing-confirmation .yatra-confirmation-icon {
        width: 28pt !important;
        height: 28pt !important;
        margin: 0 !important;
        background: #16a34a !important;
        flex-shrink: 0 !important;
    }
    body.yatra-printing-confirmation .yatra-confirmation-icon svg {
        width: 16pt !important;
        height: 16pt !important;
    }
    body.yatra-printing-confirmation .yatra-confirmation-title {
        font-size: 14pt !important;
        font-weight: 700 !important;
        margin: 0 !important;
        flex: 1 !important;
        color: #111827 !important;
    }
    body.yatra-printing-confirmation .yatra-confirmation-subtitle {
        display: none !important;
    }
    body.yatra-printing-confirmation .yatra-confirmation-reference {
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: flex-end !important;
        gap: 2pt !important;
        background: transparent !important;
        padding: 0 !important;
        border: none !important;
        border-radius: 0 !important;
    }
    body.yatra-printing-confirmation .yatra-ref-label {
        font-size: 8pt !important;
        text-transform: uppercase !important;
        letter-spacing: 0.4pt !important;
        color: #6b7280 !important;
    }
    body.yatra-printing-confirmation .yatra-ref-code {
        font-size: 11pt !important;
        font-weight: 700 !important;
        color: #111827 !important;
        letter-spacing: 0.6pt !important;
    }

    /* Cards — flat, thin border, never split across pages */
    body.yatra-printing-confirmation .yatra-confirmation-card {
        background: #fff !important;
        border: 0.75pt solid #d1d5db !important;
        border-radius: 3pt !important;
        padding: 8pt 10pt !important;
        margin: 0 0 6pt !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
    }
    body.yatra-printing-confirmation .yatra-trip-summary-card {
        background: #f9fafb !important;
        border-color: #d1d5db !important;
    }
    body.yatra-printing-confirmation .yatra-card-title {
        font-size: 10.5pt !important;
        font-weight: 700 !important;
        gap: 6pt !important;
        margin: 0 0 8pt !important;
        padding: 0 0 5pt !important;
        border-bottom: 0.5pt solid #e5e7eb !important;
        color: #111827 !important;
    }
    body.yatra-printing-confirmation .yatra-card-title svg {
        width: 12pt !important;
        height: 12pt !important;
        color: #111827 !important;
    }

    /* Trip summary — small image, tight spacing */
    body.yatra-printing-confirmation .yatra-trip-summary {
        gap: 10pt !important;
        align-items: flex-start !important;
    }
    /* Images often render as empty placeholders in print preview; hide for a cleaner receipt. */
    body.yatra-printing-confirmation .yatra-trip-image {
        display: none !important;
    }
    body.yatra-printing-confirmation .yatra-trip-name {
        font-size: 12pt !important;
        font-weight: 700 !important;
        margin: 0 0 4pt !important;
        color: #111827 !important;
    }
    body.yatra-printing-confirmation .yatra-trip-meta {
        font-size: 9pt !important;
        gap: 10pt !important;
        margin-bottom: 4pt !important;
        color: #374151 !important;
    }
    body.yatra-printing-confirmation .yatra-trip-meta svg,
    body.yatra-printing-confirmation .yatra-trip-location svg {
        width: 9pt !important;
        height: 9pt !important;
    }
    body.yatra-printing-confirmation .yatra-trip-location {
        font-size: 9pt !important;
        margin: 0 0 4pt !important;
        color: #374151 !important;
    }

    /* Tags — outline pills, no fills */
    body.yatra-printing-confirmation .yatra-trip-tags {
        font-size: 9pt !important;
        margin-top: 4pt !important;
    }
    body.yatra-printing-confirmation .yatra-tag-label {
        font-weight: 700 !important;
        color: #374151 !important;
        margin-right: 4pt !important;
    }
    body.yatra-printing-confirmation .yatra-tag-item {
        display: inline-block !important;
        background: #fff !important;
        border: 0.5pt solid #d1d5db !important;
        padding: 1pt 5pt !important;
        border-radius: 2pt !important;
        font-size: 8.5pt !important;
        color: #374151 !important;
        margin: 1pt 2pt 1pt 0 !important;
    }

    /* Two-column grid stays two columns on paper */
    body.yatra-printing-confirmation .yatra-confirmation-grid {
        display: grid !important;
        grid-template-columns: 1.15fr 0.85fr !important;
        gap: 6pt !important;
        align-items: start !important;
    }
    body.yatra-printing-confirmation .yatra-confirmation-column {
        min-width: 0 !important;
    }

    /* Booking info grid */
    body.yatra-printing-confirmation .yatra-info-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 5pt 9pt !important;
    }
    body.yatra-printing-confirmation .yatra-info-item {
        display: flex !important;
        flex-direction: column !important;
        gap: 1pt !important;
    }
    body.yatra-printing-confirmation .yatra-info-label {
        font-size: 7.5pt !important;
        text-transform: uppercase !important;
        letter-spacing: 0.3pt !important;
        color: #6b7280 !important;
    }
    body.yatra-printing-confirmation .yatra-info-value {
        font-size: 10pt !important;
        font-weight: 600 !important;
        color: #111827 !important;
    }
    body.yatra-printing-confirmation .yatra-status-badge {
        display: inline-block !important;
        padding: 1pt 6pt !important;
        border: 0.75pt solid currentColor !important;
        border-radius: 2pt !important;
        font-size: 8.5pt !important;
        font-weight: 700 !important;
    }

    /* Travelers */
    body.yatra-printing-confirmation .yatra-travelers-list {
        margin: 0 !important;
    }
    body.yatra-printing-confirmation .yatra-traveler-item {
        display: flex !important;
        align-items: center !important;
        gap: 8pt !important;
        padding: 4pt 0 !important;
        border-bottom: 0.5pt solid #e5e7eb !important;
    }
    body.yatra-printing-confirmation .yatra-traveler-item:last-child {
        border-bottom: none !important;
    }
    body.yatra-printing-confirmation .yatra-traveler-number {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 16pt !important;
        height: 16pt !important;
        background: #111827 !important;
        color: #fff !important;
        border-radius: 50% !important;
        font-size: 8.5pt !important;
        font-weight: 700 !important;
        flex-shrink: 0 !important;
    }
    body.yatra-printing-confirmation .yatra-traveler-name {
        font-size: 10pt !important;
        font-weight: 600 !important;
        color: #111827 !important;
    }
    body.yatra-printing-confirmation .yatra-traveler-dob {
        font-size: 8.5pt !important;
        color: #6b7280 !important;
    }

    /* Payment summary rows */
    body.yatra-printing-confirmation .yatra-payment-rows {
        margin: 0 !important;
    }
    body.yatra-printing-confirmation .yatra-payment-row {
        display: flex !important;
        justify-content: space-between !important;
        align-items: baseline !important;
        gap: 12pt !important;
        font-size: 9.25pt !important;
        padding: 1.5pt 0 !important;
        color: #111827 !important;
    }
    body.yatra-printing-confirmation .yatra-due-row {
        background: #fef3c7 !important;
        padding: 4pt 6pt !important;
        margin-top: 5pt !important;
        border-radius: 2pt !important;
        border: 0.5pt solid #fbbf24 !important;
    }
    body.yatra-printing-confirmation .yatra-payment-method {
        margin-top: 6pt !important;
        padding-top: 5pt !important;
        font-size: 9pt !important;
        border-top: 0.5pt solid #e5e7eb !important;
        color: #374151 !important;
    }

    /* Contact info */
    body.yatra-printing-confirmation .yatra-contact-info {
        margin: 0 !important;
    }
    body.yatra-printing-confirmation .yatra-contact-item {
        font-size: 9.5pt !important;
        margin: 0 0 3pt !important;
        color: #111827 !important;
    }
    body.yatra-printing-confirmation .yatra-contact-item strong {
        color: #6b7280 !important;
        font-weight: 600 !important;
        margin-right: 4pt !important;
    }

    /* Links — print as plain text, no underline (URL is still in browser footer) */
    body.yatra-printing-confirmation a,
    body.yatra-printing-confirmation a:visited {
        color: inherit !important;
        text-decoration: none !important;
    }

    /* Avoid orphan headings */
    body.yatra-printing-confirmation h1,
    body.yatra-printing-confirmation h2,
    body.yatra-printing-confirmation h3,
    body.yatra-printing-confirmation h4 {
        page-break-after: avoid !important;
        break-after: avoid !important;
    }
}
</style>

<script>
(function () {
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-yatra-print="confirmation"]');
        if (!btn) {
            return;
        }
        e.preventDefault();

        var card = document.querySelector('.yatra-confirmation-container');
        if (!card) {
            window.print();
            return;
        }

        // Wrap (or reuse) a print-only root so the @media print rules can target a single
        // direct child of <body>. Reused on the account page if the same data attribute
        // and CSS rules are added there.
        var root = document.querySelector('.yatra-print-root');
        var addedWrapper = false;
        if (!root) {
            root = document.createElement('div');
            root.className = 'yatra-print-root';
            document.body.appendChild(root);
            addedWrapper = true;
        }
        var clone = card.cloneNode(true);
        // Drop the action buttons from the clone so they don't appear on paper.
        clone.querySelectorAll('.yatra-confirmation-actions').forEach(function (n) { n.remove(); });
        root.innerHTML = '';
        root.appendChild(clone);

        document.body.classList.add('yatra-printing-confirmation');

        var cleanup = function () {
            document.body.classList.remove('yatra-printing-confirmation');
            if (addedWrapper && root && root.parentNode) {
                root.parentNode.removeChild(root);
            } else if (root) {
                root.innerHTML = '';
            }
            window.removeEventListener('afterprint', cleanup);
        };

        window.addEventListener('afterprint', cleanup);
        // Safety net for browsers that don't fire afterprint reliably.
        window.setTimeout(function () {
            if (document.body.classList.contains('yatra-printing-confirmation')) {
                cleanup();
            }
        }, 5000);

        window.print();
    });
})();
</script>

<?php yatra_get_footer(); ?>

