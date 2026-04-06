<?php
if (!defined('ABSPATH')) {
    exit;
}

// Trip Attributes Section for Single Trip Page
// Expected variables: $trip
?>
<div class="yatra-trip-attributes">
    <div class="yatra-section-header">
        <h2 class="yatra-section-title"><?php echo esc_html__('Trip Attributes', 'yatra'); ?></h2>
        <p class="yatra-section-description"><?php echo esc_html__('Key features and characteristics', 'yatra'); ?></p>
    </div>

    <div class="yatra-attributes-grid">
        <?php foreach ($trip->getAttributes() as $attribute): ?>
            <div class="yatra-attribute-item">
                <div class="yatra-attribute-icon">
                    <?php if ($attribute['icon']): ?>
                        <?php if ($attribute['icon']['type'] === 'image'): ?>
                            <img src="<?php echo esc_url($attribute['icon']['value']); ?>" alt="<?php echo esc_attr($attribute['name']); ?>" class="yatra-attribute-icon-img">
                        <?php else: ?>
                            <?php echo yatra_svg_icon($attribute['icon']['value'], 'yatra-icon-sm'); ?>
                        <?php endif; ?>
                    <?php else: ?>
                        <?php echo yatra_svg_icon('tag', 'yatra-icon-sm'); ?>
                    <?php endif; ?>
                </div>

                <div class="yatra-attribute-content">
                    <div class="yatra-attribute-name"><?php echo esc_html($attribute['name']); ?></div>
                    <div class="yatra-attribute-value">
                        <?php
                        // Display value based on field type
                        switch ($attribute['field_type']) {
                            case 'checkbox':
                                $cb_val = $attribute['value'] ?? null;
                                $cb_options = json_decode($attribute['field_options'] ?? '[]', true);
                                if (!is_array($cb_options)) {
                                    $cb_options = [];
                                }
                                if (is_array($cb_val)) {
                                    $labels = [];
                                    foreach ($cb_options as $opt) {
                                        if (!isset($opt['value'], $opt['label'])) {
                                            continue;
                                        }
                                        foreach ($cb_val as $v) {
                                            if ((string) $v === (string) $opt['value']) {
                                                $labels[] = $opt['label'];
                                                break;
                                            }
                                        }
                                    }
                                    echo esc_html($labels !== [] ? implode(', ', $labels) : '—');
                                } else {
                                    echo $cb_val ? esc_html__('Yes', 'yatra') : esc_html__('No', 'yatra');
                                }
                                break;
                            case 'select':
                            case 'radio':
                                $options = json_decode($attribute['field_options'] ?? '[]', true);
                                $selected_value = is_array($attribute['value']) ? $attribute['value'][0] : $attribute['value'];
                                foreach ($options as $option) {
                                    if ($option['value'] === $selected_value) {
                                        echo esc_html($option['label']);
                                        break;
                                    }
                                }
                                break;
                            case 'date':
                                echo esc_html(date_i18n(get_option('date_format'), strtotime($attribute['value'])));
                                break;
                            case 'time':
                                echo esc_html(date_i18n(get_option('time_format'), strtotime($attribute['value'])));
                                break;
                            case 'color':
                                echo '<span class="yatra-color-swatch" style="background-color: ' . esc_attr($attribute['value']) . ';" title="' . esc_attr($attribute['value']) . '"></span>' . esc_html($attribute['value']);
                                break;
                            case 'url':
                                echo '<a href="' . esc_url($attribute['value']) . '" target="_blank" rel="noopener noreferrer">' . esc_html($attribute['value']) . '</a>';
                                break;
                            case 'email':
                                echo '<a href="mailto:' . esc_attr($attribute['value']) . '">' . esc_html($attribute['value']) . '</a>';
                                break;
                            case 'textarea':
                                // Truncate long textareas for compact display
                                $text = wp_strip_all_tags($attribute['value']);
                                echo esc_html(substr($text, 0, 50) . (strlen($text) > 50 ? '...' : ''));
                                break;
                            case 'number':
                                echo esc_html(number_format($attribute['value'], 0));
                                break;
                            default:
                                // Truncate long text for compact display
                                echo esc_html(substr($attribute['value'], 0, 30) . (strlen($attribute['value']) > 30 ? '...' : ''));
                                break;
                        }
                        ?>
                    </div>
                    <?php if (!empty($attribute['description'])): ?>
                        <div class="yatra-attribute-description"><?php echo esc_html(substr($attribute['description'], 0, 40) . (strlen($attribute['description']) > 40 ? '...' : '')); ?></div>
                    <?php endif; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>