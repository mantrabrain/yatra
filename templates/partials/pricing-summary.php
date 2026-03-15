<?php
/**
 * Pricing Summary Template
 * 
 * Displays the pricing breakdown in the booking summary.
 * This template is loaded via AJAX when pricing needs to be updated.
 * 
 * @package Yatra
 * @since 3.0.0
 * 
 * Variables available:
 * @var \Yatra\Models\Checkout $checkout Checkout model with all pricing data
 */

defined('ABSPATH') || exit;

// Fallback: if $checkout is not available, try to get it from $booking
if (!isset($checkout) && isset($booking) && isset($booking->checkout)) {
    $checkout = $booking->checkout;
}

// If still no checkout model, we can't display anything
if (!isset($checkout) || !($checkout instanceof \Yatra\Models\Checkout)) {
    echo '<p>' . esc_html__('Pricing information not available.', 'yatra') . '</p>';
    return;
}
?>

<?php if ($checkout->isTravelerBased() && !empty($checkout->getCategoryBreakdown())) : ?>
<!-- Traveler-based pricing breakdown -->
<div class="yatra-price-breakdown-categories" id="price-breakdown-categories">
    <?php foreach ($checkout->getCategoryBreakdown() as $cat) : ?>
    <div class="yatra-price-row yatra-category-subtotal" data-category-id="<?php echo esc_attr($cat['category_id']); ?>">
        <span><?php echo esc_html($cat['label']); ?> x <span class="category-count"><?php echo (int) $cat['count']; ?></span></span>
        <span class="category-subtotal"><?php echo esc_html($checkout->formatPrice($cat['subtotal'])); ?></span>
    </div>
    <?php endforeach; ?>
</div>
<?php else : ?>
<!-- Regular pricing -->
<div class="yatra-price-row">
    <span><?php esc_html_e('Price per person', 'yatra'); ?></span>
    <span><?php echo esc_html($checkout->getFormattedPricePerPerson()); ?></span>
</div>
<div class="yatra-price-row">
    <span><?php esc_html_e('Number of travelers', 'yatra'); ?></span>
    <span id="summary-travelers"><?php echo (int) $checkout->getTotalTravelers(); ?></span>
</div>
<?php endif; ?>

<!-- Gross Total (base trip cost before services/discounts/taxes) -->
<div class="yatra-price-row yatra-price-subtotal">
    <span><strong><?php esc_html_e('Gross Total', 'yatra'); ?></strong></span>
    <span id="summary-gross-total"><strong><?php echo esc_html($checkout->getFormattedGrossTotal()); ?></strong></span>
</div>

<?php if ($checkout->hasCoupon()) : ?>
<!-- Coupon Discount -->
<div class="yatra-price-row yatra-price-discount" id="yatra-discount-row">
    <span class="yatra-discount-label">
        <?php echo esc_html($checkout->getCouponDiscountLabel()); ?>
        <span class="yatra-discount-code">(<?php echo esc_html($checkout->getCouponCode()); ?>)</span>
    </span>
    <span class="yatra-discount-amount" style="color: #059669;">-<?php echo esc_html($checkout->getFormattedCouponDiscount()); ?></span>
</div>
<?php endif; ?>

<?php if ($checkout->getGroupDiscountAmount() > 0) : ?>
<!-- Group Discount -->
<div class="yatra-price-row yatra-price-discount yatra-group-discount-row" id="yatra-group-discount-row">
    <span class="yatra-discount-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <?php echo esc_html($checkout->getGroupDiscountLabel()); ?>
    </span>
    <span class="yatra-discount-amount" style="color: #059669; font-weight: 500;">-<?php echo esc_html($checkout->getFormattedGroupDiscount()); ?></span>
</div>
<?php endif; ?>

<?php if ($checkout->hasItineraryCosts()) : ?>
<style>
.yatra-price-tooltip {
    position: relative;
    display: inline-block;
    margin-left: 4px;
    vertical-align: middle;
}

.yatra-price-tooltip:hover::after {
    content: attr(title);
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
}

.yatra-price-tooltip:hover::before {
    content: '';
    position: absolute;
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #1f2937;
    z-index: 1000;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
}

