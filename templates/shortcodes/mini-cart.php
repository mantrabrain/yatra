<?php
/**
 * Mini Cart Shortcode Template
 * 
 * @package Yatra
 * @var array $cart_items Cart items
 * @var float $cart_total Cart total
 * @var int $cart_count Number of items
 * @var array $atts Shortcode attributes
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="yatra-mini-cart">
    <div class="yatra-mini-cart-header">
        <div class="yatra-cart-icon">
            <?php echo yatra_svg_icon($atts['cart_icon'], 'yatra-cart-icon-svg'); ?>
            <?php if ($cart_count > 0): ?>
                <span class="yatra-cart-count"><?php echo esc_html($cart_count); ?></span>
            <?php endif; ?>
        </div>
        <h3 class="yatra-cart-title"><?php esc_html_e('Shopping Cart', 'yatra'); ?></h3>
    </div>

    <div class="yatra-mini-cart-content">
        <?php if (!empty($cart_items) && $atts['show_items'] === 'yes'): ?>
            <div class="yatra-cart-items">
                <?php foreach ($cart_items as $item): ?>
                    <div class="yatra-cart-item">
                        <div class="yatra-item-image">
                            <?php if (!empty($item['image'])): ?>
                                <img src="<?php echo esc_url($item['image']); ?>" alt="<?php echo esc_attr($item['name']); ?>">
                            <?php else: ?>
                                <div class="yatra-item-placeholder">
                                    <?php echo yatra_svg_icon('image', 'yatra-placeholder-icon'); ?>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="yatra-item-details">
                            <h4 class="yatra-item-name"><?php echo esc_html($item['name']); ?></h4>
                            <div class="yatra-item-meta">
                                <span class="yatra-item-quantity"><?php esc_html_e('Qty:', 'yatra'); ?> <?php echo esc_html($item['quantity']); ?></span>
                                <span class="yatra-item-price"><?php echo esc_html($item['price']); ?></span>
                            </div>
                        </div>
                        <button class="yatra-item-remove" data-item-id="<?php echo esc_attr($item['id']); ?>">
                            <?php echo yatra_svg_icon('x', 'yatra-remove-icon'); ?>
                        </button>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div class="yatra-cart-empty">
                <div class="yatra-empty-icon">
                    <?php echo yatra_svg_icon('shopping-cart', 'yatra-empty-icon-svg'); ?>
                </div>
                <p><?php echo esc_html($atts['empty_message']); ?></p>
                <a href="<?php echo esc_url(get_post_type_archive_link('trip')); ?>" class="yatra-btn yatra-btn-primary yatra-btn-small">
                    <?php esc_html_e('Browse Tours', 'yatra'); ?>
                </a>
            </div>
        <?php endif; ?>
    </div>

    <?php if ($atts['show_total'] === 'yes' && $cart_total > 0): ?>
        <div class="yatra-cart-total">
            <div class="yatra-total-label"><?php esc_html_e('Total:', 'yatra'); ?></div>
            <div class="yatra-total-amount">
                <?php 
                $currency_symbol = \Yatra\Services\SettingsService::getCurrencySymbol();
                echo esc_html($currency_symbol . number_format($cart_total, 2));
                ?>
            </div>
        </div>
    <?php endif; ?>

    <?php if ($atts['show_checkout'] === 'yes' && $cart_count > 0): ?>
        <div class="yatra-cart-actions">
            <a href="<?php echo esc_url(home_url('/checkout')); ?>" class="yatra-btn yatra-btn-primary yatra-btn-block">
                <?php esc_html_e('Proceed to Checkout', 'yatra'); ?>
            </a>
            <a href="<?php echo esc_url(home_url('/cart')); ?>" class="yatra-btn yatra-btn-outline yatra-btn-block">
                <?php esc_html_e('View Cart', 'yatra'); ?>
            </a>
        </div>
    <?php endif; ?>
</div>

<style>
.yatra-mini-cart {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    max-width: 400px;
}

.yatra-mini-cart-header {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 20px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

.yatra-cart-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
}

.yatra-cart-icon-svg {
    width: 20px;
    height: 20px;
}

.yatra-cart-count {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
}

.yatra-cart-title {
    margin: 0;
    color: #1f2937;
    font-size: 1.125rem;
    font-weight: 600;
}

.yatra-mini-cart-content {
    padding: 20px;
    max-height: 300px;
    overflow-y: auto;
}

.yatra-cart-items {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.yatra-cart-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
    position: relative;
}

.yatra-item-image {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
}

.yatra-item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.yatra-item-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e5e7eb;
}

.yatra-placeholder-icon {
    width: 24px;
    height: 24px;
    color: #9ca3af;
}

.yatra-item-details {
    flex: 1;
    min-width: 0;
}

.yatra-item-name {
    margin: 0 0 8px 0;
    color: #1f2937;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4;
}

.yatra-item-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #6b7280;
}

.yatra-item-price {
    font-weight: 600;
    color: #1f2937;
}

.yatra-item-remove {
    position: absolute;
    top: 10px;
    right: 10px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.yatra-item-remove:hover {
    background: #fee2e2;
    border-color: #dc2626;
    color: #dc2626;
}

.yatra-remove-icon {
    width: 12px;
    height: 12px;
}

.yatra-cart-empty {
    text-align: center;
    padding: 40px 20px;
}

.yatra-empty-icon {
    margin-bottom: 15px;
    opacity: 0.5;
}

.yatra-empty-icon-svg {
    width: 40px;
    height: 40px;
    color: #9ca3af;
}

.yatra-cart-empty p {
    color: #6b7280;
    margin: 0 0 20px 0;
}

.yatra-cart-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}

.yatra-total-label {
    font-weight: 600;
    color: #1f2937;
}

.yatra-total-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
}

.yatra-cart-actions {
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.yatra-btn-block {
    display: block;
    width: 100%;
    text-align: center;
}

.yatra-btn-small {
    padding: 8px 16px;
    font-size: 0.875rem;
}
</style>
