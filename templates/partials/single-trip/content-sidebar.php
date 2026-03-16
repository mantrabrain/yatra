<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<aside class="yatra-trip-sidebar" id="booking">
    <?php
    // Determine if this is a multi-day trip
    $is_multi_day = ($trip->duration_days ?? 1) > 1;

    // Check for group discounts availability early for the badge (premium feature)
    $sidebar_has_group_discounts = false;
    $sidebar_group_discounts_data = [];
    $sidebar_group_discount_summary = '';
    try {
        // Check if group discounts method exists (premium feature)
        if (class_exists('\Yatra\Services\DiscountService') &&
            method_exists('\Yatra\Services\DiscountService', 'getGroupDiscountsForTrip')) {
            $discountService = new \Yatra\Services\DiscountService();
            $groupDiscountsResult = $discountService->getGroupDiscountsForTrip((int) $trip->id);
            if (!empty($groupDiscountsResult)) {
                $sidebar_has_group_discounts = true;
                $sidebar_group_discounts_data = $groupDiscountsResult;
                // Get min_group_size from ranges if available, otherwise use legacy field
                $min_group = 2;
                if (!empty($groupDiscountsResult[0]['group_discount_ranges'])) {
                    $first_range = $groupDiscountsResult[0]['group_discount_ranges'][0] ?? null;
                    if ($first_range && !empty($first_range['min_group_size'])) {
                        $min_group = (int) $first_range['min_group_size'];
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
        foreach ($trip->availability_dates as $avail) {
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
        $original = (float) ($trip->original_price ?? 0);
        $discounted = (float) ($trip->discounted_price ?? 0);

        // Determine current price: Priority: discounted_price > original_price > sale_price
        if ($discounted > 0) {
            $current = $discounted;
        } elseif ($original > 0) {
            $current = $original;
        } elseif (!empty($trip->sale_price) && (float)$trip->sale_price > 0) {
            $current = (float) $trip->sale_price;
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
                        <?php echo esc_html(sprintf(_n('%d departure available', '%d departures available', count($trip->availability_dates), 'yatra'), count($trip->availability_dates))); ?>
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
            <?php if ($has_traveler_pricing): ?>
                <!-- Traveler-Based Pricing: Show dynamic categories with prices -->
                <?php
                // Normalize price_types to match availability section
                $normalized_price_types = [];
                foreach ($trip->price_types as $pt) {
                    if (is_array($pt)) {
                        $normalized_price_types[] = (object) $pt;
                    } else {
                        $normalized_price_types[] = $pt;
                    }
                }
                
                $first_category = isset($normalized_price_types[0]) ? $normalized_price_types[0] : null;
                $first_label = '';
                if ($first_category) {
                    $first_label = $first_category->category_label ?? $first_category->label ?? __('Traveler', 'yatra');
                }
                $traveler_display_text = ($first_label ?: __('Traveler', 'yatra')) . ' x 1';

                $traveler_rows = [];
                foreach ($normalized_price_types as $index => $price_type) {
                    $pricing_mode = $price_type->pricing_mode ?? 'per_person';
                    $is_per_group = ($pricing_mode === 'per_group');
                    $pricing_label = '';
                    if ($is_per_group) {
                        if (!empty($price_type->min_pax) && !empty($price_type->max_pax)) {
                            $pricing_label = sprintf(__('per group (%d-%d pax)', 'yatra'), $price_type->min_pax, $price_type->max_pax);
                        } elseif (!empty($price_type->max_pax)) {
                            $pricing_label = sprintf(__('per group (up to %d pax)', 'yatra'), $price_type->max_pax);
                        } elseif (!empty($price_type->min_pax)) {
                            $pricing_label = sprintf(__('per group (%d+ pax)', 'yatra'), $price_type->min_pax);
                        } else {
                            $pricing_label = __('per group', 'yatra');
                        }
                    }

                    $display_price_type = $price_type->effective_price;
                    if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
                        $display_price_type = apply_filters('yatra_trip_display_price', $display_price_type, $trip->id ?? 0, [
                            'departure_date' => null,
                            'spots_remaining' => null,
                            'price_type_id' => $price_type->id ?? null,
                        ]);
                    }

                    $age_info = '';
                    if ($price_type->age_min !== null || $price_type->age_max !== null) {
                        if ($price_type->age_min !== null && $price_type->age_max !== null) {
                            $age_info = sprintf(__('(Age %d-%d)', 'yatra'), $price_type->age_min, $price_type->age_max);
                        } elseif ($price_type->age_min !== null) {
                            $age_info = sprintf(__('(Age %d+)', 'yatra'), $price_type->age_min);
                        } else {
                            $age_info = sprintf(__('(Up to age %d)', 'yatra'), $price_type->age_max);
                        }
                    }

                    $price_html = '<div class="yatra-quantity-price-wrapper">';
                    $price_html .= '<span class="yatra-quantity-price">' . yatra_format_price($display_price_type) . '</span>';
                    if ($is_per_group) {
                        $price_html .= '<span class="yatra-pricing-mode-label yatra-pricing-mode-group">' . esc_html($pricing_label) . '</span>';
                    }
                    $price_html .= '</div>';

                    $input_id = 'traveler_' . $price_type->category_id;
                    $pt_max_qty = (int) ($price_type->max_quantity ?: $trip->max_travelers);
                    $pt_value = ($index === 0) ? 1 : 0;

                    $traveler_rows[] = [
                        'label' => $price_type->category_label ?: __('Traveler', 'yatra'),
                        'subtitle' => $age_info,
                        'price_html' => $price_html,
                        'row_attrs' => [
                            'data-category-id' => $price_type->category_id,
                            'data-price' => $price_type->effective_price,
                            'data-pricing-mode' => $pricing_mode,
                        ],
                        'minus_disabled' => ($index !== 0),
                        'plus_disabled' => false,
                        'minus_attrs' => [
                            'data-target' => $input_id,
                            'aria-label' => sprintf(__('Decrease %s', 'yatra'), $price_type->category_label),
                        ],
                        'plus_attrs' => [
                            'data-target' => $input_id,
                            'aria-label' => sprintf(__('Increase %s', 'yatra'), $price_type->category_label),
                        ],
                        'input_attrs' => [
                            'id' => $input_id,
                            'name' => 'travelers[' . $price_type->category_id . ']',
                            'value' => $pt_value,
                            'min' => 0,
                            'max' => $pt_max_qty,
                            'data-category-label' => $price_type->category_label,
                            'data-price' => $price_type->effective_price,
                            'data-pricing-mode' => $pricing_mode,
                        ],
                    ];
                }

                $root_id = '';
                $root_class = 'yatra-booking-field-select yatra-participants-select yatra-availability-participants';
                $container_attrs = [];

                $display_id = 'participants-display';
                $display_class = 'yatra-participants-display yatra-availability-participants-display';
                $display_attrs = [];

                $dropdown_id = 'quantity-selector';
                $dropdown_class = 'yatra-booking-quantity-selector yatra-availability-quantity-selector';
                $dropdown_attrs = [];

                $display_text = $traveler_display_text;
                $icon_html = yatra_svg_icon('users', 'yatra-icon-sm');
                $rows = $traveler_rows;

                include YATRA_PLUGIN_PATH . 'templates/partials/traveler-selector.php';
                ?>
            <?php else: ?>
                <!-- Regular Pricing: Simple number of travelers input -->
                <div class="yatra-booking-field-group">
                    <label for="num_travelers" class="yatra-booking-field-label"><?php echo esc_html__('Number of Travelers', 'yatra'); ?></label>
                    <div class="yatra-booking-travelers-simple">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                        </div>
                        <div class="yatra-quantity-controls-inline">
                            <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="num_travelers" aria-label="<?php esc_attr_e('Decrease travelers', 'yatra'); ?>">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                </svg>
                            </button>
                            <input type="number"
                                   id="num_travelers"
                                   name="num_travelers"
                                   class="yatra-quantity-input-simple"
                                   value="1"
                                   min="<?php echo esc_attr($trip->min_travelers ?: 1); ?>"
                                   max="<?php echo esc_attr($trip->max_travelers ?: 20); ?>"
                                   readonly
                                   data-price="<?php echo esc_attr($base_price); ?>">
                            <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="num_travelers" aria-label="<?php esc_attr_e('Increase travelers', 'yatra'); ?>">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                            </button>
                        </div>
                        <span class="yatra-travelers-range"><?php echo esc_html(sprintf(__('Min: %d, Max: %d', 'yatra'), $trip->min_travelers ?: 1, $trip->max_travelers ?: 20)); ?></span>
                    </div>
                </div>
            <?php endif; ?>
            <?php else: ?>
            <!-- ========================================== -->
            <!-- REGULAR BOOKING (No Availability Setup) -->
            <!-- ========================================== -->

            <?php if (!empty($trip->available_from) || !empty($trip->available_to)): ?>
                <div class="yatra-booking-availability-compact">
                    <span class="yatra-booking-availability-text">
                        <?php
                        if (!empty($trip->available_from) && !empty($trip->available_to)) {
                            echo esc_html(sprintf(__('Available: %s - %s', 'yatra'),
                                date_i18n(get_option('date_format'), strtotime($trip->available_from)),
                                date_i18n(get_option('date_format'), strtotime($trip->available_to))
                            ));
                        } elseif (!empty($trip->available_from)) {
                            echo esc_html(sprintf(__('Available from: %s', 'yatra'),
                                date_i18n(get_option('date_format'), strtotime($trip->available_from))
                            ));
                        } else {
                            echo esc_html(sprintf(__('Available until: %s', 'yatra'),
                                date_i18n(get_option('date_format'), strtotime($trip->available_to))
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
                           data-min-date="<?php echo esc_attr($trip->available_from ?: date('Y-m-d')); ?>"
                           data-max-date="<?php echo esc_attr($trip->available_to ?: ''); ?>"
                           readonly
                           required>
                    <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>

                <!-- Travelers Selection -->
                <?php if ($has_traveler_pricing): ?>
                    <!-- Traveler-Based Pricing: Show dynamic categories with prices -->
                    <?php
                    $first_label = !empty($trip->price_types[0]->category_label)
                        ? $trip->price_types[0]->category_label
                        : __('Traveler', 'yatra');
                    $traveler_display_text = $first_label . ' x 1';

                    $traveler_rows = [];
                    foreach ($trip->price_types as $index => $price_type) {
                        $pricing_mode = $price_type->pricing_mode ?? 'per_person';
                        $is_per_group = ($pricing_mode === 'per_group');
                        $pricing_label = '';
                        if ($is_per_group) {
                            if (!empty($price_type->min_pax) && !empty($price_type->max_pax)) {
                                $pricing_label = sprintf(__('per group (%d-%d pax)', 'yatra'), $price_type->min_pax, $price_type->max_pax);
                            } elseif (!empty($price_type->max_pax)) {
                                $pricing_label = sprintf(__('per group (up to %d pax)', 'yatra'), $price_type->max_pax);
                            } elseif (!empty($price_type->min_pax)) {
                                $pricing_label = sprintf(__('per group (%d+ pax)', 'yatra'), $price_type->min_pax);
                            } else {
                                $pricing_label = __('per group', 'yatra');
                            }
                        }

                        $display_price_type = $price_type->effective_price;
                        if (apply_filters('yatra_dynamic_pricing_enabled', false)) {
                            $display_price_type = apply_filters('yatra_trip_display_price', $display_price_type, $trip->id ?? 0, [
                                'departure_date' => null,
                                'spots_remaining' => null,
                                'price_type_id' => $price_type->id ?? null,
                            ]);
                        }

                        $age_info = '';
                        if ($price_type->age_min !== null || $price_type->age_max !== null) {
                            if ($price_type->age_min !== null && $price_type->age_max !== null) {
                                $age_info = sprintf(__('(Age %d-%d)', 'yatra'), $price_type->age_min, $price_type->age_max);
                            } elseif ($price_type->age_min !== null) {
                                $age_info = sprintf(__('(Age %d+)', 'yatra'), $price_type->age_min);
                            } else {
                                $age_info = sprintf(__('(Up to age %d)', 'yatra'), $price_type->age_max);
                            }
                        }

                        $price_html = '<div class="yatra-quantity-price-wrapper">';
                        $price_html .= '<span class="yatra-quantity-price">' . yatra_format_price($display_price_type) . '</span>';
                        if ($is_per_group) {
                            $price_html .= '<span class="yatra-pricing-mode-label yatra-pricing-mode-group">' . esc_html($pricing_label) . '</span>';
                        }
                        $price_html .= '</div>';

                        $input_id = 'traveler_' . $price_type->category_id;
                        $pt_max_qty = (int) ($price_type->max_quantity ?: $trip->max_travelers);
                        $pt_value = ($index === 0) ? 1 : 0;

                        $traveler_rows[] = [
                            'label' => $price_type->category_label ?: __('Traveler', 'yatra'),
                            'subtitle' => $age_info,
                            'price_html' => $price_html,
                            'row_attrs' => [
                                'data-category-id' => $price_type->category_id,
                                'data-price' => $price_type->effective_price,
                                'data-pricing-mode' => $pricing_mode,
                            ],
                            'minus_disabled' => ($index !== 0),
                            'plus_disabled' => false,
                            'minus_attrs' => [
                                'data-target' => $input_id,
                                'aria-label' => sprintf(__('Decrease %s', 'yatra'), $price_type->category_label),
                            ],
                            'plus_attrs' => [
                                'data-target' => $input_id,
                                'aria-label' => sprintf(__('Increase %s', 'yatra'), $price_type->category_label),
                            ],
                            'input_attrs' => [
                                'id' => $input_id,
                                'name' => 'travelers[' . $price_type->category_id . ']',
                                'value' => $pt_value,
                                'min' => 0,
                                'max' => $pt_max_qty,
                                'data-category-label' => $price_type->category_label,
                                'data-price' => $price_type->effective_price,
                                'data-pricing-mode' => $pricing_mode,
                            ],
                        ];
                    }

                    $root_id = '';
                    $root_class = 'yatra-booking-field-select yatra-participants-select';
                    $container_attrs = [];

                    $display_id = 'participants-display';
                    $display_class = 'yatra-participants-display';
                    $display_attrs = [];

                    $dropdown_id = 'quantity-selector';
                    $dropdown_class = 'yatra-booking-quantity-selector';
                    $dropdown_attrs = [];

                    $display_text = $traveler_display_text;
                    $icon_html = yatra_svg_icon('users', 'yatra-icon-sm');
                    $rows = $traveler_rows;

                    include YATRA_PLUGIN_PATH . 'templates/partials/traveler-selector.php';
                    ?>
                <?php else: ?>
                    <!-- Regular Pricing: Simple number of travelers input -->
                    <div class="yatra-booking-field-group">
                        <label for="num_travelers" class="yatra-booking-field-label"><?php echo esc_html__('Number of Travelers', 'yatra'); ?></label>
                        <div class="yatra-booking-travelers-simple">
                            <div class="yatra-booking-field-icon">
                                <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-quantity-controls-inline">
                                <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="num_travelers" aria-label="<?php esc_attr_e('Decrease travelers', 'yatra'); ?>">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                    </svg>
                                </button>
                                <input type="number"
                                       id="num_travelers"
                                       name="num_travelers"
                                       class="yatra-quantity-input-simple"
                                       value="1"
                                       min="<?php echo esc_attr($trip->min_travelers ?: 1); ?>"
                                       max="<?php echo esc_attr($trip->max_travelers ?: 20); ?>"
                                       readonly
                                       data-price="<?php echo esc_attr($base_price); ?>">
                                <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="num_travelers" aria-label="<?php esc_attr_e('Increase travelers', 'yatra'); ?>">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                </button>
                            </div>
                            <span class="yatra-travelers-range"><?php echo esc_html(sprintf(__('Min: %d, Max: %d', 'yatra'), $trip->min_travelers ?: 1, $trip->max_travelers ?: 20)); ?></span>
                        </div>
                    </div>
                <?php endif; ?>
                <?php endif; ?>

                <!-- Total Price Display (Dynamic) -->
                <div class="yatra-booking-total" id="booking-total">
                    <div class="yatra-booking-total-label"><?php echo esc_html__('Total', 'yatra'); ?></div>
                    <div class="yatra-booking-total-amount" id="total-amount"><?php echo yatra_format_price($base_price); ?></div>
                </div>

                <!-- Action Buttons -->
                <button type="button" class="yatra-booking-button" id="check-availability-btn" data-trip-id="<?php echo esc_attr($trip->id); ?>">
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

                <!-- Single Trust Signal -->
                <div class="yatra-booking-trust">
                    <div class="yatra-booking-trust-icon">
                        <?php echo yatra_svg_icon('check', 'yatra-icon-xs'); ?>
                    </div>
                    <div class="yatra-booking-trust-text">
                        <strong><?php esc_html_e('Free cancellation', 'yatra'); ?></strong> <?php esc_html_e('up to 24 hours before', 'yatra'); ?>
                    </div>
                </div>
            </form>
    </div>
</aside>