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
                    <option value="date-asc"><?php esc_html_e('Sort by: Date (Earliest)', 'yatra'); ?></option>
                    <option value="date-desc"><?php esc_html_e('Sort by: Date (Latest)', 'yatra'); ?></option>
                    <option value="price-asc"><?php esc_html_e('Sort by: Price (Low to High)', 'yatra'); ?></option>
                    <option value="price-desc"><?php esc_html_e('Sort by: Price (High to Low)', 'yatra'); ?></option>
                    <option value="seats-desc"><?php esc_html_e('Sort by: Availability (Most)', 'yatra'); ?></option>
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
    <?php else: ?>
    <div class="yatra-availability-list">
        <?php foreach ($availability_cards as $index => $card): 
            $item_id = isset($card['id']) ? (string) $card['id'] : (string) $index;
            $sale_price = (float) ($card['sale_price'] ?? 0);
            $original_price = (float) ($card['original_price'] ?? $sale_price);
            $seats_available = (int) ($card['seats_available'] ?? 0);
            $is_limited = !empty($card['is_limited']);
        ?>
        <div class="yatra-availability-card <?php echo $index === 0 ? 'open' : ''; ?> <?php echo $is_limited ? 'limited' : ''; ?>"
             data-availability-id="<?php echo esc_attr($item_id); ?>"
             data-month="<?php echo esc_attr($card['data_month'] ?? ''); ?>"
             data-date="<?php echo esc_attr($card['data_date'] ?? ''); ?>"
             data-price="<?php echo esc_attr($sale_price); ?>"
             data-seats="<?php echo esc_attr($seats_available); ?>"
             data-item="<?php echo esc_attr($item_id); ?>">
            
            <!-- Card Header (Clickable) -->
            <div class="yatra-availability-card-header yatra-availability-toggle" role="button" tabindex="0" aria-label="<?php esc_attr_e('Toggle availability details', 'yatra'); ?>">
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
                        <?php if (!empty($card['discount_text'])): ?>
                        <div class="yatra-card-discount-badge"><?php echo esc_html($card['discount_text']); ?></div>
                        <?php endif; ?>
                        <div class="yatra-card-price-group">
                            <?php if ($original_price > $sale_price): ?>
                            <span class="yatra-card-price-original"><?php echo esc_html(yatra_format_price($original_price)); ?></span>
                            <?php endif; ?>
                            <span class="yatra-card-price-sale"><?php echo esc_html(yatra_format_price($sale_price)); ?></span>
                        </div>
                    </div>
                    
                    <!-- Arrow -->
                    <div class="yatra-card-header-arrow">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Card Body (Expandable) -->
            <div class="yatra-availability-card-body">
                <div class="yatra-card-body-content">
                    <div class="yatra-card-tour-header">
                        <h4 class="yatra-card-tour-title"><?php echo esc_html($card['title'] ?? ''); ?></h4>
                        <div class="yatra-card-tour-meta">
                            <span class="yatra-card-tour-type"><?php echo esc_html($card['type'] ?? __('Group Departure', 'yatra')); ?></span>
                            <span class="yatra-card-tour-separator">•</span>
                            <span class="yatra-card-tour-location"><?php echo esc_html($card['from_location'] ?? ''); ?></span>
                        </div>
                    </div>
                    
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
                                <div class="yatra-card-info-label"><?php esc_html_e('Group Size', 'yatra'); ?></div>
                                <div class="yatra-card-info-value"><?php echo esc_html(sprintf(__('Up to %d travelers', 'yatra'), $max_travelers)); ?></div>
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
                    
                    <div class="yatra-card-timeline">
                        <div class="yatra-timeline-item">
                            <div class="yatra-timeline-dot yatra-timeline-dot-start"></div>
                            <div class="yatra-timeline-content">
                                <div class="yatra-timeline-label"><?php esc_html_e('Trip start', 'yatra'); ?></div>
                                <div class="yatra-timeline-date"><?php echo esc_html($card['start_date'] ?? $card['from_date'] ?? ''); ?></div>
                                <div class="yatra-timeline-location"><?php echo esc_html($card['start_location'] ?? $card['from_location'] ?? ''); ?></div>
                            </div>
                        </div>
                        <div class="yatra-timeline-item">
                            <div class="yatra-timeline-dot yatra-timeline-dot-end"></div>
                            <div class="yatra-timeline-content">
                                <div class="yatra-timeline-label"><?php esc_html_e('Trip end', 'yatra'); ?></div>
                                <div class="yatra-timeline-date"><?php echo esc_html($card['end_date'] ?? $card['to_date'] ?? ''); ?></div>
                                <div class="yatra-timeline-location"><?php echo esc_html($card['end_location'] ?? $card['to_location'] ?? ''); ?></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="yatra-card-traveler-section">
                        <label class="yatra-card-traveler-label"><?php esc_html_e('Travelers', 'yatra'); ?></label>
                        
                        <?php if (!empty($pricing_type) && $pricing_type === 'traveler_based' && !empty($price_types)): ?>
                        <!-- Traveler-based pricing: Show dynamic categories from settings -->
                        <div class="yatra-booking-field-select yatra-participants-select yatra-availability-participants" data-item="<?php echo esc_attr($item_id); ?>">
                            <div class="yatra-booking-field-icon">
                                <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-participants-display yatra-availability-participants-display" data-item="<?php echo esc_attr($item_id); ?>">
                                <?php 
                                $first_category = isset($price_types[0]) ? $price_types[0] : null;
                                echo esc_html(($first_category && !empty($first_category->category_label) ? $first_category->category_label : __('Traveler', 'yatra')) . ' x 1');
                                ?>
                            </div>
                            <svg class="yatra-select-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                            <div class="yatra-booking-quantity-selector yatra-availability-quantity-selector" data-item="<?php echo esc_attr($item_id); ?>">
                                <?php foreach ($price_types as $pt_index => $pt): 
                                    $pt_min = isset($pt->age_min) ? (int) $pt->age_min : 0;
                                    $pt_max = isset($pt->age_max) ? (int) $pt->age_max : 99;
                                    $pt_label = !empty($pt->category_label) ? $pt->category_label : __('Traveler', 'yatra');
                                    $pt_age_text = ($pt_min > 0 || $pt_max < 99) ? sprintf(__('(Age %d-%d)', 'yatra'), $pt_min, $pt_max) : '';
                                    $pt_default = $pt_index === 0 ? 1 : 0;
                                    $pt_price = isset($pt->effective_price) ? (float) $pt->effective_price : 0;
                                ?>
                                <div class="yatra-quantity-row" data-category-id="<?php echo esc_attr($pt->category_id ?? $pt_index); ?>" data-price="<?php echo esc_attr($pt_price); ?>">
                                    <div class="yatra-quantity-label">
                                        <span class="yatra-quantity-title"><?php echo esc_html($pt_label); ?></span>
                                        <?php if ($pt_age_text): ?>
                                        <span class="yatra-quantity-subtitle"><?php echo esc_html($pt_age_text); ?></span>
                                        <?php endif; ?>
                                    </div>
                                    <div class="yatra-quantity-controls">
                                        <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="category-<?php echo esc_attr($pt->category_id ?? $pt_index); ?>" data-item="<?php echo esc_attr($item_id); ?>" aria-label="<?php esc_attr_e('Decrease', 'yatra'); ?>" <?php echo $pt_default <= 0 ? 'disabled' : ''; ?>>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                                            </svg>
                                        </button>
                                        <input type="number" class="yatra-quantity-input yatra-availability-category" data-item="<?php echo esc_attr($item_id); ?>" data-category="<?php echo esc_attr($pt->category_id ?? $pt_index); ?>" value="<?php echo esc_attr($pt_default); ?>" min="0" max="<?php echo esc_attr(min($seats_available, $max_travelers)); ?>" readonly>
                                        <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="category-<?php echo esc_attr($pt->category_id ?? $pt_index); ?>" data-item="<?php echo esc_attr($item_id); ?>" aria-label="<?php esc_attr_e('Increase', 'yatra'); ?>">
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
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
                    </div>
                </div>
                
                <!-- Booking Row at Bottom -->
                <div class="yatra-card-booking-row">
                    <div class="yatra-card-total-box">
                        <div class="yatra-card-total-label"><?php esc_html_e('Total', 'yatra'); ?></div>
                        <div class="yatra-card-total-note" data-item="<?php echo esc_attr($item_id); ?>"><?php esc_html_e('for 1 traveler', 'yatra'); ?></div>
                        <div class="yatra-card-total-amount" data-item="<?php echo esc_attr($item_id); ?>" data-base-price="<?php echo esc_attr($sale_price); ?>">
                            <?php echo esc_html(yatra_format_price($sale_price)); ?>
                        </div>
                    </div>
                    <button type="button" 
                       class="yatra-card-book-btn" 
                       data-trip-id="<?php echo esc_attr($trip_id); ?>"
                       data-availability-id="<?php echo esc_attr($item_id); ?>"
                       data-date="<?php echo esc_attr($card['data_date'] ?? ''); ?>"
                       data-price="<?php echo esc_attr($sale_price); ?>"
                       data-item="<?php echo esc_attr($item_id); ?>">
                        <?php echo yatra_svg_icon('shopping-cart', 'yatra-icon-sm'); ?>
                        <?php esc_html_e('Book Now', 'yatra'); ?>
                    </button>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <?php if (count($availability_cards) > 5): ?>
    <div class="yatra-availability-load-more">
        <button type="button" class="yatra-availability-load-more-btn"><?php esc_html_e('Load more departures', 'yatra'); ?></button>
    </div>
    <?php endif; ?>
    <?php endif; ?>
</section>

