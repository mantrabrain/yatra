<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="included">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('check', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html__("What's Included & Excluded", 'yatra'); ?>
    </h2>
    <div class="yatra-included-excluded">
        <?php if (!empty($trip->included_items)): ?>
            <div class="yatra-included-section">
                <h3>
                    <?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?>
                    <?php echo esc_html__('Included', 'yatra'); ?>
                </h3>
                <ul class="yatra-included-list">
                    <?php foreach ($trip->included_items as $item): ?>
                        <?php
                        $item_title = is_array($item) ? ($item['title'] ?? '') : (is_object($item) ? ($item->title ?? '') : $item);
                        $item_desc = is_array($item) ? ($item['description'] ?? '') : (is_object($item) ? ($item->description ?? '') : '');
                        ?>
                        <?php if (!empty($item_title)): ?>
                            <li>
                                <?php echo yatra_svg_icon('check', 'yatra-included-icon'); ?>
                                <span>
                                    <?php echo esc_html($item_title); ?>
                                    <?php if (!empty($item_desc)): ?>
                                        <small class="yatra-item-desc"><?php echo esc_html($item_desc); ?></small>
                                    <?php endif; ?>
                                </span>
                            </li>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        <?php if (!empty($trip->excluded_items)): ?>
            <div class="yatra-excluded-section">
                <h3>
                    <?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?>
                    <?php echo esc_html__('Excluded', 'yatra'); ?>
                </h3>
                <ul class="yatra-excluded-list">
                    <?php foreach ($trip->excluded_items as $item): ?>
                        <?php
                        $item_title = is_array($item) ? ($item['title'] ?? '') : (is_object($item) ? ($item->title ?? '') : $item);
                        $item_desc = is_array($item) ? ($item['description'] ?? '') : (is_object($item) ? ($item->description ?? '') : '');
                        ?>
                        <?php if (!empty($item_title)): ?>
                            <li>
                                <?php echo yatra_svg_icon('x', 'yatra-excluded-icon'); ?>
                                <span>
                                    <?php echo esc_html($item_title); ?>
                                    <?php if (!empty($item_desc)): ?>
                                        <small class="yatra-item-desc"><?php echo esc_html($item_desc); ?></small>
                                    <?php endif; ?>
                                </span>
                            </li>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
    </div>
</section>