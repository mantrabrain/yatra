<?php
/**
 * Group discount discoverability: compact trigger + rich popover (desktop hover / touch tap).
 *
 * @var array<int, array<string, mixed>> $group_discount_cards Same shape as REST `discounts` from DiscountController.
 * @var string $popover_context 'booking' | 'mobile'
 * @var string $popover_uid Unique id suffix for a11y.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (empty($group_discount_cards) || !is_array($group_discount_cards)) {
    return;
}

$ctx = isset($popover_context) && $popover_context === 'mobile' ? 'mobile' : 'booking';
$uid = isset($popover_uid) ? preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $popover_uid) : 'gd';
$panel_id = 'yatra-gd-panel-' . $uid;
$label_id = 'yatra-gd-label-' . $uid;
?>
<div class="yatra-group-discount-popover yatra-group-discount-popover--<?php echo esc_attr($ctx); ?>" data-yatra-group-discount-popover>
    <button type="button"
            class="yatra-group-discount-popover__trigger"
            id="<?php echo esc_attr($label_id); ?>"
            aria-expanded="false"
            aria-controls="<?php echo esc_attr($panel_id); ?>"
            aria-haspopup="dialog">
        <span class="yatra-group-discount-popover__trigger-icon" aria-hidden="true">
            <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
        </span>
        <span class="yatra-group-discount-popover__trigger-text"><?php esc_html_e('Group discounts available', 'yatra'); ?></span>
        <span class="yatra-group-discount-popover__chev" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
        </span>
    </button>

    <div class="yatra-group-discount-popover__panel"
         id="<?php echo esc_attr($panel_id); ?>"
         role="dialog"
         aria-labelledby="<?php echo esc_attr($label_id); ?>"
         aria-hidden="true">
        <div class="yatra-group-discount-popover__panel-inner">
            <div class="yatra-group-discount-popover__head">
                <strong><?php esc_html_e('Group savings', 'yatra'); ?></strong>
                <p class="yatra-group-discount-popover__sub"><?php esc_html_e('Discounts apply automatically when your traveler count meets a tier.', 'yatra'); ?></p>
            </div>

            <ul class="yatra-group-discount-popover__list">
                <?php foreach ($group_discount_cards as $discount): ?>
                    <li class="yatra-group-discount-popover__tier">
                        <div class="yatra-group-discount-popover__tier-main">
                            <span class="yatra-group-discount-popover__range"><?php echo esc_html($discount['range_label'] ?? ''); ?></span>
                            <span class="yatra-group-discount-popover__value"><?php echo esc_html($discount['discount_label'] ?? ''); ?></span>
                        </div>
                        <?php if (!empty($discount['discount_mode']) && $discount['discount_mode'] === 'category_based' && !empty($discount['category_discounts']) && is_array($discount['category_discounts'])): ?>
                            <ul class="yatra-group-discount-popover__cats">
                                <?php foreach ($discount['category_discounts'] as $cat_key => $details): ?>
                                    <li>
                                        <span class="yatra-group-discount-popover__cat-name"><?php echo esc_html(ucfirst((string) $cat_key)); ?></span>
                                        <span class="yatra-group-discount-popover__cat-val">
                                            <?php
                                            $rate = $details['discount_rate'] ?? '';
                                            $dtype = $details['discount_type'] ?? 'percentage';
                                            printf(
                                                esc_html__('%1$s%2$s off', 'yatra'),
                                                esc_html((string) $rate),
                                                $dtype === 'percentage' ? '%' : ''
                                            );
                                            ?>
                                        </span>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>

            <p class="yatra-group-discount-popover__note">
                <?php echo yatra_svg_icon('info', 'yatra-icon-xs'); ?>
                <?php esc_html_e('No coupon code needed — adjust travelers in this form to see pricing update.', 'yatra'); ?>
            </p>
        </div>
    </div>
</div>
