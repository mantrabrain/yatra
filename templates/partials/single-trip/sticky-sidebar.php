<?php
/**
 * Mobile Sticky Sidebar Template
 * 
 * Displays booking card in sticky bottom position on mobile devices
 * SEO-friendly approach - separate template, no content duplication
 *
 * @package Yatra
 */

if (!defined('ABSPATH')) {
    exit;
}

// Expected variables: $trip, $has_availability, $has_traveler_pricing, $base_price, $pricing_type

$booking_mode = $trip->getBookingMode();

// Calculate pricing - use pre-computed values from SingleTripController
$pricing = [
    'has_price' => false,
    'current_price' => '',
    'original_price' => '',
    'price_prefix' => '',
    'has_discount' => false,
    'raw_current_price' => 0,
    'raw_original_price' => 0,
    'is_traveler_based' => $has_traveler_pricing
];

$discount = [
    'has_discount' => false,
    'discount_text' => '',
    'discount_percentage' => 0
];

// Use effective_price_min computed in SingleTripController
$effective_min = (float) ($trip->effective_price_min ?? 0);
$original_min = (float) ($trip->min_category_original_price ?? 0);
$max_discount_pct = (int) ($trip->max_discount_percentage ?? 0);

if ($effective_min > 0) {
    $pricing['has_price'] = true;
    $pricing['raw_current_price'] = $effective_min;
    $pricing['current_price'] = yatra_format_price($effective_min);

    if ($has_traveler_pricing || $has_availability) {
        $pricing['price_prefix'] = __('From ', 'yatra');
    }

    if ($max_discount_pct > 0 && $original_min > $effective_min) {
        $pricing['has_discount'] = true;
        $pricing['raw_original_price'] = $original_min;
        $pricing['original_price'] = yatra_format_price($original_min);

        $discount['has_discount'] = true;
        $discount['discount_percentage'] = $max_discount_pct;
        /* translators: %d: maximum discount percentage. */
        $discount['discount_text'] = sprintf(__('Up to %d%%', 'yatra'), $max_discount_pct);
    }
} else {
    $original = (float) ($trip->getOriginalPrice() ?? 0);
    $discounted = (float) ($trip->discounted_price ?? 0);

    if ($discounted > 0) {
        $current = $discounted;
    } elseif ($original > 0) {
        $current = $original;
    } elseif (!empty($trip->getSalePrice()) && (float)$trip->getSalePrice() > 0) {
        $current = (float) $trip->getSalePrice();
    } else {
        $current = 0;
    }

    if ($current > 0) {
        $pricing['has_price'] = true;
        $pricing['raw_current_price'] = $current;
        $pricing['current_price'] = yatra_format_price($current);

        if ($current < $original && $original > 0) {
            $pct = round((($original - $current) / $original) * 100);
            
            // Only show discount if percentage is greater than 0
            if ($pct > 0) {
                $pricing['has_discount'] = true;
                $pricing['raw_original_price'] = $original;
                $pricing['original_price'] = yatra_format_price($original);
                
                $discount['has_discount'] = true;
                $discount['discount_percentage'] = $pct;
                /* translators: %d: discount percentage. */
                $discount['discount_text'] = sprintf(__('%d%%', 'yatra'), $pct);
            }
        }
    }
}
// Pro: check whether this trip has booking disabled (enquiry-only mode)
$booking_disabled = method_exists($trip, 'isBookingDisabled') && $trip->isBookingDisabled();

// Pro feature: same filter contract as the desktop sidebar — the Pro module
// decides whether to switch to a dropdown and supplies the option list.
$yatra_mobile_date_options = (array) apply_filters('yatra_single_trip_date_dropdown_options', [], $trip, null);
$yatra_mobile_use_date_dropdown = (bool) apply_filters('yatra_use_date_dropdown', false, $trip)
    && !empty($yatra_mobile_date_options);
