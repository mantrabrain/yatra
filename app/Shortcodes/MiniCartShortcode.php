<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * Mini Cart Shortcode
 *
 * Displays a mini shopping cart widget
 */
class MiniCartShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_mini_cart', [
            'show_items' => 'yes',
            'show_total' => 'yes',
            'show_checkout' => 'yes',
            'cart_icon' => 'shopping-cart',
            'empty_message' => 'Your cart is empty'
        ]);
    }

    /**
     * Render the mini cart shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $atts = shortcode_atts($this->default_attributes, $atts, $this->tag);
        
        // For now, return a simple mini cart to test
        ob_start();
        ?>
        <div class="yatra-mini-cart">
            <h3><?php esc_html_e('Shopping Cart', 'yatra'); ?></h3>
            <p><?php esc_html_e('Your cart is empty.', 'yatra'); ?></p>
        </div>
        <?php
        return ob_get_clean();
    }
}
