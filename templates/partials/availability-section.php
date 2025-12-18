<?php
/**
 * Availability Section Template
 * 
 * Displays the trip availability dates with pricing, seats, and booking options.
 * 
 * @package Yatra
 * @var object $trip_data Trip data object
 * @var array $availability_cards Prepared availability cards data
 * @var array $month_filters Month filter buttons data
 */

defined('ABSPATH') || exit;

// Ensure required variables exist
$trip_data = $trip_data ?? (object) [];
$availability_cards = $availability_cards ?? [];
$month_filters = $month_filters ?? [];

$sort_key = isset($sort_key) ? (string) $sort_key : 'date-asc';

$trip_id = !empty($trip_data->id) ? (int) $trip_data->id : 0;
$max_travelers = (int) ($trip_data->max_travelers ?? 20);
?>
<section class="yatra-trip-section yatra-availability-section" id="availability">
    <div class="yatra-availability-header">
        <div class="yatra-availability-header-top">
            <h2 class="yatra-trip-section-title">
                <?php echo yatra_svg_icon('calendar', 'yatra-trip-section-title-icon'); ?>
                <?php esc_html_e('Availability', 'yatra'); ?>
            </h2>
            <div class="yatra-availability-sort">
                <select class="yatra-availability-sort-select" id="availability-sort">
                    <option value="date-asc" <?php selected($sort_key, 'date-asc'); ?>><?php esc_html_e('Sort by: Date (Earliest)', 'yatra'); ?></option>
                    <option value="date-desc" <?php selected($sort_key, 'date-desc'); ?>><?php esc_html_e('Sort by: Date (Latest)', 'yatra'); ?></option>
                    <option value="price-asc" <?php selected($sort_key, 'price-asc'); ?>><?php esc_html_e('Sort by: Price (Low to High)', 'yatra'); ?></option>
                    <option value="price-desc" <?php selected($sort_key, 'price-desc'); ?>><?php esc_html_e('Sort by: Price (High to Low)', 'yatra'); ?></option>
                    <option value="seats-desc" <?php selected($sort_key, 'seats-desc'); ?>><?php esc_html_e('Sort by: Availability (Most)', 'yatra'); ?></option>
                </select>
            </div>
        </div>
        <p class="yatra-availability-subtitle"><?php esc_html_e('Choose your preferred departure date and book your spot', 'yatra'); ?></p>
    </div>

    <?php if (!empty($month_filters)): ?>
    <div class="yatra-availability-filters">
        <button type="button" class="yatra-availability-filter-btn active" data-filter="all"><?php esc_html_e('All Dates', 'yatra'); ?></button>
        <?php foreach ($month_filters as $key => $label): ?>
        <button type="button" class="yatra-availability-filter-btn" data-filter="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></button>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <?php if (empty($availability_cards)): ?>
    <div class="yatra-availability-empty">
        <div class="yatra-availability-empty-icon">
            <?php echo yatra_svg_icon('calendar', 'yatra-icon-xl'); ?>
        </div>
        <h3><?php esc_html_e('No Departures Available', 'yatra'); ?></h3>
        <p><?php esc_html_e('There are currently no scheduled departures for this trip. Please check back later or make an enquiry.', 'yatra'); ?></p>
    </div>
    <?php else: 
        $initial_display_count = 10; // Show first 10 departures
        $total_cards = count($availability_cards);
        $has_more = $total_cards > $initial_display_count;
    ?>
    <div class="yatra-availability-list" data-total="<?php echo esc_attr($total_cards); ?>" data-displayed="<?php echo esc_attr(min($initial_display_count, $total_cards)); ?>">
        <?php foreach ($availability_cards as $index => $card): 
            $is_hidden = $index >= $initial_display_count; 
            $item_id = isset($card['id']) ? (string) $card['id'] : (string) $index;
            $sale_price = (float) ($card['sale_price'] ?? 0);
            $original_price = (float) ($card['original_price'] ?? $sale_price);
            $seats_available = (int) ($card['seats_available'] ?? 0);
            $is_limited = !empty($card['is_limited']);
        ?>
        <div class="yatra-availability-card <?php echo $index === 0 ? 'open' : ''; ?> <?php echo $is_limited ? 'limited' : ''; ?> <?php echo $is_hidden ? 'yatra-hidden-departure' : ''; ?>"
             data-availability-id="<?php echo esc_attr($item_id); ?>"
             data-month="<?php echo esc_attr($card['data_month'] ?? ''); ?>"
             data-date="<?php echo esc_attr($card['data_date'] ?? ''); ?>"
             data-price="<?php echo esc_attr($sale_price); ?>"
             data-seats="<?php echo esc_attr($seats_available); ?>"
             data-item="<?php echo esc_attr($item_id); ?>"
             data-index="<?php echo esc_attr($index); ?>"
             <?php if ($is_hidden): ?>style="display: none;"<?php endif; ?>>
            
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
                    <?php echo esc_html($card['date_display']); ?>
                </div>
                <?php endif; ?>
                <div class="yatra-card-header-grid <?php echo !empty($card['date_display']) ? 'yatra-day-trip-grid' : ''; ?>">
                    <!-- Start/Departure -->
                    <div class="yatra-card-header-item">
                        <div class="yatra-card-header-label"><?php echo esc_html($card['from_label'] ?? __('Departure', 'yatra')); ?></div>
                        <div class="yatra-card-header-date"><?php echo esc_html($card['from_date'] ?? ''); ?></div>
                        <div class="yatra-card-header-location"><?php echo esc_html($card['from_location'] ?? ''); ?></div>
                    </div>
                    
                    <!-- End/Return -->
                    <div class="yatra-card-header-item">
                        <div class="yatra-card-header-label"><?php echo esc_html($card['to_label'] ?? __('Return', 'yatra')); ?></div>
                        <div class="yatra-card-header-date"><?php echo esc_html($card['to_date'] ?? ''); ?></div>
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
                            // Determine which price to show based on pricing type
                            $card_pricing_type = $card['pricing_type'] ?? $pricing_type ?? 'regular';
                            $display_original_price = $original_price;
                            $display_sale_price = $sale_price;
                            
                            // For traveler-based pricing, show "From" price (lowest category price)
                            if ($card_pricing_type === 'traveler_based' && !empty($card['traveler_pricing'])) {
                                $min_price = PHP_FLOAT_MAX;
                                foreach ($card['traveler_pricing'] as $pt) {
                                    $pt_obj = is_array($pt) ? (object) $pt : $pt;
                                    $pt_price = 0;
                                    if (isset($pt_obj->effective_price) && $pt_obj->effective_price > 0) {
                                        $pt_price = (float) $pt_obj->effective_price;
                                    } elseif (isset($pt_obj->sale_price) && $pt_obj->sale_price > 0) {
                                        $pt_price = (float) $pt_obj->sale_price;
                                    } elseif (isset($pt_obj->discounted_price) && $pt_obj->discounted_price > 0) {
                                        $pt_price = (float) $pt_obj->discounted_price;
                                    } elseif (isset($pt_obj->original_price) && $pt_obj->original_price > 0) {
                                        $pt_price = (float) $pt_obj->original_price;
                                    }
                                    if ($pt_price > 0 && $pt_price < $min_price) {
                                        $min_price = $pt_price;
                                    }
                                }
                                if ($min_price < PHP_FLOAT_MAX) {
                                    $display_sale_price = $min_price;
                                    $display_original_price = $min_price;
                                }
                            }
                            
                            // DEBUG: Dynamic Pricing
                            $dp_enabled = apply_filters('yatra_dynamic_pricing_enabled', false);
                            $original_before = $display_original_price;
                            $sale_before = $display_sale_price;
                            
                            // Apply dynamic pricing if module is enabled
                            if ($dp_enabled) {
                                $display_original_price = apply_filters('yatra_availability_price', $display_original_price, $trip_id, [
                                    'departure_date' => $card['date'] ?? null,
                                    'spots_remaining' => $card['spots_remaining'] ?? null,
                                    'availability_id' => $item_id,
                                ]);
                                $display_sale_price = apply_filters('yatra_availability_price', $display_sale_price, $trip_id, [
                                    'departure_date' => $card['date'] ?? null,
                                    'spots_remaining' => $card['spots_remaining'] ?? null,
                                    'availability_id' => $item_id,
                                ]);
                            }
                            
                            // Calculate total discount (regular discount + dynamic pricing)
                            $total_discount_percent = 0;
                            
                            // For badge calculation, use the actual prices being compared
                            // For traveler-based pricing, use sale_before as the "original" since that's the base price
                            $badge_original_price = $sale_before > 0 ? $sale_before : $original_price;
                            $badge_final_price = $display_sale_price;
                            
                            // Check if dynamic pricing changed the price
                            if ($sale_before > 0 && $display_sale_price != $sale_before) {
                                $dynamic_change = (($display_sale_price - $sale_before) / $sale_before) * 100;
                            } else {
                                $dynamic_change = 0;
                            }
                            
                            // Calculate discount/increase percentage
                            if ($badge_original_price > 0 && $badge_final_price < $badge_original_price) {
                                // Price decreased - show discount
                                $total_discount_percent = round((($badge_original_price - $badge_final_price) / $badge_original_price) * 100);
                            } elseif ($dynamic_change > 0) {
                                // Price increased
                                $total_discount_percent = round($dynamic_change);
                            }
                            
                            // Create single badge showing total discount or price increase
                            if ($total_discount_percent > 0 && $badge_final_price < $badge_original_price) {
                                // Discount - show green badge with "OFF"
                                $final_discount_badge = '<div class="yatra-card-discount-badge yatra-badge-discount">' . $total_discount_percent . '% OFF</div>';
                            } elseif ($dynamic_change > 0 && $badge_final_price > $badge_original_price) {
                                // Price increase - show red badge with "HIGHER"
                                $final_discount_badge = '<div class="yatra-card-discount-badge yatra-badge-higher">+' . abs(round($dynamic_change)) . '% HIGHER</div>';
                            }
                            
                            // DEBUG OUTPUT
                            echo '<!-- DYNAMIC PRICING DEBUG -->';
                            echo '<!-- Module Enabled: ' . ($dp_enabled ? 'YES' : 'NO') . ' -->';
                            echo '<!-- Departure Date: ' . ($card['date'] ?? 'null') . ' -->';
                            echo '<!-- Trip ID: ' . $trip_id . ' -->';
                            echo '<!-- Original Price: ' . $original_price . ' -->';
                            echo '<!-- Sale Price Before Dynamic: ' . $sale_before . ' -->';
                            echo '<!-- Final Price After Dynamic: ' . $display_sale_price . ' -->';
                            echo '<!-- Regular Discount: ' . round($regular_discount) . '% -->';
                            echo '<!-- Dynamic Change: ' . round($dynamic_change) . '% -->';
                            echo '<!-- Total Discount: ' . $total_discount_percent . '% -->';
                            echo '<!-- END DEBUG -->';
                            ?>
                            <?php if ($card_pricing_type === 'traveler_based'): ?>
                            <span class="yatra-card-price-prefix"><?php esc_html_e('From', 'yatra'); ?></span>
                            <?php endif; ?>
                            <?php if ($display_original_price > $display_sale_price): ?>
                            <span class="yatra-card-price-original"><?php echo esc_html(yatra_format_price($display_original_price)); ?></span>
                            <?php endif; ?>
                            <span class="yatra-card-price-sale"><?php echo esc_html(yatra_format_price($display_sale_price)); ?></span>
                        </div>
                    </div>
                    
                    <!-- Arrow -->
                    <div class="yatra-card-header-arrow">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
                
                <?php
                // DEBUG: Check if badge variable is set
                echo '<!-- BADGE DEBUG: final_discount_badge = ' . (!empty($final_discount_badge) ? 'SET' : 'EMPTY') . ' -->';
                if (!empty($final_discount_badge)) {
                    echo '<!-- BADGE HTML: ' . esc_html($final_discount_badge) . ' -->';
                }
                
                // Output the discount badge at card header level (top-right corner)
                if (!empty($final_discount_badge)) {
                    echo $final_discount_badge;
                }
                ?>
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
                        
                        <div class="yatra-card-info-item">
                            <div class="yatra-card-info-icon">
                                <?php echo yatra_svg_icon('check', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-card-info-content">
                                <div class="yatra-card-info-label"><?php esc_html_e('Free Cancellation', 'yatra'); ?></div>
                                <div class="yatra-card-info-value"><?php esc_html_e('Up to 24 hours before', 'yatra'); ?></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="yatra-card-traveler-section">
                        <label class="yatra-card-traveler-label"><?php esc_html_e('Travelers', 'yatra'); ?></label>
                        
                        <?php 
                        // Use card-specific pricing (priority: availability date > rule > trip)
                        $card_pricing_type = $card['pricing_type'] ?? $pricing_type ?? 'regular';
                        $card_price_types = $card['traveler_pricing'] ?? [];
                        
                        // If empty, fallback to trip-level price_types
                        if (empty($card_price_types) && $card_pricing_type === 'traveler_based' && !empty($price_types)) {
                            $card_price_types = $price_types;
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
                        $first_category = isset($normalized_price_types[0]) ? $normalized_price_types[0] : null;
                        $first_label = '';
                        if ($first_category) {
                            $first_label = $first_category->category_label ?? $first_category->label ?? __('Traveler', 'yatra');
                        }
                        $traveler_display_text = ($first_label ?: __('Traveler', 'yatra')) . ' x 1';

                        $traveler_rows = [];
                        foreach ($normalized_price_types as $pt_index => $pt) {
                            $pt_min = isset($pt->age_min) ? (int) $pt->age_min : 0;
                            $pt_max = isset($pt->age_max) ? (int) $pt->age_max : 99;
                            $pt_label = $pt->category_label ?? $pt->label ?? __('Traveler', 'yatra');
                            $pt_age_text = ($pt_min > 0 || $pt_max < 99) ? sprintf(__('(Age %d-%d)', 'yatra'), $pt_min, $pt_max) : '';
                            $pt_default = $pt_index === 0 ? 1 : 0;

                            $pt_price = 0;
                            if (isset($pt->effective_price) && $pt->effective_price > 0) {
                                $pt_price = (float) $pt->effective_price;
                            } elseif (isset($pt->sale_price) && $pt->sale_price > 0) {
                                $pt_price = (float) $pt->sale_price;
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

                            $pt_category_id = $pt->category_id ?? $pt_index;
                            $pt_min_qty = 0;
                            $pt_max_qty = (int) min($seats_available, $max_travelers);

                            $traveler_rows[] = [
                                'label' => $pt_label,
                                'subtitle' => $pt_age_text,
                                'price_html' => $pt_price > 0 ? esc_html(yatra_format_price($pt_price)) : '',
                                'row_attrs' => [
                                    'data-category-id' => $pt_category_id,
                                    'data-price' => $pt_price,
                                ],
                                'minus_disabled' => $pt_default <= $pt_min_qty,
                                'plus_disabled' => $pt_default >= $pt_max_qty,
                                'minus_attrs' => [
                                    'data-item' => $item_id,
                                    'data-category' => $pt_category_id,
                                    'aria-label' => __('Decrease', 'yatra'),
                                ],
                                'plus_attrs' => [
                                    'data-item' => $item_id,
                                    'data-category' => $pt_category_id,
                                    'aria-label' => __('Increase', 'yatra'),
                                ],
                                'input_attrs' => [
                                    'data-item' => $item_id,
                                    'data-category' => $pt_category_id,
                                    'value' => $pt_default,
                                    'min' => $pt_min_qty,
                                    'max' => $pt_max_qty,
                                ],
                            ];
                        }

                        $root_id = '';
                        $root_class = 'yatra-booking-field-select yatra-participants-select yatra-availability-participants';
                        $container_attrs = [
                            'data-item' => $item_id,
                        ];

                        $display_id = '';
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
                        <div class="yatra-card-total-amount" data-item="<?php echo esc_attr($item_id); ?>" data-base-price="<?php echo esc_attr($display_sale_price ?? $sale_price); ?>">
                            <?php echo esc_html(yatra_format_price($display_sale_price ?? $sale_price)); ?>
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
        <?php endforeach; ?>
    </div>

    <?php if ($has_more): ?>
    <div class="yatra-availability-load-more" data-per-page="10" data-current-page="1" data-total-pages="<?php echo esc_attr(ceil($total_cards / $initial_display_count)); ?>">
        <button type="button" class="yatra-availability-load-more-btn">
            <?php echo yatra_svg_icon('plus', 'yatra-icon-sm'); ?>
            <?php echo esc_html(sprintf(__('Load more departures (%d remaining)', 'yatra'), $total_cards - $initial_display_count)); ?>
        </button>
        <span class="yatra-availability-count-info">
            <?php echo esc_html(sprintf(__('Showing %d of %d departures', 'yatra'), min($initial_display_count, $total_cards), $total_cards)); ?>
        </span>
    </div>
    <?php endif; ?>
    <?php endif; ?>
</section>

