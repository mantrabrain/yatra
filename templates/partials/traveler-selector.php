<?php
if (!defined('ABSPATH')) {
    exit;
}

$root_id = isset($root_id) ? (string) $root_id : '';
$root_class = isset($root_class) ? (string) $root_class : '';
$display_id = isset($display_id) ? (string) $display_id : '';
$display_class = isset($display_class) ? (string) $display_class : '';
$display_attrs = (isset($display_attrs) && is_array($display_attrs)) ? $display_attrs : [];
$dropdown_id = isset($dropdown_id) ? (string) $dropdown_id : '';
$dropdown_class = isset($dropdown_class) ? (string) $dropdown_class : '';
$display_text = isset($display_text) ? (string) $display_text : '';
$icon_html = isset($icon_html) ? (string) $icon_html : '';
$rows = (isset($rows) && is_array($rows)) ? $rows : [];

$render_attrs = static function(array $attrs): string {
    $out = '';
    foreach ($attrs as $key => $value) {
        if ($value === null) {
            continue;
        }
        if ($value === true) {
            $out .= ' ' . esc_attr((string) $key);
            continue;
        }
        if ($value === false) {
            continue;
        }
        $out .= ' ' . esc_attr((string) $key) . '="' . esc_attr((string) $value) . '"';
    }
    return $out;
};

$container_attrs = (isset($container_attrs) && is_array($container_attrs)) ? $container_attrs : [];
$dropdown_attrs = (isset($dropdown_attrs) && is_array($dropdown_attrs)) ? $dropdown_attrs : [];
?>

<div<?php echo $root_id ? ' id="' . esc_attr($root_id) . '"' : ''; ?> class="<?php echo esc_attr(trim('yatra-traveler-selector ' . $root_class)); ?>"<?php echo $render_attrs($container_attrs); ?>>
    <div class="yatra-booking-field-icon">
        <?php echo $icon_html; ?>
    </div>

    <div<?php echo $display_id ? ' id="' . esc_attr($display_id) . '"' : ''; ?> class="<?php echo esc_attr(trim('yatra-traveler-selector-display ' . $display_class)); ?>"<?php echo $render_attrs($display_attrs); ?>>
        <?php echo esc_html($display_text); ?>
    </div>

    <svg class="yatra-select-arrow yatra-traveler-selector-arrow" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
    </svg>

    <div<?php echo $dropdown_id ? ' id="' . esc_attr($dropdown_id) . '"' : ''; ?> class="<?php echo esc_attr(trim('yatra-traveler-selector-dropdown ' . $dropdown_class)); ?>"<?php echo $render_attrs($dropdown_attrs); ?>>
        <?php foreach ($rows as $row):
            $row_label = isset($row['label']) ? (string) $row['label'] : '';
            $row_subtitle = isset($row['subtitle']) ? (string) $row['subtitle'] : '';
            $row_price_html = isset($row['price_html']) ? (string) $row['price_html'] : '';
            $row_attrs = (isset($row['row_attrs']) && is_array($row['row_attrs'])) ? $row['row_attrs'] : [];
            $minus_attrs = (isset($row['minus_attrs']) && is_array($row['minus_attrs'])) ? $row['minus_attrs'] : [];
            $plus_attrs = (isset($row['plus_attrs']) && is_array($row['plus_attrs'])) ? $row['plus_attrs'] : [];
            $input_attrs = (isset($row['input_attrs']) && is_array($row['input_attrs'])) ? $row['input_attrs'] : [];
            $minus_disabled = !empty($row['minus_disabled']);
            $plus_disabled = !empty($row['plus_disabled']);
        ?>
        <div class="yatra-quantity-row"<?php echo $render_attrs($row_attrs); ?>>
            <div class="yatra-quantity-label">
                <span class="yatra-quantity-title"><?php echo esc_html($row_label); ?></span>
                <?php if (!empty($row_subtitle)): ?>
                <span class="yatra-quantity-subtitle"><?php echo esc_html($row_subtitle); ?></span>
                <?php endif; ?>
                <?php if (!empty($row_price_html)): ?>
                <?php echo wp_kses_post($row_price_html); ?>
                <?php endif; ?>
            </div>
            <div class="yatra-quantity-controls">
                <button type="button" class="yatra-quantity-btn yatra-quantity-minus yatra-qty-btn yatra-qty-minus"<?php echo $minus_disabled ? ' disabled' : ''; ?><?php echo $render_attrs($minus_attrs); ?>>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                    </svg>
                </button>

                <input type="number" class="yatra-quantity-input yatra-availability-category yatra-qty-input" readonly<?php echo $render_attrs($input_attrs); ?>>

                <button type="button" class="yatra-quantity-btn yatra-quantity-plus yatra-qty-btn yatra-qty-plus"<?php echo $plus_disabled ? ' disabled' : ''; ?><?php echo $render_attrs($plus_attrs); ?>>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                </button>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>
