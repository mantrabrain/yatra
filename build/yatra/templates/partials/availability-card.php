<?php
/**
 * Single departure card for trip availability (included in a loop).
 * @package Yatra
 * @var array $card @var int $index @var object $trip_data @var string $pricing_type @var string $selected_date_filter
 */
defined('ABSPATH') || exit;
$card = $card ?? [];
$index = (int) ($index ?? 0);
$trip_data = $trip_data ?? (object) [];
$pricing_type = $pricing_type ?? 'regular';
$selected_date_filter = $selected_date_filter ?? '';
$trip_id = !empty($trip_data->id) ? (int) $trip_data->id : 0;
$max_travelers = (int) ($trip_data->max_travelers ?? 20);
$item_id = isset($card['id']) ? (string) $card['id'] : (string) $index;

// Get pricing from card (already calculated with dynamic pricing in Controller)
            $sale_price = (float) ($card['sale_price'] ?? 0);
            $original_price = (float) ($card['original_price'] ?? 0);
            
            // For traveler-based pricing, use first category price for initial total
            $initial_total_price = $sale_price;
            if (!empty($card['pricing_type']) && $card['pricing_type'] === 'traveler_based' && !empty($card['traveler_pricing'])) {
                $first_traveler = is_array($card['traveler_pricing']) ? $card['traveler_pricing'][0] : null;
                if ($first_traveler) {
                    $first_traveler = is_array($first_traveler) ? (object) $first_traveler : $first_traveler;
                    $initial_total_price = (float) ($first_traveler->effective_price ?? $first_traveler->discounted_price ?? $first_traveler->original_price ?? $sale_price);
                }
            }
            
            $seats_available = (int) ($card['seats_available'] ?? 0);
            $is_limited = !empty($card['is_limited']);
            $card_status = $card['status'] ?? 'available';
            $is_sold_out = isset($card['is_sold_out']) && $card['is_sold_out'];
            if ($is_sold_out || $card_status === 'sold_out') {
                $card_status = 'sold_out';
            }

// Match Y-m-d even if DB returns datetime (e.g. 2026-08-13 00:00:00)
$yatra_card_date_norm = static function ($v): string {
    $v = trim((string) $v);
    return preg_match('/^(\d{4}-\d{2}-\d{2})/', $v, $m) ? $m[1] : $v;
};
$sel_norm = $yatra_card_date_norm($selected_date_filter ?? '');
$card_date_norm = $yatra_card_date_norm($card['data_date'] ?? '');
$is_selected_card = ($sel_norm !== '' && $card_date_norm !== '' && $sel_norm === $card_date_norm);
$should_be_open = $is_selected_card || $index === 0;

// Apply Yatra date format to availability header dates when the controller returns ISO.
$yatra_format_card_date_for_display = static function ($value): string {
    $raw = trim((string) $value);
    if ($raw === '') {
        return '';
    }
    // Only transform ISO-like values; leave already-human strings unchanged.
    if (!preg_match('/^\d{4}-\d{2}-\d{2}/', $raw)) {
        return $raw;
    }
    return \Yatra\Helpers\FormatHelper::formatDate($raw);
};

