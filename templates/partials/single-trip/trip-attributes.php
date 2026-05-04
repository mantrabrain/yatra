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

    <div class="yatra-spec-sheet yatra-spec-sheet--attributes-grid">
    <div class="yatra-attributes-grid">
        <?php foreach ($trip->getAttributes() as $attribute): ?>
            <div class="yatra-attribute-item">
                <div class="yatra-attribute-icon">
                    <?php if ($attribute['icon']): ?>
                        <?php if ($attribute['icon']['type'] === 'image'): ?>
                            <img src="<?php echo esc_url($attribute['icon']['value']); ?>" alt="<?php echo esc_attr($attribute['name']); ?>" class="yatra-attribute-icon-img">
                        <?php else: ?>
                            <?php
                            // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                            echo yatra_stored_picker_icon_markup($attribute['icon'], 'info', 'yatra-icon');
                            ?>
                        <?php endif; ?>
                    <?php else: ?>
                        <?php echo yatra_svg_icon('tag', 'yatra-icon'); ?>
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
                                if (!is_array($options)) {
                                    $options = [];
                                }
                                $selected_value = is_array($attribute['value']) ? ($attribute['value'][0] ?? null) : ($attribute['value'] ?? null);
                                $matched_label = null;
                                foreach ($options as $option) {
                                    if (!is_array($option) || !isset($option['value'], $option['label'])) {
                                        continue;
                                    }
                                    if ((string) $option['value'] === (string) $selected_value) {
                                        $matched_label = (string) $option['label'];
                                        break;
                                    }
                                }
                                if ($matched_label !== null) {
                                    echo esc_html($matched_label);
                                } elseif ($selected_value !== null && $selected_value !== '') {
                                    echo esc_html((string) $selected_value);
                                } else {
                                    echo esc_html('—');
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
                            case 'file':
                                $link = (string) ($attribute['value'] ?? '');
                                if ($link !== '' && filter_var($link, FILTER_VALIDATE_URL)) {
                                    echo '<a href="' . esc_url($link) . '" target="_blank" rel="noopener noreferrer">' . esc_html($link) . '</a>';
                                } else {
                                    echo esc_html($link !== '' ? $link : '—');
                                }
                                break;
                            case 'email':
                                echo '<a href="mailto:' . esc_attr($attribute['value']) . '">' . esc_html($attribute['value']) . '</a>';
                                break;
                            case 'textarea':
                                // Truncate long textareas for compact display
                                $text = wp_strip_all_tags((string) ($attribute['value'] ?? ''));
                                $snippet = function_exists('mb_substr') ? mb_substr($text, 0, 50) : substr($text, 0, 50);
                                $long = function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
                                echo esc_html($snippet . ($long > 50 ? '...' : ''));
                                break;
                            case 'number':
                                $nv = $attribute['value'] ?? null;
                                echo esc_html(is_numeric($nv) ? (string) (0 + $nv) : (string) $nv);
                                break;
                            case 'text_field':
                            default:
                                $raw = $attribute['value'] ?? '';
                                if (is_array($raw)) {
                                    $flat = [];
                                    foreach ($raw as $piece) {
                                        $flat[] = is_scalar($piece) ? (string) $piece : '';
                                    }
                                    echo esc_html(implode(', ', array_filter($flat, static fn ($s) => $s !== '')));
                                } else {
                                    $text = wp_strip_all_tags((string) $raw);
                                    $snippet = function_exists('mb_substr') ? mb_substr($text, 0, 30) : substr($text, 0, 30);
                                    $long = function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
                                    echo esc_html($snippet . ($long > 30 ? '...' : ''));
                                }
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
</div>