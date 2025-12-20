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
    <?php 
    // Get trip capacity for fallback display
    $trip_capacity = (int) ($trip_data->max_travelers ?? 20);
    $trip_capacity_display = $trip_capacity > 50 ? '50+' : (string) $trip_capacity;
    ?>
    <div class="yatra-availability-empty">
        <div class="yatra-availability-empty-icon">
            <?php echo yatra_svg_icon('calendar-check', 'yatra-icon-xl'); ?>
        </div>
        <h3><?php esc_html_e('Available on Request', 'yatra'); ?></h3>
        <p><?php esc_html_e('This trip is available on request. No specific departure dates are set, so you can book this trip for your preferred dates.', 'yatra'); ?></p>
        
        <!-- Show capacity information -->
        <div class="yatra-availability-empty-info">
            <div class="yatra-availability-empty-info-item">
                <div class="yatra-availability-empty-info-icon">
                    <?php echo yatra_svg_icon('users', 'yatra-icon-md'); ?>
                </div>
                <div class="yatra-availability-empty-info-text">
                    <span class="yatra-availability-empty-info-label"><?php esc_html_e('Capacity', 'yatra'); ?></span>
                    <span class="yatra-availability-empty-info-value"><?php echo esc_html($trip_capacity_display); ?> <?php esc_html_e('travelers', 'yatra'); ?></span>
                </div>
            </div>
            <div class="yatra-availability-empty-info-item">
                <div class="yatra-availability-empty-info-icon">
                    <?php echo yatra_svg_icon('calendar', 'yatra-icon-md'); ?>
                </div>
                <div class="yatra-availability-empty-info-text">
                    <span class="yatra-availability-empty-info-label"><?php esc_html_e('Booking', 'yatra'); ?></span>
                    <span class="yatra-availability-empty-info-value"><?php esc_html_e('Flexible dates', 'yatra'); ?></span>
                </div>
            </div>
        </div>
        
        <div class="yatra-availability-empty-actions">
            <button type="button" class="yatra-btn yatra-btn-primary yatra-btn-large" onclick="yatraBookNow()">
                <?php esc_html_e('Book Now', 'yatra'); ?>
            </button>
            <button type="button" class="yatra-btn yatra-btn-outline yatra-btn-large" onclick="yatraMakeEnquiry()">
                <?php esc_html_e('Make Enquiry', 'yatra'); ?>
            </button>
        </div>
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
            
            // Get pricing from card (already calculated with dynamic pricing in Controller)
            $sale_price = (float) ($card['sale_price'] ?? 0);
            $original_price = (float) ($card['original_price'] ?? 0);
            $seats_available = (int) ($card['seats_available'] ?? 0);
            $is_limited = !empty($card['is_limited']);
            $card_status = $card['status'] ?? 'available';
            $is_sold_out = isset($card['is_sold_out']) && $card['is_sold_out'];
            if ($is_sold_out || $card_status === 'sold_out') {
                $card_status = 'sold_out';
            }
        ?>
        <div class="yatra-availability-card <?php echo $index === 0 ? 'open' : ''; ?> <?php echo $is_limited ? 'limited' : ''; ?> <?php echo $is_hidden ? 'yatra-hidden-departure' : ''; ?> yatra-card-status-<?php echo esc_attr($card_status); ?>"
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