$from_date_display = $yatra_format_card_date_for_display($card['from_date'] ?? '');
$to_date_display = $yatra_format_card_date_for_display($card['to_date'] ?? '');
$date_display_display = $yatra_format_card_date_for_display($card['date_display'] ?? '');
?>
        <div class="yatra-availability-card <?php echo $should_be_open ? 'open' : ''; ?> <?php echo $is_selected_card ? 'selected' : ''; ?> <?php echo $is_limited ? 'limited' : ''; ?> yatra-card-status-<?php echo esc_attr($card_status); ?>"
             data-availability-id="<?php echo esc_attr($item_id); ?>"
             data-month="<?php echo esc_attr($card['data_month'] ?? ''); ?>"
             data-date="<?php echo esc_attr($card['data_date'] ?? ''); ?>"
             data-price="<?php echo esc_attr($sale_price); ?>"
             data-seats="<?php echo esc_attr($seats_available); ?>"
             data-item="<?php echo esc_attr($item_id); ?>"
             data-index="<?php echo esc_attr($index); ?>">
            
            <!-- Card Header (Clickable) -->
            <div class="yatra-availability-card-header yatra-availability-toggle" role="button" tabindex="0" aria-label="<?php esc_attr_e('Toggle availability details', 'yatra'); ?>">
                
                <?php
                // Placeholder for discount badge (will be set after price calculation)
                $final_discount_badge = '';
                ?>
                <?php if (!empty($card['date_display'])): ?>
                <!-- Day Trip: Show date as header -->
                <div class="yatra-card-date-header">
                    <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                    <?php echo esc_html($date_display_display); ?>
                </div>
                <?php endif; ?>
                <div class="yatra-card-header-grid <?php echo !empty($card['date_display']) ? 'yatra-day-trip-grid' : ''; ?>">
                    
                    <!-- Start/Departure -->
                    <div class="yatra-card-header-item">
                        <div class="yatra-card-header-label"><?php echo esc_html($card['from_label'] ?? __('Departure', 'yatra')); ?></div>
                        <div class="yatra-card-header-date"><?php echo esc_html($from_date_display); ?></div>
                        <div class="yatra-card-header-location"><?php echo esc_html($card['from_location'] ?? ''); ?></div>
                    </div>
                    
                    <!-- End/Return -->
                    <div class="yatra-card-header-item">
                        <div class="yatra-card-header-label"><?php echo esc_html($card['to_label'] ?? __('Return', 'yatra')); ?></div>
                        <div class="yatra-card-header-date"><?php echo esc_html($to_date_display); ?></div>
                        <div class="yatra-card-header-location"><?php echo esc_html($card['to_location'] ?? ''); ?></div>
                    </div>
                    
                    <!-- Seats -->
                    <div class="yatra-card-header-item">
                        <div class="yatra-card-header-label"><?php esc_html_e('Seats remaining', 'yatra'); ?></div>
                        <div class="yatra-card-header-seats <?php echo $is_limited ? 'limited' : ''; ?>"><?php echo esc_html($card['seats'] ?? '0'); ?></div>
                        <div class="yatra-card-header-sub"><?php esc_html_e('per departure', 'yatra'); ?></div>
                    </div>
                    
                    <!-- Price -->
                    <div class="yatra-card-header-price">
                        <div class="yatra-card-price-group">
                            <?php 
                            // Pricing is already calculated with dynamic pricing in Controller
                            $display_sale_price = $sale_price;
                            $display_original_price = $original_price;
                            
                            // Show discount badge if there's a discount
                            $final_discount_badge = '';
                            if (!empty($card['discount_text'])) {
                                $final_discount_badge = '<div class="yatra-card-discount-badge yatra-badge-discount">' . esc_html($card['discount_text']) . '</div>';
                            }
                            
                            echo '<span class="yatra-sale-price">' . yatra_format_price($display_sale_price) . '</span>';
                            ?>
                        </div>
                        <span class="yatra-price-label"><?php echo esc_html__('per person', 'yatra'); ?></span>
                    </div>
                    
                    <!-- Toggle Arrow -->
                    <div class="yatra-card-header-arrow">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
                
                <!-- Badges Container (Status + Discount) -->
                <div class="yatra-card-badges-container">
                    <!-- Status Badge -->
                    <?php
                    $card_status = $card['status'] ?? 'available';
                    $is_sold_out = isset($card['is_sold_out']) && $card['is_sold_out'];
                    
                    // Determine status display
                    if ($is_sold_out || $card_status === 'sold_out') {
                        echo '<div class="yatra-badge-status yatra-badge-sold-out">' . esc_html__('Sold Out', 'yatra') . '</div>';
                    } elseif ($card_status === 'limited') {
                        echo '<div class="yatra-badge-status yatra-badge-limited">' . esc_html__('Limited', 'yatra') . '</div>';
                    } elseif ($card_status === 'blocked') {
                        echo '<div class="yatra-badge-status yatra-badge-blocked">' . esc_html__('Blocked', 'yatra') . '</div>';
                    } elseif ($card_status === 'closed') {
                        echo '<div class="yatra-badge-status yatra-badge-closed">' . esc_html__('Closed', 'yatra') . '</div>';
                    } elseif ($card_status === 'cancelled') {
                        echo '<div class="yatra-badge-status yatra-badge-cancelled">' . esc_html__('Cancelled', 'yatra') . '</div>';
                    } else {
                        echo '<div class="yatra-badge-status yatra-badge-available">' . esc_html__('Available', 'yatra') . '</div>';
                    }
                    ?>
                    
                    <!-- Discount Badge -->
                    <?php
                    if (!empty($final_discount_badge)) {
                        echo $final_discount_badge;
                    }
                    ?>
                </div>
            </div>

            <!-- Card Body (Expandable) -->
            <div class="yatra-availability-card-body">
                <div class="yatra-card-body-content">
                    <div class="yatra-card-info-grid">
                        <div class="yatra-card-info-item">
                            <div class="yatra-card-info-icon">
                                <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-card-info-content">
                                <div class="yatra-card-info-label"><?php esc_html_e('Duration', 'yatra'); ?></div>
                                <div class="yatra-card-info-value">
                                    <?php
                                    $duration_days = (int) ($trip_data->duration_days ?? 1);
                                    echo esc_html($duration_days . ' ' . _n('Day', 'Days', $duration_days, 'yatra'));
                                    ?>
                                </div>
                            </div>
                        </div>
                        
                        <div class="yatra-card-info-item">
                            <div class="yatra-card-info-icon">
                                <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-card-info-content">
                                <div class="yatra-card-info-label"><?php esc_html_e('Seats left', 'yatra'); ?></div>
                                <div class="yatra-card-info-value"><?php echo esc_html(sprintf(_n('%d seat', '%d seats', $seats_available, 'yatra'), $seats_available)); ?></div>
                            </div>
                        </div>
                        
                        <?php 
                        $cancellation_policy = '';
                        if (method_exists($trip_data, 'getCancellationPolicy')) {
                            $cancellation_policy = $trip_data->getCancellationPolicy();
                        } elseif (isset($trip_data->cancellation_policy)) {
                            $cancellation_policy = $trip_data->cancellation_policy;
                        }
                        
                        $cancellation_label = '';
                        $cancellation_value = '';
                        if (!empty($cancellation_policy)) {
                            // Extract cancellation info from policy
                            $policy_lower = strtolower($cancellation_policy);
                            if (strpos($policy_lower, 'free') !== false || strpos($policy_lower, 'no charge') !== false) {
                                $cancellation_label = __('Free Cancellation', 'yatra');
                                if (preg_match('/(\d+)\s*(hour|day|week)s?\s*before/i', $cancellation_policy, $matches)) {
                                    $time_value = $matches[1];
                                    $time_unit = $matches[2];
                                    $cancellation_value = sprintf(
                                        __('Up to %d %s%s before', 'yatra'),
                                        $time_value,
                                        $time_unit,
                                        $time_value > 1 ? 's' : ''
                                    );
                                } else {
                                    $cancellation_value = __('No charge', 'yatra');
                                }
                            } else {
                                // Non-free cancellation
                                $cancellation_label = __('Cancellation Policy', 'yatra');
                                $cancellation_value = __('See details', 'yatra');
                            }
                        } else {
                            // Default fallback when no policy is set
                            $cancellation_label = __('Cancellation Policy', 'yatra');
                            $cancellation_value = __('May apply', 'yatra');
                        }
                        ?>
                        <div class="yatra-card-info-item">
                            <div class="yatra-card-info-icon">
                                <?php echo yatra_svg_icon('check', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-card-info-content">
                                <div class="yatra-card-info-label"><?php echo esc_html($cancellation_label); ?></div>
                                <div class="yatra-card-info-value"><?php echo esc_html($cancellation_value); ?></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="yatra-card-traveler-section">
                        <label class="yatra-card-traveler-label"><?php esc_html_e('Travelers', 'yatra'); ?></label>
                        
                        <?php 
                        // Use card-level pricing type as source of truth
                        $card_pricing_type = $card['pricing_type'] ?? $pricing_type ?? 'regular';
                        $card_price_types = [];
                        $dp_enabled = apply_filters('yatra_dynamic_pricing_enabled', false);
                        
                        // Use availability-specific traveler_pricing for traveler-based pricing
                        if ($card_pricing_type === 'traveler_based' && !empty($card['traveler_pricing'])) {
                            $card_price_types = $card['traveler_pricing'];
                        }
                        
                        // Normalize traveler pricing to objects if array
                        $normalized_price_types = [];
                        foreach ($card_price_types as $cpt) {
                            if (is_array($cpt)) {
                                $normalized_price_types[] = (object) $cpt;
                            } else {
                                $normalized_price_types[] = $cpt;
                            }
                        }
                        ?>
                        
                        <?php if ($card_pricing_type === 'traveler_based' && !empty($normalized_price_types)): ?>
                        <!-- Traveler-based pricing: Show dynamic categories -->
                        <?php
                        // Build traveler rows directly from card-level traveler_pricing data
                        $traveler_rows = [];
                        $display_parts = [];
                        foreach ($normalized_price_types as $pt_index => $pt) {
                            $pt_label = $pt->category_label ?? $pt->label ?? __('Traveler', 'yatra');
                            $pt_pricing_mode = $pt->pricing_mode ?? 'per_person';
                            $pt_is_per_group = ($pt_pricing_mode === 'per_group');
                            $pt_category_id = $pt->category_id ?? $pt_index;
                            $pt_default = $pt_index === 0 ? 1 : 0;
                            $pt_min_qty = 0;
                            $pt_max_qty = (int) min($seats_available, $max_travelers);

                            // Determine price with fallback chain
                            $pt_price = 0;
                            if (isset($pt->effective_price) && $pt->effective_price > 0) {
                                $pt_price = (float) $pt->effective_price;
                            } elseif (isset($pt->discounted_price) && $pt->discounted_price > 0) {
                                $pt_price = (float) $pt->discounted_price;
                            } elseif (isset($pt->original_price) && $pt->original_price > 0) {
                                $pt_price = (float) $pt->original_price;
                            }
                            
                            // Apply dynamic pricing to traveler category prices
                            if ($dp_enabled && $pt_price > 0) {
                                $pt_price = apply_filters('yatra_availability_price', $pt_price, $trip_id, [
                                    'departure_date' => $card['date'] ?? null,
                                    'spots_remaining' => $card['spots_remaining'] ?? null,
                                    'availability_id' => $item_id,
                                    'price_type_id' => $pt->id ?? ($pt->price_type_id ?? null),
                                ]);
                            }

                            // Age info
                            $pt_age_text = '';
                            $pt_age_min = isset($pt->age_min) ? (int) $pt->age_min : null;
                            $pt_age_max = isset($pt->age_max) ? (int) $pt->age_max : null;
                            if ($pt_age_min !== null || $pt_age_max !== null) {
                                if ($pt_age_min !== null && $pt_age_max !== null) {
                                    $pt_age_text = sprintf(__('(Age %d-%d)', 'yatra'), $pt_age_min, $pt_age_max);
                                } elseif ($pt_age_min !== null) {
                                    $pt_age_text = sprintf(__('(Age %d+)', 'yatra'), $pt_age_min);
                                } else {
                                    $pt_age_text = sprintf(__('(Up to age %d)', 'yatra'), $pt_age_max);
                                }
                            }
                            
                            // Build pricing label for per_group mode
                            $pricing_label = '';
                            if ($pt_is_per_group) {
                                if (!empty($pt->min_pax) && !empty($pt->max_pax)) {
                                    $pricing_label = sprintf(__('per group (%d-%d pax)', 'yatra'), $pt->min_pax, $pt->max_pax);
                                } elseif (!empty($pt->max_pax)) {
                                    $pricing_label = sprintf(__('per group (up to %d pax)', 'yatra'), $pt->max_pax);
                                } elseif (!empty($pt->min_pax)) {
                                    $pricing_label = sprintf(__('per group (%d+ pax)', 'yatra'), $pt->min_pax);
                                } else {
                                    $pricing_label = __('per group', 'yatra');
                                }
                            }
                            
                            // Build price HTML
                            $pt_price_html = '';
                            if ($pt_price > 0) {
                                $pt_price_html = '<div class="yatra-quantity-price-wrapper">';
                                $pt_price_html .= '<span class="yatra-quantity-price">' . yatra_format_price($pt_price) . '</span>';
                                if ($pt_is_per_group) {
                                    $pt_price_html .= '<span class="yatra-pricing-mode-label yatra-pricing-mode-group">' . esc_html($pricing_label) . '</span>';
                                }
                                $pt_price_html .= '</div>';
                            }

                            $input_id = 'traveler_' . $pt_category_id;

                            $traveler_rows[] = [
                                'label' => $pt_label,
                                'subtitle' => $pt_age_text,
                                'price_html' => $pt_price_html,
                                'row_attrs' => [
                                    'data-category-id' => $pt_category_id,
                                    'data-price' => $pt_price,
                                    'data-pricing-mode' => $pt_pricing_mode,
                                ],
                                'minus_disabled' => $pt_default <= $pt_min_qty,
                                'plus_disabled' => $pt_default >= $pt_max_qty,
                                'minus_attrs' => [
                                    'data-target' => $input_id,
                                    'data-item' => $item_id,
                                    'data-category' => $pt_category_id,
                                    'aria-label' => sprintf(__('Decrease %s', 'yatra'), $pt_label),
                                ],
                                'plus_attrs' => [
                                    'data-target' => $input_id,
                                    'data-item' => $item_id,
                                    'data-category' => $pt_category_id,
                                    'aria-label' => sprintf(__('Increase %s', 'yatra'), $pt_label),
                                ],
                                'input_attrs' => [
                                    'id' => $input_id,
                                    'name' => 'travelers[' . $pt_category_id . ']',
                                    'value' => $pt_default,
                                    'min' => $pt_min_qty,
                                    'max' => $pt_max_qty,
                                    'data-item' => $item_id,
                                    'data-category' => $pt_category_id,
                                    'data-category-label' => $pt_label,
                                    'data-price' => $pt_price,
                                    'data-pricing-mode' => $pt_pricing_mode,
                                ],
                            ];

                            if ($pt_default > 0) {
                                $display_parts[] = $pt_label . ' x ' . $pt_default;
                            }
                        }
                        
                        $traveler_display_text = !empty($display_parts) ? implode(', ', $display_parts) : __('Select travelers', 'yatra');
                        
                        // Setup variables for traveler-selector.php using availability-specific data
                        $root_id = '';
                        $root_class = 'yatra-booking-field-select yatra-participants-select yatra-availability-participants';
                        $container_attrs = [
                            'data-item' => $item_id,
                        ];

                        $display_id = 'participants-display';
                        $display_class = 'yatra-participants-display yatra-availability-participants-display';
                        $display_attrs = [
                            'data-item' => $item_id,
                        ];

                        $dropdown_id = '';
                        $dropdown_class = 'yatra-booking-quantity-selector yatra-availability-quantity-selector';
                        $dropdown_attrs = [
                            'data-item' => $item_id,
                        ];

                        $display_text = $traveler_display_text;
                        $icon_html = yatra_svg_icon('users', 'yatra-icon-sm');
                        $rows = $traveler_rows;

                        include YATRA_PLUGIN_PATH . 'templates/partials/traveler-selector.php';
                        ?>
                        <?php else: ?>
                        <!-- Regular pricing: Show simple number of travelers -->
                        <div class="yatra-booking-travelers-simple yatra-availability-travelers-simple" data-item="<?php echo esc_attr($item_id); ?>">
                            <div class="yatra-booking-field-icon">
                                <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-quantity-controls-inline">
                                <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="num-travelers-<?php echo esc_attr($item_id); ?>" aria-label="<?php esc_attr_e('Decrease travelers', 'yatra'); ?>" disabled>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                    </svg>
                                </button>
                                <input type="number" 
                                       id="num-travelers-<?php echo esc_attr($item_id); ?>" 
                                       class="yatra-quantity-input-simple yatra-availability-num-travelers" 
                                       data-item="<?php echo esc_attr($item_id); ?>"
                                       value="1" 
                                       min="1" 
                                       max="<?php echo esc_attr(min($seats_available, $max_travelers)); ?>" 
                                       readonly
                                       data-price="<?php echo esc_attr($sale_price); ?>">
                                <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="num-travelers-<?php echo esc_attr($item_id); ?>" aria-label="<?php esc_attr_e('Increase travelers', 'yatra'); ?>">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                </button>
                            </div>
                            <span class="yatra-travelers-label"><?php esc_html_e('travelers', 'yatra'); ?></span>
                        </div>
                        <?php endif; ?>

                        <div class="yatra-card-action-help"><?php esc_html_e('Select travelers to update the total, then click Book Now.', 'yatra'); ?></div>
                    </div>
                </div>
                
                <!-- Booking Row at Bottom -->
                <div class="yatra-card-booking-row">
                    <div class="yatra-card-total-box">
                        <div class="yatra-card-total-label"><?php esc_html_e('Total', 'yatra'); ?></div>
                        <div class="yatra-card-total-note" data-item="<?php echo esc_attr($item_id); ?>"><?php esc_html_e('for 1 traveler', 'yatra'); ?></div>
                        <div class="yatra-card-total-amount" data-item="<?php echo esc_attr($item_id); ?>" data-base-price="<?php echo esc_attr($initial_total_price); ?>">
                            <?php 
                            $formatted_total = yatra_format_price($initial_total_price);
                            echo esc_html($formatted_total);
                            ?>
                        </div>
                    </div>
                    <?php 
                    // Prepare price_types JSON for JavaScript
                    $price_types_json = '';
                    if (!empty($normalized_price_types)) {
                        $price_types_for_js = array_map(function($pt) {
                            $pt = (object) $pt;
                            return [
                                'category_id' => $pt->category_id ?? null,
                                'category_label' => $pt->category_label ?? $pt->label ?? '',
                                'original_price' => $pt->original_price ?? 0,
                                'sale_price' => $pt->sale_price ?? null,
                                'discounted_price' => $pt->discounted_price ?? null,
                                'effective_price' => $pt->effective_price ?? $pt->sale_price ?? $pt->discounted_price ?? $pt->original_price ?? 0,
                                'age_min' => $pt->age_min ?? null,
                                'age_max' => $pt->age_max ?? null,
                            ];
                        }, $normalized_price_types);
                        $price_types_json = wp_json_encode($price_types_for_js);
                    }
                    
                    // Get departure time - prefer card data, fallback to from_date if it looks like time
                    $card_departure_time = '';
                    if (!empty($card['departure_time'])) {
                        $card_departure_time = $card['departure_time'];
                    } elseif (!empty($card['from_date']) && preg_match('/^\d{1,2}:\d{2}\s*(AM|PM)?$/i', $card['from_date'])) {
                        $card_departure_time = $card['from_date'];
                    }
                    
                    // Is this a day trip?
                    $is_card_day_trip = !empty($card['is_day_trip']) || !empty($card['date_display']);
                    ?>
                    <button type="button" 
                       class="yatra-card-book-btn" 
                       data-trip-id="<?php echo esc_attr($trip_id); ?>"
                       data-availability-id="<?php echo esc_attr($item_id); ?>"
                       data-date="<?php echo esc_attr($card['data_date'] ?? ''); ?>"
                       data-departure-time="<?php echo esc_attr($card_departure_time); ?>"
                       data-is-day-trip="<?php echo $is_card_day_trip ? '1' : '0'; ?>"
                       data-pricing-type="<?php echo esc_attr($card_pricing_type); ?>"
                       data-price-types="<?php echo esc_attr($price_types_json); ?>"
                       data-price="<?php echo esc_attr($sale_price); ?>"
                       data-item="<?php echo esc_attr($item_id); ?>">
                        <?php echo yatra_svg_icon('shopping-cart', 'yatra-icon-sm'); ?>
                        <span class="yatra-card-book-btn-text">
                            <span class="yatra-card-book-btn-title"><?php esc_html_e('Book Now', 'yatra'); ?></span>
                            <span class="yatra-card-book-btn-subtitle"><?php esc_html_e('Continue to booking', 'yatra'); ?></span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
