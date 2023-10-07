<?php

if (!defined('ABSPATH')) {
    exit;
}

if ($total <= 1) {
    return;
}
$attributes = is_array($attributes) ? $attributes: array();
?>
<div class="yatra-row yatra-pagination-wrap">
    <nav id="post-navigation" class="yatra-pagination navigation pagination <?php echo esc_attr($class) ?>"
         attributes="<?php echo esc_attr(json_encode($attributes)) ?>" type="<?php echo esc_attr($type); ?>">
        <?php
        echo paginate_links(
            apply_filters(
                'yatra_pagination_args',
                array( // WPCS: XSS ok.
                    'base' => $base,
                    'format' => $format,
                    'add_args' => false,
                    'current' => max(1, $current),
                    'total' => $total,
                    'prev_text' => is_rtl() ? '&rarr;' : '&larr;',
                    'next_text' => is_rtl() ? '&larr;' : '&rarr;',
                    'end_size' => 3,
                    'mid_size' => 3,
                )
            )
        );
        ?>
    </nav>
</div>