.yatra-price-tooltip:hover::after,
.yatra-price-tooltip:hover::before {
    opacity: 1;
}
</style>
<!-- Itinerary Costs -->
<div class="yatra-price-section">
    <div class="yatra-price-section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <?php esc_html_e('Itinerary Costs', 'yatra'); ?>
    </div>
    <?php foreach ($checkout->getItineraryCosts() as $cost) : ?>
        <div class="yatra-price-row yatra-price-itinerary">
            <span>
                <?php 
                echo esc_html($cost['name']);
                if (!empty($cost['price_per'])) {
                    if ($cost['price_per'] === 'person') {
                        echo ' ' . esc_html_x('(per person)', 'pricing type', 'yatra');
                        $quantity = $checkout->getTotalTravelers();
                        $unit_price = $cost['price'] ?? 0;
                        $total_cost = $unit_price * $quantity;
                        ?>
                        <span class="yatra-price-tooltip" title="<?php 
                            // Build tooltip data with proper escaping and currency symbol
                            $currency_symbol = $checkout->getCurrencySymbol();
                            $unit_price_formatted = number_format($unit_price, 2);
                            $total_cost_formatted = number_format($total_cost, 2);
                            $tooltip_text = sprintf('%s%s × %d travelers = %s%s', 
                                $currency_symbol, 
                                $unit_price_formatted, 
                                (int) $quantity, 
                                $currency_symbol,
                                $total_cost_formatted
                            );
                            echo esc_attr($tooltip_text);
                        ?>">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.6; cursor: help;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </span>
                        <?php
                    } elseif ($cost['price_per'] === 'group') {
                        echo ' ' . esc_html_x('(per booking)', 'pricing type', 'yatra');
                    } else {
                        echo ' ' . esc_html_x('(flat rate)', 'pricing type', 'yatra');
                    }
                }
                ?>
            </span>
            <span><?php 
                if (!empty($cost['price_per']) && $cost['price_per'] === 'person') {
                    $quantity = $checkout->getTotalTravelers();
                    $unit_price = $cost['price'] ?? 0;
                    $total_cost = $unit_price * $quantity;
                    echo esc_html($checkout->formatPrice($total_cost));
                } else {
                    echo esc_html($checkout->formatPrice($cost['price'] ?? 0));
                }
            ?></span>
        </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<?php if ($checkout->hasAdditionalServices()) : ?>
<!-- Additional Services -->
<?php foreach ($checkout->getAdditionalServices() as $service) : ?>
    <?php if (!empty($service['selected'])) : ?>
        <?php 
        $service_price = $service['calculated_price'] ?? $service['price'] ?? 0;
        $is_included = !empty($service['is_included']);
        $is_required = !empty($service['is_required']);
        ?>
        <div class="yatra-price-row yatra-price-service<?php echo $is_included ? ' yatra-service-included' : ''; ?>">
            <span>
                <?php echo esc_html($service['name']); ?>
                <?php if ($is_required && !$is_included) : ?>
                    <span class="yatra-service-badge yatra-badge-required"><?php esc_html_e('Required', 'yatra'); ?></span>
                <?php endif; ?>
            </span>
            <?php if ($is_included) : ?>
                <span class="yatra-service-included-badge"><?php esc_html_e('Included', 'yatra'); ?></span>
            <?php else : ?>
                <span><?php echo esc_html($checkout->formatPrice($service_price)); ?></span>
            <?php endif; ?>
        </div>
    <?php endif; ?>
<?php endforeach; ?>
<?php endif; ?>

