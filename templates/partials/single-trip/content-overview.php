<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="overview" itemscope itemtype="https://schema.org/TouristTrip">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('book', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html__('Overview', 'yatra'); ?>
    </h2>
    
    <?php if (!empty($trip->short_description)): ?>
        <div class="yatra-trip-short-description-lead" itemprop="description">
            <?php echo \Yatra\Helpers\FormatHelper::sanitizeQuillHtml($trip->short_description); ?>
        </div>
    <?php endif; ?>
    
    <div class="yatra-trip-description" itemprop="about">
        <?php echo \Yatra\Helpers\FormatHelper::sanitizeQuillHtml($trip->description ?? ''); ?>
    </div>

    <?php if (is_array($trip->highlights) && count($trip->highlights) > 0): ?>
        <div class="yatra-trip-highlights" itemprop="additionalProperty" itemscope itemtype="https://schema.org/PropertyValue">
            <meta itemprop="name" content="<?php esc_attr_e('Trip Highlights', 'yatra'); ?>">
            <?php foreach ($trip->highlights as $index => $highlight): ?>
                <?php if (!empty(trim($highlight))): ?>
                    <div class="yatra-highlight-item" itemprop="value" itemscope itemtype="https://schema.org/Text">
                        <?php echo yatra_svg_icon('star', 'yatra-highlight-icon'); ?>
                        <p class="yatra-highlight-text" itemprop="text"><?php echo esc_html($highlight); ?></p>
                        <meta itemprop="position" content="<?php echo $index + 1; ?>">
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
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
                    $age_info = sprintf(__('Up to age %d)', 'yatra'), $price_type->age_max);
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
                    'type' => 'number',
                    'id' => $input_id,
                    'name' => 'travelers[' . $index . ']',
                    'class' => 'yatra-quantity-input',
                    'value' => $pt_value,
                    'min' => 0,
                    'max' => $pt_max_qty,
                    'data-category-id' => $price_type->category_id ?? $index,
                    'data-price' => $price_type->effective_price ?? $price_type->sale_price ?? $price_type->discounted_price ?? $price_type->original_price ?? 0,
                    'data-pricing-mode' => $pricing_mode,
                ],
            ];
        }
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

    <!-- Testimonials Section -->
    <?php 
    $display_testimonials = !empty($trip->testimonials) && is_array($trip->testimonials) ? $trip->testimonials : [];
    if (!empty($display_testimonials)): 
        yatra_get_template('partials/single-trip/testimonials', ['trip' => $trip]);
    endif; 
    ?>

    </section>

<style>
.yatra-trip-short-description-lead {
    font-size: 1.125rem;
    line-height: 1.7;
    color: #475569;
    font-weight: 500;
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    border-left: 4px solid #3b82f6;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .yatra-trip-short-description-lead {
        color: #cbd5e1;
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        border-left-color: #60a5fa;
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .yatra-trip-short-description-lead {
        font-size: 1rem;
        padding: 16px;
        margin-bottom: 20px;
    }
}
</style>