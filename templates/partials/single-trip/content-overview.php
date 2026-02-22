<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="overview">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('book-open', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html__('Overview', 'yatra'); ?>
    </h2>
    <div class="yatra-trip-description">
        <?php echo wp_kses_post($trip->description ?? ''); ?>
    </div>

    <?php if (!empty($trip->highlights) && is_array($trip->highlights)): ?>
        <div class="yatra-trip-highlights">
            <?php foreach ($trip->highlights as $highlight): ?>
                <?php if (!empty($highlight)): ?>
                    <div class="yatra-highlight-item">
                        <?php echo yatra_svg_icon('star', 'yatra-highlight-icon'); ?>
                        <p class="yatra-highlight-text"><?php echo esc_html($highlight); ?></p>
                    </div>
                <?php endif; ?>

                <?php
                // Traveler-based pricing without availability setup: render category selector
                $trip_pricing_type = $trip->pricing_type ?? 'regular';
                $trip_price_types = $trip->price_types ?? [];
                if ($trip_pricing_type === 'traveler_based' && !empty($trip_price_types)) :
                    $traveler_rows = [];
                    $traveler_display_text = '';
                    foreach ($trip_price_types as $index => $price_type) {
                        $price_type = (object)$price_type;
                        $pricing_mode = (!empty($price_type->pricing_mode) && $price_type->pricing_mode === 'per_group') ? 'per_group' : 'per_person';
                        $is_per_group = $pricing_mode === 'per_group';
                        $age_info = '';
                        if (isset($price_type->age_min) || isset($price_type->age_max)) {
                            if (isset($price_type->age_min) && isset($price_type->age_max)) {
                                $age_info = sprintf(__('(Age %d-%d)', 'yatra'), $price_type->age_min, $price_type->age_max);
                            } elseif (isset($price_type->age_min)) {
                                $age_info = sprintf(__('(Age %d+)', 'yatra'), $price_type->age_min);
                            } else {
                                $age_info = sprintf(__('(Up to age %d)', 'yatra'), $price_type->age_max);
                            }
                        }
                        $input_id = 'traveler_' . ($price_type->category_id ?? $index);
                        $pt_max_qty = (int)($price_type->max_quantity ?: $trip->max_travelers);
                        $pt_value = ($index === 0) ? 1 : 0;
                        $traveler_rows[] = [
                            'label' => $price_type->category_label ?: __('Traveler', 'yatra'),
                            'subtitle' => $age_info,
                            'price_html' => '<span class="yatra-quantity-price">' . yatra_format_price($price_type->effective_price ?? $price_type->sale_price ?? $price_type->discounted_price ?? $price_type->original_price ?? 0) . '</span>',
                            'row_attrs' => [
                                'data-category-id' => $price_type->category_id ?? $index,
                                'data-price' => $price_type->effective_price ?? $price_type->sale_price ?? $price_type->discounted_price ?? $price_type->original_price ?? 0,
                                'data-pricing-mode' => $pricing_mode,
                            ],
                            'minus_disabled' => ($index !== 0),
                            'plus_disabled' => false,
                            'minus_attrs' => [
                                'data-target' => $input_id,
                                'aria-label' => sprintf(__('Decrease %s', 'yatra'), $price_type->category_label ?? __('Traveler', 'yatra')),
                            ],
                            'plus_attrs' => [
                                'data-target' => $input_id,
                                'aria-label' => sprintf(__('Increase %s', 'yatra'), $price_type->category_label ?? __('Traveler', 'yatra')),
                            ],
                            'input_attrs' => [
                                'id' => $input_id,
                                'name' => 'traveler_counts[' . ($price_type->category_id ?? $index) . ']',
                                'value' => $pt_value,
                                'min' => 0,
                                'max' => $pt_max_qty,
                                'data-category-label' => $price_type->category_label ?? __('Traveler', 'yatra'),
                                'data-price' => $price_type->effective_price ?? $price_type->sale_price ?? $price_type->discounted_price ?? $price_type->original_price ?? 0,
                                'data-pricing-mode' => $pricing_mode,
                            ],
                        ];
                    }
                    $traveler_display_text = !empty($traveler_rows) ? ($traveler_rows[0]['label'] . ' x 1') : __('Traveler x 1', 'yatra');
                    $root_id = '';
                    $root_class = 'yatra-booking-field-select yatra-participants-select';
                    $container_attrs = [];
                    $display_id = 'participants-display';
                    $display_class = 'yatra-participants-display';
                    $display_attrs = [];
                    $dropdown_id = 'quantity-selector';
                    $dropdown_class = 'yatra-booking-quantity-selector';
                    $dropdown_attrs = [];
                    $icon_html = yatra_svg_icon('users', 'yatra-icon-sm');
                    $rows = $traveler_rows;
                    include YATRA_PLUGIN_PATH . 'templates/partials/traveler-selector.php';
                else :
                    ?>
                    <div class="yatra-booking-field-group">
                        <label for="num_travelers"
                               class="yatra-booking-field-label"><?php echo esc_html__('Number of Travelers', 'yatra'); ?></label>
                        <div class="yatra-booking-travelers-simple">
                            <div class="yatra-booking-field-icon">
                                <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                            </div>
                            <div class="yatra-quantity-controls-inline">
                                <button type="button" class="yatra-quantity-btn yatra-quantity-minus"
                                        data-target="num_travelers"
                                        aria-label="<?php esc_attr_e('Decrease travelers', 'yatra'); ?>">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M20 12H4"/>
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
                                <button type="button" class="yatra-quantity-btn yatra-quantity-plus"
                                        data-target="num_travelers"
                                        aria-label="<?php esc_attr_e('Increase travelers', 'yatra'); ?>">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M12 4v16m8-8H4"/>
                                    </svg>
                                </button>
                            </div>
                            <span class="yatra-travelers-range"><?php echo esc_html(sprintf(__('Min: %d, Max: %d', 'yatra'), $trip->min_travelers ?: 1, $trip->max_travelers ?: 20)); ?></span>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <!-- Testimonials Section -->
    <?php 
    $display_testimonials = !empty($trip->testimonials) && is_array($trip->testimonials) ? $trip->testimonials : [];
    if (!empty($display_testimonials)): 
        yatra_get_template('partials/single-trip/testimonials', ['trip' => $trip]);
    endif; 
    ?>

    <div class="yatra-trip-features">
        <div class="yatra-feature-card">
            <?php echo yatra_svg_icon('users', 'yatra-feature-icon'); ?>
            <h3 class="yatra-feature-title"><?php echo esc_html__('Group Size', 'yatra'); ?></h3>
            <p class="yatra-feature-desc"><?php echo esc_html(sprintf(__('%d-%d travelers', 'yatra'), $trip->min_travelers, $trip->max_travelers)); ?></p>
        </div>
        <?php if (!empty($trip->accommodation_type)): ?>
            <div class="yatra-feature-card">
                <?php echo yatra_svg_icon('home', 'yatra-feature-icon'); ?>
                <h3 class="yatra-feature-title"><?php echo esc_html__('Accommodation', 'yatra'); ?></h3>
                <p class="yatra-feature-desc"><?php echo esc_html(ucfirst(str_replace('_', ' ', $trip->accommodation_type))); ?></p>
            </div>
        <?php endif; ?>
        <?php if (!empty($trip->meal_plan)): ?>
            <div class="yatra-feature-card">
                <?php echo yatra_svg_icon('utensils', 'yatra-feature-icon'); ?>
                <h3 class="yatra-feature-title"><?php echo esc_html__('Meals', 'yatra'); ?></h3>
                <p class="yatra-feature-desc"><?php echo esc_html(ucfirst(str_replace('_', ' ', $trip->meal_plan))); ?></p>
            </div>
        <?php endif; ?>
        <?php if (!empty($trip->transportation_included) && $trip->transportation_included): ?>
            <div class="yatra-feature-card">
                <?php echo yatra_svg_icon('truck', 'yatra-feature-icon'); ?>
                <h3 class="yatra-feature-title"><?php echo esc_html__('Transport', 'yatra'); ?></h3>
                <p class="yatra-feature-desc"><?php echo esc_html__('Included', 'yatra'); ?></p>
            </div>
        <?php endif; ?>
        <?php if (!empty($trip->best_season)): ?>
            <div class="yatra-feature-card">
                <?php echo yatra_svg_icon('sun', 'yatra-feature-icon'); ?>
                <h3 class="yatra-feature-title"><?php echo esc_html__('Best Season', 'yatra'); ?></h3>
                <p class="yatra-feature-desc"><?php echo esc_html(ucfirst($trip->best_season)); ?></p>
            </div>
        <?php endif; ?>
    </div>
</section>