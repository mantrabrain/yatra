<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<aside class="yatra-trip-sidebar" id="booking">
    <?php
    // Group discounts (Advanced Discount / Pro): same payload as the public REST discoverability endpoint
    $sidebar_has_group_discounts = false;
    $sidebar_group_discount_cards = [];
    if (function_exists('yatra_single_trip_get_group_discounts')) {
        $gd = yatra_single_trip_get_group_discounts((int) $trip->getId());
        $sidebar_has_group_discounts = !empty($gd['has_group_discounts']);
        $sidebar_group_discount_cards = isset($gd['group_discounts_data']) && is_array($gd['group_discounts_data'])
            ? $gd['group_discounts_data']
            : [];
    }

    // Pro: check whether this trip has booking disabled (enquiry-only mode)
    $booking_disabled = method_exists($trip, 'isBookingDisabled') && $trip->isBookingDisabled();

    // Pricing — resolved via centralized TripPricingService (single source of truth)
    // SingleTripController pre-computes effective_price_min, min_category_original_price, max_discount_percentage
    $displayPricing = \Yatra\Services\TripPricingService::resolveDisplayPricing($trip);

    $pricing = [
        'has_price'          => $displayPricing['effective_price_min'] > 0,
        'current_price'      => $displayPricing['effective_price_min'] > 0 ? yatra_format_price($displayPricing['effective_price_min']) : '',
        'original_price'     => $displayPricing['has_discount'] ? yatra_format_price($displayPricing['min_category_original_price']) : '',
        'price_prefix'       => $displayPricing['price_prefix'],
        'has_discount'       => $displayPricing['has_discount'],
        'raw_current_price'  => $displayPricing['effective_price_min'],
        'raw_original_price' => $displayPricing['min_category_original_price'],
        'is_traveler_based'  => $displayPricing['has_traveler_pricing'],
    ];

    $discount = [
        'has_discount'       => $displayPricing['has_discount'] && $displayPricing['max_discount_percentage'] > 0,
        'discount_text'      => $displayPricing['max_discount_percentage'] > 0
            ? sprintf(__('Save up to %d%%', 'yatra'), $displayPricing['max_discount_percentage']) : '',
        'discount_percentage' => $displayPricing['max_discount_percentage'],
    ];

    $dp_display_sidebar = apply_filters('yatra_get_dynamic_pricing_display_settings', [
        'show_original_price' => true,
        'show_savings_badge' => true,
        'show_urgency_messages' => false,
    ]);
    $dp_show_savings_sidebar = filter_var($dp_display_sidebar['show_savings_badge'] ?? true, FILTER_VALIDATE_BOOLEAN);
    $show_strike_original_sidebar = filter_var($dp_display_sidebar['show_original_price'] ?? true, FILTER_VALIDATE_BOOLEAN);
    $yatra_sidebar_urgency = function_exists('yatra_trip_card_dynamic_pricing_urgency_lines')
        ? yatra_trip_card_dynamic_pricing_urgency_lines((int) $trip->getId(), [
            'base_sale_price' => (float) ($displayPricing['effective_price_min'] ?? 0),
            'base_original_price' => (float) ($displayPricing['min_category_original_price'] ?? 0),
            'sale_price' => (float) ($displayPricing['effective_price_min'] ?? 0),
            'original_price' => (float) ($displayPricing['min_category_original_price'] ?? 0),
            'departure_date' => null,
            'spots_remaining' => null,
            'availability_id' => null,
            'surface' => 'single_sidebar',
        ])
        : [];
    ?>
    <?php if ($booking_disabled): ?>
    <div class="yatra-booking-card yatra-enquiry-only-card">
        <!-- Price Display -->
        <div class="yatra-booking-price">
            <?php if ($discount['has_discount'] && $dp_show_savings_sidebar): ?>
                <div class="yatra-booking-discount-badge">
                    <?php echo esc_html($discount['discount_text']); ?>
                </div>
            <?php endif; ?>
            <div class="yatra-booking-price-main">
                <?php if ($pricing['has_price']): ?>
                    <span class="yatra-booking-price-label-top"><?php echo esc_html__('From', 'yatra'); ?></span>
                    <?php if ($pricing['has_discount'] && !empty($pricing['original_price']) && $show_strike_original_sidebar): ?>
                        <span class="yatra-booking-price-original"><?php echo esc_html($pricing['original_price']); ?></span>
                    <?php endif; ?>
                    <span class="yatra-booking-price-amount" id="display-price"><?php echo esc_html($pricing['current_price']); ?></span>
                    <span class="yatra-booking-price-label"><?php echo esc_html__('per person', 'yatra'); ?></span>
                    <?php if (!empty($yatra_sidebar_urgency)) : ?>
                        <?php foreach ($yatra_sidebar_urgency as $yatra_sb_urg) : ?>
                            <div class="yatra-booking-dp-urgency" style="background-color:#fef3c7;color:#92400e;padding:6px 8px;border-radius:6px;margin-top:8px;font-size:12px;line-height:1.35;">
                                <?php echo esc_html((string) $yatra_sb_urg); ?>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                <?php else: ?>
                    <span class="yatra-booking-price-amount yatra-contact-pricing" id="display-price"><?php echo esc_html__('Contact for pricing', 'yatra'); ?></span>
                <?php endif; ?>
            </div>
        </div>

        <!-- Enquiry-only notice -->
        <div class="yatra-enquiry-notice" style="margin:12px 0 4px;padding:10px 12px;background:#f0f7ff;border:1px solid #cce0ff;border-radius:6px;font-size:0.85rem;color:#1a5fa8;display:flex;align-items:flex-start;gap:8px;">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span><?php esc_html_e('This trip is available for enquiry only. Please contact us to discuss dates and availability.', 'yatra'); ?></span>
        </div>

        <!-- Enquiry button -->
        <button type="button" class="yatra-booking-button" style="margin-top:12px;" id="open-enquiry-modal" onclick="window.YatraEnquiry?.open?.(); return false;">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
            <?php echo esc_html__('Send Enquiry', 'yatra'); ?>
        </button>
    </div>
    <?php else: ?>
    <div class="yatra-booking-card">

        <?php if ($sidebar_has_group_discounts && !empty($sidebar_group_discount_cards)): ?>
            <?php
            $group_discount_cards = $sidebar_group_discount_cards;
            $popover_context = 'booking';
            $popover_uid = 'sb-' . (int) $trip->getId();
            yatra_get_template('partials/single-trip/group-discount-booking-popover', compact('group_discount_cards', 'popover_context', 'popover_uid'));
            ?>
        <?php endif; ?>

        <!-- Price Display -->
        <div class="yatra-booking-price">
            <?php if ($discount['has_discount'] && $dp_show_savings_sidebar): ?>
                <div class="yatra-booking-discount-badge">
                    <?php echo esc_html($discount['discount_text']); ?>
                </div>
            <?php endif; ?>
            <div class="yatra-booking-price-main">
                <?php if ($pricing['has_price']): ?>
                    <?php if ($has_availability || $has_traveler_pricing): ?>
                        <span class="yatra-booking-price-label-top"><?php echo esc_html__('From', 'yatra'); ?></span>
                    <?php endif; ?>
                    <?php if ($pricing['has_discount'] && !empty($pricing['original_price']) && $show_strike_original_sidebar): ?>
                        <span class="yatra-booking-price-original"><?php echo esc_html($pricing['original_price']); ?></span>
                    <?php endif; ?>
                    <span class="yatra-booking-price-amount" id="display-price"><?php echo esc_html($pricing['current_price']); ?></span>
                    <span class="yatra-booking-price-label"><?php echo esc_html__('per person', 'yatra'); ?></span>
                    <?php if (!empty($yatra_sidebar_urgency)) : ?>
                        <?php foreach ($yatra_sidebar_urgency as $yatra_sb_urg) : ?>
                            <div class="yatra-booking-dp-urgency" style="background-color:#fef3c7;color:#92400e;padding:6px 8px;border-radius:6px;margin-top:8px;font-size:12px;line-height:1.35;">
                                <?php echo esc_html((string) $yatra_sb_urg); ?>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                <?php else: ?>
                    <span class="yatra-booking-price-amount yatra-contact-pricing" id="display-price"><?php echo esc_html__('Contact for pricing', 'yatra'); ?></span>
                <?php endif; ?>
            </div>
        </div>

        <?php if ($trip->getBookingMode() === 'date_specific' && $has_availability): ?>
        <!-- ========================================== -->
        <!-- DATE-SPECIFIC BOOKING (Has Availability Dates/Rules) -->
        <!-- ========================================== -->
        <div class="yatra-availability-info">
                    <span class="yatra-availability-count">
                        <?php
                        $allAvailability = $trip->getAvailabilityDates();
                        $today = date('Y-m-d');

                        // Sidebar count should reflect the same resolved availability set (priority:
                        // manual > recurring rule > trip default). We keep it lightweight here:
                        // count upcoming departures (date + optional time) from the resolved list.
                        $filtered = array_filter($allAvailability, static function ($a) use ($today) {
                            if (!is_object($a)) {
                                return false;
                            }
                            $date = (string) ($a->departure_date ?? '');
                            if ($date === '' || $date < $today) {
                                return false;
                            }
                            return true;
                        });

                        // Priority: manual availability dates > recurring rules > trip default.
                        $bySource = [
                            'availability_date' => [],
                            'recurring_rule' => [],
                            'trip_default' => [],
                            '' => [],
                        ];
                        foreach ($filtered as $a) {
                            $src = strtolower(trim((string) ($a->source ?? '')));
                            if (!isset($bySource[$src])) {
                                $src = '';
                            }
                            $bySource[$src][] = $a;
                        }

                        $pick = [];
                        if (!empty($bySource['availability_date'])) {
                            $pick = $bySource['availability_date'];
                        } elseif (!empty($bySource['recurring_rule'])) {
                            $pick = $bySource['recurring_rule'];
                        } elseif (!empty($bySource['trip_default'])) {
                            $pick = $bySource['trip_default'];
                        } else {
                            $pick = $filtered;
                        }

                        // Count departures:
                        // - if availability entries include departure_time, count unique (date + time) as departures
                        // - otherwise count unique dates.
                        $hasTimeSlots = false;
                        foreach ($pick as $a) {
                            $t = isset($a->departure_time) ? trim((string) $a->departure_time) : '';
                            if ($t !== '' && $t !== '00:00:00') {
                                $hasTimeSlots = true;
                                break;
                            }
                        }

                        $unique = [];
                        foreach ($pick as $a) {
                            $date = (string) ($a->departure_date ?? '');
                            if ($date === '') {
                                continue;
                            }
                            if ($hasTimeSlots) {
                                $t = isset($a->departure_time) ? trim((string) $a->departure_time) : '';
                                if ($t !== '' && $t !== '00:00:00') {
                                    $date .= '|' . $t;
                                } else {
                                    // When some rows have time and others don't, avoid collapsing into date-only.
                                    $date .= '|__no_time__';
                                }
                            }
                            $unique[$date] = true;
                        }
                        $countAvailable = count($unique);

                        echo esc_html(sprintf(
                            _n('%d departure available', '%d departures available', $countAvailable, 'yatra'),
                            $countAvailable
                        ));
                        ?>
                    </span>
        </div>

        <form class="yatra-booking-form" data-booking-mode="date_specific">
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

                    include YATRA_PLUGIN_PATH . 'templates/partials/traveler-input-simple.php';
                    ?>
                </div>
            <?php endif; ?>
            <?php else: ?>
            <!-- ========================================== -->
            <!-- FLEXIBLE BOOKING MODE (No Specific Availability Configured) -->
            <!-- ========================================== -->
            <div class="yatra-availability-info yatra-flexible-booking-info">
                <span class="yatra-availability-count">
                    <?php echo esc_html__('Flexible booking available', 'yatra'); ?>
                </span>
                <?php if (!empty($trip->getAvailableFrom()) || !empty($trip->getAvailableTo())): ?>
                    <span class="yatra-availability-note">
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
                <?php endif; ?>
            </div>

            <form class="yatra-booking-form" data-booking-mode="flexible">
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

                        include YATRA_PLUGIN_PATH . 'templates/partials/traveler-input-simple.php';
                        ?>
                    </div>
                <?php endif; ?>
                <?php endif; ?>

                
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
    <?php endif; // end else (booking not disabled) ?>
</aside>