?>
<?php if ($booking_disabled): ?>
<div class="yatra-mobile-sticky-sidebar yatra-enquiry-only-sticky" id="yatra-mobile-sticky-sidebar">
    <div class="yatra-mobile-sticky-content">
        <div class="yatra-mobile-row-1" style="justify-content:space-between;align-items:center;">
            <div style="font-size:0.82rem;color:#1a5fa8;padding:0 4px;">
                <?php esc_html_e('Enquiry only — no direct booking', 'yatra'); ?>
            </div>
            <button type="button"
                    class="yatra-mobile-book-btn"
                    style="background:var(--yatra-primary,#3b82f6);"
                    onclick="window.YatraEnquiry?.open?.(); return false;">
                <?php esc_html_e('Send Enquiry', 'yatra'); ?>
            </button>
        </div>
    </div>
</div>
<?php else: ?>
<div class="yatra-mobile-sticky-sidebar" id="yatra-mobile-sticky-sidebar"
     data-booking-mode="<?php echo esc_attr($booking_mode); ?>">
    <!-- Two-Row Layout -->
    <div class="yatra-mobile-sticky-content">

        <!-- Row 1: Compact fields + close (clean grid layout) -->
        <div class="yatra-mobile-row-1">

            <div class="yatra-mobile-date-section">
                <div class="yatra-mobile-field-btn yatra-mobile-date-btn<?php echo $yatra_mobile_use_date_dropdown ? ' yatra-mobile-date-as-dropdown' : ''; ?>"
                     <?php if (!$yatra_mobile_use_date_dropdown): ?>role="button" tabindex="0"<?php endif; ?>
                     aria-label="<?php echo esc_attr__('Select date', 'yatra'); ?>">
                    <span class="yatra-mobile-field-icon" aria-hidden="true">
                        <?php echo yatra_svg_icon('calendar', 'yatra-mobile-icon'); ?>
                    </span>
                    <?php if ($yatra_mobile_use_date_dropdown): ?>
                        <select id="mobile_travel_date"
                                name="travel_date"
                                class="yatra-mobile-datepicker-input yatra-mobile-date-dropdown"
                                required>
                            <option value=""><?php esc_html_e('Select date', 'yatra'); ?></option>
                            <?php foreach ($yatra_mobile_date_options as $opt): ?>
                                <option value="<?php echo esc_attr($opt['value']); ?>"
                                        <?php if (!empty($opt['time'])): ?>data-departure-time="<?php echo esc_attr($opt['time']); ?>"<?php endif; ?>>
                                    <?php echo esc_html($opt['label']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    <?php else: ?>
                        <input type="text"
                               id="mobile_travel_date"
                               name="travel_date"
                               class="yatra-mobile-datepicker-input yatra-mobile-datepicker"
                               placeholder="<?php esc_attr_e('Date', 'yatra'); ?>"
                               data-min-date="<?php echo esc_attr($trip->getAvailableFrom() ?: date('Y-m-d')); ?>"
                               data-max-date="<?php echo esc_attr($trip->getAvailableTo() ?: ''); ?>"
                               readonly
                               required>
                    <?php endif; ?>
                    <svg class="yatra-mobile-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>

            <div class="yatra-mobile-travelers-section">
                <?php if ($has_traveler_pricing): ?>
                    <?php
                    // Reuse the same traveler selector component as desktop, but with mobile-specific IDs
                    $traveler_data = \Yatra\Controllers\SingleTripController::prepareTravelerSelectorData($trip, 'sidebar');
                    $rows = $traveler_data['traveler_rows'] ?? [];

                    // Prefix IDs so they don't collide with the desktop sidebar.
                    foreach ($rows as &$row) {
                        if (!empty($row['minus_attrs']['data-target'])) {
                            $row['minus_attrs']['data-target'] = 'mobile_' . $row['minus_attrs']['data-target'];
                        }
                        if (!empty($row['plus_attrs']['data-target'])) {
                            $row['plus_attrs']['data-target'] = 'mobile_' . $row['plus_attrs']['data-target'];
                        }
                        if (!empty($row['input_attrs']['id'])) {
                            $row['input_attrs']['id'] = 'mobile_' . $row['input_attrs']['id'];
                        }
                        if (!empty($row['input_attrs']['name'])) {
                            $row['input_attrs']['name'] = 'mobile_' . $row['input_attrs']['name'];
                        }
                    }
                    unset($row);

                    // Setup variables for traveler-selector.php
                    $root_id = 'mobile-participants';
                    $root_class = 'yatra-booking-field-select yatra-participants-select yatra-mobile-participants';
                    $container_attrs = [];

                    $display_id = 'mobile-participants-display';
                    $display_class = 'yatra-participants-display yatra-mobile-participants-display';
                    $display_attrs = [];

                    $dropdown_id = 'mobile-quantity-selector';
                    $dropdown_class = 'yatra-booking-quantity-selector yatra-mobile-quantity-selector';
                    $dropdown_attrs = [];

                    $display_text = $traveler_data['traveler_display_text'] ?? __('Select travelers', 'yatra');
                    $icon_html = yatra_svg_icon('users', 'yatra-mobile-icon');

                    include YATRA_PLUGIN_PATH . 'templates/partials/traveler-selector.php';
                    ?>
                <?php else: ?>
                    <!-- Regular Pricing -->
                    <div class="yatra-mobile-booking-field">
                        <div class="yatra-mobile-field-icon">
                            <?php echo yatra_svg_icon('users', 'yatra-mobile-icon'); ?>
                        </div>
                        <div class="yatra-mobile-quantity-controls">
                            <button type="button" class="yatra-mobile-quantity-btn yatra-mobile-quantity-minus" data-target="mobile_num_travelers">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                </svg>
                            </button>
                            <input type="number"
                                   id="mobile_num_travelers"
                                   name="num_travelers"
                                   class="yatra-mobile-quantity-input"
                                   value="1"
                                   min="<?php echo esc_attr($trip->getMinTravelers() ?: 1); ?>"
                                   max="<?php echo esc_attr($trip->getMaxTravelers() ?: 20); ?>"
                                   readonly
                                   data-price="<?php echo esc_attr($base_price); ?>">
                            <button type="button" class="yatra-mobile-quantity-btn yatra-mobile-quantity-plus" data-target="mobile_num_travelers">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <?php
                    $mobile_tr_min = (int) ($trip->getMinTravelers() ?: 1);
                    $mobile_tr_max = (int) ($trip->getMaxTravelers() ?: 20);
                    ?>
                    <span class="yatra-travelers-range yatra-mobile-travelers-range"><?php
                        echo esc_html(
                            __('Min', 'yatra') . ': ' . $mobile_tr_min . ', ' . __('Max', 'yatra') . ': ' . $mobile_tr_max
                        );
                    ?></span>
                <?php endif; ?>
            </div>
        </div>

        <!-- Close Button (fixed in top-right of sticky container) -->
        <div class="yatra-mobile-action-buttons">
            <button type="button"
                    class="yatra-mobile-close-btn"
                    aria-label="<?php echo esc_attr__('Close', 'yatra'); ?>"
                    onclick="yatraCloseMobileSidebar()">
                    <span class="yatra-mobile-close-fallback" aria-hidden="true">&times;</span>
            </button>
        </div>

        <!-- Row 2: Primary Actions -->
        <div class="yatra-mobile-row-2">
            <button type="button" class="yatra-mobile-check-btn" id="mobile-check-availability-btn" data-trip-id="<?php echo esc_attr($trip->getId()); ?>">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span><?php echo esc_html__('Check', 'yatra'); ?></span>
            </button>
            <button type="button" class="yatra-mobile-enquire-btn" id="mobile-open-enquiry-modal" onclick="if (window.enquiryModal) { window.enquiryModal.open(); } else if (window.YatraEnquiry) { window.YatraEnquiry.open(); } return false;">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
                <span><?php echo esc_html__('Enquire', 'yatra'); ?></span>
            </button>
        </div>

            </div>
    
    </div>
<?php endif; // end else (booking not disabled) ?>

<?php
// Mobile sticky-sidebar + flatpickr initializer is enqueued as
// assets/js/single-trip-sidebar.js by FrontendAssetsProvider::enqueueTripDetailAssets()
// — not inlined here. Keeping it inline caused WordPress's `convert_chars` content
// filter to rewrite the `&&` operators in this JS as `&#038;&#038;`, which the
// browser then refuses to parse. The external file is delivered untouched.
?>
