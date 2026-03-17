<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<aside class="yatra-trip-sidebar" id="booking">
    <?php
    // Determine if this is a multi-day trip
    $is_multi_day = ($trip->getDurationDays() ?? 1) > 1;

    // Check for group discounts availability early for the badge (premium feature)
    $sidebar_has_group_discounts = false;
    $sidebar_group_discounts_data = [];
    $sidebar_group_discount_summary = '';
    try {
        // Check if group discounts method exists (premium feature)
        if (class_exists('\Yatra\Services\DiscountService') &&
            method_exists('\Yatra\Services\DiscountService', 'getGroupDiscountsForTrip')) {
            $discountService = new \Yatra\Services\DiscountService();
            $groupDiscountsResult = $discountService->getGroupDiscountsForTrip((int) $trip->getId());
            if (!empty($groupDiscountsResult)) {
                $sidebar_has_group_discounts = true;
                $sidebar_group_discounts_data = $groupDiscountsResult;
                // Get min_group_size from ranges if available, otherwise use legacy field
                $min_group = 2;
                if (!empty($groupDiscountsResult[0]->group_discount_ranges)) {
                    $ranges = json_decode($groupDiscountsResult[0]->group_discount_ranges, true);
                    if (!empty($ranges) && is_array($ranges)) {
                        $first_range = $ranges[0] ?? null;
                        if ($first_range && !empty($first_range['min_group_size'])) {
                            $min_group = (int) $first_range['min_group_size'];
                        }
                    }
                }
            }
        }
    } catch (\Exception $e) {
        // Silently fail if premium features are not available
        $sidebar_has_group_discounts = false;
    }

    // Prepare availability data for JavaScript
    $availability_json = [];
    if ($has_availability) {
        foreach ($trip->getAvailabilityDates() as $avail) {
            $availability_json[] = [
                'id' => (int) $avail->id,
                'date' => $avail->departure_date,
                'departure_date' => $avail->departure_date,
                'return_date' => $avail->return_date,
                'price' => $avail->effective_price ?? $avail->original_price,
                'original_price' => $avail->original_price,
                'discounted_price' => $avail->discounted_price,
                'seats_available' => $avail->seats_available,
                'seats_total' => $avail->seats_total,
                'status' => $avail->status,
                'is_limited' => $avail->is_limited ?? false,
                'is_sold_out' => $avail->is_sold_out ?? false,
                'pricing_type' => $avail->pricing_type ?? $pricing_type,
                'price_types' => !empty($avail->price_types) ? $avail->price_types : [],
            ];
        }
    }

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

    // Use effective_price_min computed in SingleTripController (same as listing page)
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

        // Check for discount
        if ($max_discount_pct > 0 && $original_min > $effective_min) {
            $pricing['has_discount'] = true;
            $pricing['raw_original_price'] = $original_min;
            $pricing['original_price'] = yatra_format_price($original_min);

            $discount['has_discount'] = true;
            $discount['discount_percentage'] = $max_discount_pct;
            $discount['discount_text'] = sprintf(__('Up to %d%%', 'yatra'), $max_discount_pct);
        }
    } else {
        // Fallback for regular pricing when effective_price_min is 0
        // This runs for both regular pricing AND traveler pricing scenarios
        $original = (float) ($trip->getOriginalPrice() ?? 0);
        $discounted = (float) ($trip->discounted_price ?? 0);

        // Determine current price: Priority: discounted_price > original_price > sale_price
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
                $pricing['has_discount'] = true;
                $pricing['raw_original_price'] = $original;
                $pricing['original_price'] = yatra_format_price($original);

                $pct = round((($original - $current) / $original) * 100);
                $discount['has_discount'] = true;
                $discount['discount_percentage'] = $pct;
                $discount['discount_text'] = sprintf(__('%d%%', 'yatra'), $pct);
            }
        }
    }
    ?>
    <div class="yatra-booking-card"
         data-has-availability="<?php echo $has_availability ? 'true' : 'false'; ?>"
         data-is-multi-day="<?php echo $is_multi_day ? 'true' : 'false'; ?>"
         data-pricing-type="<?php echo esc_attr($pricing_type); ?>"
         data-availability='<?php echo esc_attr(json_encode($availability_json)); ?>'
         data-group-discounts='<?php echo esc_attr(json_encode($sidebar_group_discounts_data)); ?>'>

        <?php if ($sidebar_has_group_discounts): ?>
            <!-- Group Discount Badge - Minimal -->
            <div class="yatra-group-discount-badge-minimal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span><?php echo esc_html__('Group discount available', 'yatra'); ?></span>
            </div>
        <?php endif; ?>

        <!-- Price Display -->
        <div class="yatra-booking-price">
            <?php if ($discount['has_discount']): ?>
                <div class="yatra-booking-discount-badge">
                    <?php echo esc_html($discount['discount_text']); ?> <?php echo esc_html__('OFF', 'yatra'); ?>
                </div>
            <?php endif; ?>
            <div class="yatra-booking-price-main">
                <?php if ($pricing['has_price']): ?>
                    <?php if ($has_availability || $has_traveler_pricing): ?>
                        <span class="yatra-booking-price-label-top"><?php echo esc_html__('From', 'yatra'); ?></span>
                    <?php endif; ?>
                    <?php if ($pricing['has_discount'] && !empty($pricing['original_price'])): ?>
                        <span class="yatra-booking-price-original"><?php echo esc_html($pricing['original_price']); ?></span>
                    <?php endif; ?>
                    <span class="yatra-booking-price-amount" id="display-price"><?php echo esc_html($pricing['current_price']); ?></span>
                    <span class="yatra-booking-price-label"><?php echo esc_html__('per person', 'yatra'); ?></span>
                <?php else: ?>
                    <span class="yatra-booking-price-amount yatra-contact-pricing" id="display-price"><?php echo esc_html__('Contact for pricing', 'yatra'); ?></span>
                    <span class="yatra-booking-price-label"><?php echo esc_html__('per person', 'yatra'); ?></span>
                <?php endif; ?>
            </div>
        </div>

        <?php if ($has_availability): ?>
        <!-- ========================================== -->
        <!-- AVAILABILITY-BASED BOOKING -->
        <!-- ========================================== -->
        <div class="yatra-availability-info">
                    <span class="yatra-availability-count">
                        <?php echo esc_html(sprintf(_n('%d departure available', '%d departures available', count($trip->getAvailabilityDates()), 'yatra'), count($trip->getAvailabilityDates()))); ?>
                    </span>
        </div>

        <form class="yatra-booking-form" data-booking-mode="availability">
            <!-- Date Selection -->
            <div class="yatra-booking-field-select">
                <div class="yatra-booking-field-icon">
                    <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                </div>
                <input type="text"
                       id="travel_date"
                       name="travel_date"
                       class="yatra-booking-select yatra-datepicker"
                       placeholder="<?php esc_attr_e('Select date', 'yatra'); ?>"
                       readonly
                       required>
                <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
            </div>

            <!-- Travelers Selection - Respects Trip's Pricing Type -->
            <?php
            // Use helper function to prepare traveler data
            $traveler_data = \Yatra\Controllers\SingleTripController::prepareTravelerSelectorData($trip, 'availability');
            
            if ($traveler_data['has_traveler_pricing']):
                // Setup variables for traveler-selector.php
                $root_id = '';
                $root_class = 'yatra-booking-field-select yatra-participants-select yatra-availability-participants';
                $container_attrs = [];

                $display_id = 'participants-display';
                $display_class = 'yatra-participants-display yatra-availability-participants-display';
                $display_attrs = [];

                $dropdown_id = 'quantity-selector';
                $dropdown_class = 'yatra-booking-quantity-selector yatra-availability-quantity-selector';
                $dropdown_attrs = [];

                $display_text = $traveler_data['traveler_display_text'];
                $icon_html = yatra_svg_icon('users', 'yatra-icon-sm');
                $rows = $traveler_data['traveler_rows'];

                include YATRA_PLUGIN_PATH . 'templates/partials/traveler-selector.php';
            else:
                // Regular Pricing: Simple number of travelers input
                ?>
                <div class="yatra-booking-field-group">
                    <label for="num_travelers" class="yatra-booking-field-label"><?php echo esc_html__('Number of Travelers', 'yatra'); ?></label>
                    <?php
                    // Setup variables for traveler-input-simple.php
                    $input_id = 'num_travelers';
                    $input_name = 'num_travelers';
                    $value = 1;
                    $min = $trip->getMinTravelers() ?: 1;
                    $max = $trip->getMaxTravelers() ?: 20;
                    $data_price = $base_price;
                    $range_text = sprintf(__('Min: %d, Max: %d', 'yatra'), $min, $max);
                    
                    include YATRA_PLUGIN_PATH . 'templates/partials/traveler-input-simple.php';
                    ?>
                </div>
            <?php endif; ?>
            <?php else: ?>
            <!-- ========================================== -->
            <!-- REGULAR BOOKING (No Availability Setup) -->
            <!-- ========================================== -->

            <?php if (!empty($trip->getAvailableFrom()) || !empty($trip->getAvailableTo())): ?>
                <div class="yatra-booking-availability-compact">
                    <span class="yatra-booking-availability-text">
                        <?php
                        if (!empty($trip->getAvailableFrom()) && !empty($trip->getAvailableTo())) {
                            echo esc_html(sprintf(__('Available: %s - %s', 'yatra'),
                                date_i18n(get_option('date_format'), strtotime($trip->getAvailableFrom())),
                                date_i18n(get_option('date_format'), strtotime($trip->getAvailableTo()))
                            ));
                        } elseif (!empty($trip->getAvailableFrom())) {
                            echo esc_html(sprintf(__('Available from: %s', 'yatra'),
                                date_i18n(get_option('date_format'), strtotime($trip->getAvailableFrom()))
                            ));
                        } else {
                            echo esc_html(sprintf(__('Available until: %s', 'yatra'),
                                date_i18n(get_option('date_format'), strtotime($trip->getAvailableTo()))
                            ));
                        }
                        ?>
                    </span>
                </div>
            <?php endif; ?>

            <form class="yatra-booking-form" data-booking-mode="regular">
                <!-- Date Selection (Flexible) -->
                <div class="yatra-booking-field-select">
                    <div class="yatra-booking-field-icon">
                        <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                    </div>
                    <input type="text"
                           id="travel_date"
                           name="travel_date"
                           class="yatra-booking-select yatra-datepicker"
                           placeholder="<?php esc_attr_e('Select date', 'yatra'); ?>"
                           data-min-date="<?php echo esc_attr($trip->getAvailableFrom() ?: date('Y-m-d')); ?>"
                           data-max-date="<?php echo esc_attr($trip->getAvailableTo() ?: ''); ?>"
                           readonly
                           required>
                    <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>

                <!-- Travelers Selection -->
                <?php
                // Use helper function to prepare traveler data
                $traveler_data = \Yatra\Controllers\SingleTripController::prepareTravelerSelectorData($trip, 'sidebar');
                
                if ($traveler_data['has_traveler_pricing']):
                    // Setup variables for traveler-selector.php
                    $root_id = '';
                    $root_class = 'yatra-booking-field-select yatra-participants-select';
                    $container_attrs = [];

                    $display_id = 'participants-display';
                    $display_class = 'yatra-participants-display';
                    $display_attrs = [];

                    $dropdown_id = 'quantity-selector';
                    $dropdown_class = 'yatra-booking-quantity-selector';
                    $dropdown_attrs = [];

                    $display_text = $traveler_data['traveler_display_text'];
                    $icon_html = yatra_svg_icon('users', 'yatra-icon-sm');
                    $rows = $traveler_data['traveler_rows'];

                    include YATRA_PLUGIN_PATH . 'templates/partials/traveler-selector.php';
                else:
                    // Regular Pricing: Simple number of travelers input
                    ?>
                    <div class="yatra-booking-field-group">
                        <label for="num_travelers" class="yatra-booking-field-label"><?php echo esc_html__('Number of Travelers', 'yatra'); ?></label>
                        <?php
                        // Setup variables for traveler-input-simple.php
                        $input_id = 'num_travelers';
                        $input_name = 'num_travelers';
                        $value = 1;
                        $min = $trip->getMinTravelers() ?: 1;
                        $max = $trip->getMaxTravelers() ?: 20;
                        $data_price = $base_price;
                        $range_text = sprintf(__('Min: %d, Max: %d', 'yatra'), $min, $max);
                        
                        include YATRA_PLUGIN_PATH . 'templates/partials/traveler-input-simple.php';
                        ?>
                    </div>
                <?php endif; ?>
                <?php endif; ?>

                <!-- Total Price Display (Dynamic) -->
                <?php
                // Calculate initial total based on default traveler quantities
                $initial_total = $base_price;
                if ($traveler_data['has_traveler_pricing'] && !empty($traveler_data['traveler_rows'])) {
                    $initial_total = 0;
                    foreach ($traveler_data['traveler_rows'] as $row) {
                        $quantity = (int) ($row['input_attrs']['value'] ?? 0);
                        $price = (float) ($row['input_attrs']['data-price'] ?? 0);
                        $pricing_mode = $row['input_attrs']['data-pricing-mode'] ?? 'per_person';
                        
                        if ($pricing_mode === 'per_group') {
                            // Per group: charge once if any travelers
                            if ($quantity > 0) {
                                $initial_total += $price;
                            }
                        } else {
                            // Per person: charge per traveler
                            $initial_total += $price * $quantity;
                        }
                    }
                }
                ?>
                <div class="yatra-booking-total" id="booking-total">
                    <div class="yatra-booking-total-label"><?php echo esc_html__('Total', 'yatra'); ?></div>
                    <div class="yatra-booking-total-amount" id="total-amount"><?php echo yatra_format_price($initial_total); ?></div>
                </div>

                <!-- Action Buttons -->
                <button type="button" class="yatra-booking-button" id="check-availability-btn" data-trip-id="<?php echo esc_attr($trip->getId()); ?>">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <?php echo esc_html__('Check Availability', 'yatra'); ?>
                </button>

                <button type="button" class="yatra-booking-enquiry-button" id="open-enquiry-modal" onclick="window.YatraEnquiry?.open?.(); return false;">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                    </svg>
                    <?php echo esc_html__('Make Enquiry', 'yatra'); ?>
                </button>

                <!-- Cancellation Policy Trust Signal -->
                <?php 
                $cancellation_policy = '';
                if (method_exists($trip, 'getCancellationPolicy')) {
                    $cancellation_policy = $trip->getCancellationPolicy();
                } elseif (isset($trip->cancellation_policy)) {
                    $cancellation_policy = $trip->cancellation_policy;
                }
                
                $cancellation_text = '';
                if (!empty($cancellation_policy)) {
                    // Extract cancellation info from policy
                    $policy_lower = strtolower($cancellation_policy);
                    if (strpos($policy_lower, 'free') !== false || strpos($policy_lower, 'no charge') !== false) {
                        if (preg_match('/(\d+)\s*(hour|day|week)s?\s*before/i', $cancellation_policy, $matches)) {
                            $time_value = $matches[1];
                            $time_unit = $matches[2];
                            $cancellation_text = sprintf(
                                __('Free cancellation up to %d %s%s before', 'yatra'),
                                $time_value,
                                $time_unit,
                                $time_value > 1 ? 's' : ''
                            );
                        } else {
                            $cancellation_text = __('Free cancellation', 'yatra');
                        }
                    } else {
                        // Non-free cancellation, show brief info
                        $cancellation_text = __('Cancellation policy applies', 'yatra');
                    }
                } else {
                    // Default fallback when no policy is set
                    $cancellation_text = __('Cancellation policy may apply', 'yatra');
                }
                ?>
                <div class="yatra-booking-trust">
                    <div class="yatra-booking-trust-icon">
                        <?php echo yatra_svg_icon('check', 'yatra-icon-xs'); ?>
                    </div>
                    <div class="yatra-booking-trust-text">
                        <strong><?php echo esc_html($cancellation_text); ?></strong>
                    </div>
                </div>
            </form>
    </div>
</aside>