<?php if (!empty($dynamic_pricing) && !empty($dynamic_pricing['rules'])) : ?>
<!-- Dynamic Pricing Information -->
<div class="yatra-price-section yatra-dynamic-pricing-section">
    <div class="yatra-price-section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20m8-10H4"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <?php echo esc_html($dynamic_pricing['label']); ?>
    </div>
    
    <?php if (!empty($dynamic_pricing['show_original_price']) && $dynamic_pricing['original_price'] > 0 && $dynamic_pricing['original_price'] != $dynamic_pricing['final_price']) : ?>
    <div class="yatra-price-row yatra-original-price">
        <span><?php esc_html_e('Original Price', 'yatra'); ?></span>
        <span class="yatra-original-price-amount" style="text-decoration: line-through; color: #6b7280;">
            <?php echo esc_html(yatra_format_price($dynamic_pricing['original_price'], $currency ?? null)); ?>
        </span>
    </div>
    <?php endif; ?>
    
    <?php if (!empty($dynamic_pricing['show_savings_badge']) && $dynamic_pricing['savings'] > 0) : ?>
    <div class="yatra-price-row yatra-savings-badge" style="background-color: #dcfce7; color: #166534; padding: 8px 12px; border-radius: 6px; margin: 8px 0;">
        <span style="font-weight: 600;">
            <?php 
            printf(
                /* translators: %s: savings percentage */
                esc_html__('You save %s', 'yatra'),
                '<span style="color: #16a34a; font-weight: 700;">' . number_format($dynamic_pricing['savings_percent'], 1) . '%</span>'
            );
            ?>
        </span>
        <span style="font-weight: 600; color: #16a34a;">
            <?php echo esc_html(yatra_format_price($dynamic_pricing['savings'], $currency ?? null)); ?>
        </span>
    </div>
    <?php endif; ?>
    
    <?php if (!empty($dynamic_pricing['show_urgency_messages']) && !empty($dynamic_pricing['rules'])) : ?>
    <div class="yatra-price-row yatra-urgency-message" style="background-color: #fef3c7; color: #92400e; padding: 8px 12px; border-radius: 6px; margin: 8px 0; font-size: 14px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <?php 
        $ruleCount = count($dynamic_pricing['rules']);
        if ($ruleCount === 1) {
            esc_html_e('Limited time offer! Dynamic pricing applied.', 'yatra');
        } else {
            printf(
                /* translators: %d: number of rules */
                esc_html(_n('%d dynamic pricing rule applied!', '%d dynamic pricing rules applied!', $ruleCount, 'yatra')),
                (int) $ruleCount
            );
        }
        ?>
    </div>
    <?php endif; ?>
</div>
<?php endif; ?>

<!-- Taxable Amount (SubTotal - amount that tax is calculated on) -->
<?php 
$taxable_amount = $checkout->getTaxableAmount();
if ($taxable_amount && $taxable_amount > 0 && $checkout->hasTaxes()) : 
?>
<div class="yatra-price-row yatra-price-subtotal" style="border-top: 1px dashed #e5e7eb; margin-top: 8px; padding-top: 8px;">
    <span><strong><?php esc_html_e('Subtotal (Taxable Amount)', 'yatra'); ?></strong></span>
    <span id="summary-taxable-amount"><strong><?php echo esc_html($checkout->formatPrice($taxable_amount)); ?></strong></span>
</div>
<?php endif; ?>

<?php if ($checkout->hasTaxes()) : ?>
<!-- Tax Breakdown -->
<div class="yatra-price-section yatra-tax-section">
    <div class="yatra-price-section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 14l2 2 4-4"></path>
            <path d="M21 12c.552 0 1-.448 1-1V8c0-.552-.448-1-1-1h-1V6a2 2 0 00-2-2H4a2 2 0 00-2 2v1c0 .552.448 1 1 1h1v1c0 .552.448 1 1 1h1M3 15a1 1 0 011-1h2.5a1 1 0 011 1v1.5"></path>
        </svg>
        <?php esc_html_e('Tax', 'yatra'); ?>
    </div>
    <?php foreach ($checkout->getTaxBreakdown() as $tax) : ?>
    <div class="yatra-price-row yatra-price-tax">
        <span><?php echo esc_html($tax['name']); ?> (<?php echo esc_html($tax['rate']); ?>%)</span>
        <span><?php echo esc_html($checkout->formatPrice($tax['amount'])); ?></span>
    </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<!-- Net Amount -->
<div class="yatra-price-row yatra-price-total">
    <span><strong><?php esc_html_e('Net Amount', 'yatra'); ?></strong></span>
    <span id="summary-total"><strong><?php echo esc_html($checkout->getFormattedNetTotal()); ?></strong></span>
</div>

<?php if ($checkout->getPaymentMethod() !== 'full') : ?>
<!-- Due Now -->
<div class="yatra-price-row yatra-price-due">
    <span><?php esc_html_e('Due Now', 'yatra'); ?></span>
    <span id="summary-due"><strong><?php echo esc_html($checkout->getFormattedAmountDue()); ?></strong></span>
</div>
<?php endif; ?>
