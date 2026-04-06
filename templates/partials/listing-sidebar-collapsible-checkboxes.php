<?php
/**
 * Trip listing sidebar: checkbox list with optional "Show more / Show less".
 *
 * Expects before include:
 * - $yatra_sidebar_cb_rows — list of rows: value, label, optional count (int)
 * - $yatra_sidebar_cb_input_name — e.g. categories[]
 * - $yatra_sidebar_cb_active — array of selected values (same semantics as listing template)
 *
 * @package Yatra
 */

if (!defined('ABSPATH')) {
    exit;
}

$rows = isset($yatra_sidebar_cb_rows) ? array_values((array) $yatra_sidebar_cb_rows) : [];
$input_name = isset($yatra_sidebar_cb_input_name) ? (string) $yatra_sidebar_cb_input_name : '';
$active_vals = isset($yatra_sidebar_cb_active) && is_array($yatra_sidebar_cb_active) ? $yatra_sidebar_cb_active : [];

if ($input_name === '' || $rows === []) {
    return;
}

$cap = function_exists('yatra_listing_sidebar_filter_visible_cap')
    ? yatra_listing_sidebar_filter_visible_cap()
    : 8;
$total = count($rows);
$expand = false;

if ($total > $cap && $active_vals !== []) {
    for ($i = $cap; $i < $total; $i++) {
        if (in_array($rows[$i]['value'], $active_vals)) {
            $expand = true;
            break;
        }
    }
}

$has_more = $total > $cap;
$wrapper_classes = 'yatra-checkbox-group yatra-filter-collapsible';
if ($has_more) {
    $wrapper_classes .= ' has-more';
}
if ($expand) {
    $wrapper_classes .= ' is-expanded';
}
?>
<div class="<?php echo esc_attr($wrapper_classes); ?>" data-visible-cap="<?php echo esc_attr((string) $cap); ?>">
    <?php foreach ($rows as $idx => $row) : ?>
        <?php
        $val = $row['value'] ?? '';
        $label = isset($row['label']) ? (string) $row['label'] : '';
        $more_class = $idx >= $cap ? ' yatra-filter-option-more' : '';
        $attr_val = is_scalar($val) ? (string) $val : '';
        ?>
        <label class="yatra-checkbox-label<?php echo esc_attr($more_class); ?>">
            <input
                type="checkbox"
                name="<?php echo esc_attr($input_name); ?>"
                value="<?php echo esc_attr($attr_val); ?>"
                <?php checked(in_array($val, $active_vals)); ?>
            >
            <span><?php echo esc_html($label); ?></span>
            <?php if (array_key_exists('count', $row) && $row['count'] !== null && $row['count'] !== '') : ?>
                <span class="yatra-filter-count">(<?php echo (int) $row['count']; ?>)</span>
            <?php endif; ?>
        </label>
    <?php endforeach; ?>
    <?php if ($has_more) : ?>
        <button
            type="button"
            class="yatra-filter-show-more-toggle"
            aria-expanded="<?php echo $expand ? 'true' : 'false'; ?>"
        >
            <span class="yatra-filter-show-more-label"><?php esc_html_e('Show more', 'yatra'); ?></span>
            <span class="yatra-filter-show-less-label"><?php esc_html_e('Show less', 'yatra'); ?></span>
        </button>
    <?php endif; ?>
</div>
