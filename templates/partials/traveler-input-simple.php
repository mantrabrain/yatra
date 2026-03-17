<?php
if (!defined('ABSPATH')) {
    exit;
}

// Simple Traveler Input for Regular Pricing (NO DROPDOWN)
// Expected variables: $input_id, $input_name, $value, $min, $max, $range_text
?>
<div class="yatra-booking-travelers-simple">
    <div class="yatra-booking-field-icon">
        <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
    </div>
    <div class="yatra-quantity-controls-inline">
        <button type="button" class="yatra-quantity-btn yatra-quantity-minus" data-target="<?php echo esc_attr($input_id); ?>" aria-label="<?php esc_attr_e('Decrease travelers', 'yatra'); ?>">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
        </button>
        <input type="number"
               id="<?php echo esc_attr($input_id); ?>"
               name="<?php echo esc_attr($input_name); ?>"
               class="yatra-quantity-input-simple"
               value="<?php echo esc_attr($value); ?>"
               min="<?php echo esc_attr($min); ?>"
               max="<?php echo esc_attr($max); ?>"
               readonly
               <?php echo isset($data_price) ? 'data-price="' . esc_attr($data_price) . '"' : ''; ?>>
        <button type="button" class="yatra-quantity-btn yatra-quantity-plus" data-target="<?php echo esc_attr($input_id); ?>" aria-label="<?php esc_attr_e('Increase travelers', 'yatra'); ?>">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
        </button>
    </div>
    <?php if (isset($range_text)): ?>
        <span class="yatra-travelers-range"><?php echo esc_html($range_text); ?></span>
    <?php endif; ?>
</div>
