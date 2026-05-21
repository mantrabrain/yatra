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
<section class="yatra-trip-section yatra-availability-section" id="availability" data-trip-id="<?php echo esc_attr($trip_id); ?>">
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

    <?php if (!empty($month_filters)):
        $active_filter = isset($selected_month_filter) && $selected_month_filter !== ''
            ? $selected_month_filter
            : 'all';
    ?>
    <div class="yatra-availability-filters">
        <button type="button" class="yatra-availability-filter-btn <?php echo ($active_filter === 'all') ? 'active' : ''; ?>" data-filter="all"><?php esc_html_e('All Dates', 'yatra'); ?></button>
        <?php foreach ($month_filters as $key => $label): ?>
        <button type="button" class="yatra-availability-filter-btn <?php echo ($active_filter === $key) ? 'active' : ''; ?>" data-filter="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></button>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <?php if (empty($availability_cards)): ?>
    <?php
    $trip_capacity = (int) ($trip_data->max_travelers ?? 20);
    $trip_capacity_display = $trip_capacity > 50 ? '50+' : (string) $trip_capacity;
    $filtered_empty = !empty($availability_filtered_no_results);
    $active_month_key = isset($selected_month_filter) ? (string) $selected_month_filter : 'all';
    $selected_month_human = ($filtered_empty && $active_month_key !== 'all' && isset($month_filters[$active_month_key]))
        ? (string) $month_filters[$active_month_key]
        : '';
    ?>
    <?php if ($filtered_empty): ?>
    <div class="yatra-availability-empty yatra-availability-filter-empty" role="status">
        <div class="yatra-availability-empty-icon">
            <?php echo yatra_svg_icon('calendar', 'yatra-icon-xl'); ?>
        </div>
        <h3><?php esc_html_e('No departures in this period', 'yatra'); ?></h3>
        <?php if ($selected_month_human !== ''): ?>
            <p><?php echo esc_html(sprintf(
                /* translators: %s: Month and year label, e.g. "Apr 2026" */
                __('There are no scheduled departures in %s. Try another month or view all available dates.', 'yatra'),
                $selected_month_human
            )); ?></p>
        <?php else: ?>
            <p><?php esc_html_e('There are no departures for this filter. Try another month or view all available dates.', 'yatra'); ?></p>
        <?php endif; ?>
        <div class="yatra-availability-empty-actions">
            <button type="button" class="yatra-btn yatra-btn-primary yatra-btn-large yatra-availability-show-all-dates">
                <?php esc_html_e('Show all departure dates', 'yatra'); ?>
            </button>
        </div>
    </div>
    <?php else: ?>
    <div class="yatra-availability-empty">
        <div class="yatra-availability-empty-icon">
            <?php echo yatra_svg_icon('calendar-check', 'yatra-icon-xl'); ?>
        </div>
        <h3><?php esc_html_e('Available on Request', 'yatra'); ?></h3>
        <p><?php esc_html_e('This trip is available on request. No specific departure dates are set, so you can book this trip for your preferred dates.', 'yatra'); ?></p>

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
    <?php endif; ?>
    <?php else:
        $availability_total_matching = isset($availability_total_matching) ? (int) $availability_total_matching : count($availability_cards);
        $availability_page = isset($availability_page) ? max(1, (int) $availability_page) : 1;
        $availability_per_page = isset($availability_per_page) ? max(1, (int) $availability_per_page) : 10;
        $availability_has_more = !empty($availability_has_more);
        $availability_loaded_count = isset($availability_loaded_count)
            ? (int) $availability_loaded_count
            : count($availability_cards);
        $remaining_after_load = max(0, $availability_total_matching - $availability_loaded_count);
    ?>
    <div class="yatra-availability-list"
         data-total="<?php echo esc_attr($availability_total_matching); ?>"
         data-displayed="<?php echo esc_attr($availability_loaded_count); ?>"
         data-page="<?php echo esc_attr($availability_page); ?>"
         data-per-page="<?php echo esc_attr($availability_per_page); ?>"
         data-month-filter="<?php echo esc_attr($selected_month_filter ?? 'all'); ?>"
         data-sort="<?php echo esc_attr($sort_key); ?>">
        <?php
        foreach ($availability_cards as $index => $card) {
            include YATRA_PLUGIN_PATH . 'templates/partials/availability-card.php';
        }
        ?>
    </div>

    <?php if ($availability_has_more): ?>
    <div class="yatra-availability-load-more"
         data-per-page="<?php echo esc_attr($availability_per_page); ?>"
         data-current-page="<?php echo esc_attr($availability_page); ?>"
         data-total="<?php echo esc_attr($availability_total_matching); ?>"
         data-loaded="<?php echo esc_attr($availability_loaded_count); ?>"
         data-month-filter="<?php echo esc_attr($selected_month_filter ?? 'all'); ?>"
         data-sort="<?php echo esc_attr($sort_key); ?>">
        <button type="button" class="yatra-availability-load-more-btn">
            <?php echo yatra_svg_icon('plus', 'yatra-icon-sm'); ?>
            <?php
            /* translators: %d: number of additional departures still available to load. */
            echo esc_html(sprintf(__('Load more departures (%d remaining)', 'yatra'), $remaining_after_load));
            ?>
        </button>
        <span class="yatra-availability-count-info">
            <?php echo esc_html(sprintf(
                /* translators: 1: number of departures currently loaded, 2: total number of departures matching the filter. */
                __('Showing %1$d of %2$d departures', 'yatra'),
                $availability_loaded_count,
                $availability_total_matching
            )); ?>
        </span>
    </div>
    <?php endif; ?>
    <?php endif; ?>
</section>

