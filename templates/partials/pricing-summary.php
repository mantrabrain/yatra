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
 * @var bool   $is_traveler_based      Whether pricing is traveler-based
 * @var array  $category_breakdown     Category breakdown for traveler-based pricing
 * @var float  $subtotal               Gross total before discounts
 * @var int    $total_travelers        Total number of travelers
 * @var float  $price_per_person       Price per person (for regular pricing)
 * @var float  $coupon_discount_amount Coupon discount amount
 * @var string $coupon_discount_label  Coupon discount label
 * @var string $coupon_code            Applied coupon code
 * @var float  $group_discount_amount  Group discount amount
 * @var string $group_discount_label   Group discount label
 * @var array  $additional_services    Additional services with 'selected' flag
 * @var float  $services_total         Total for additional services
 * @var float  $total_amount           Net amount after all discounts and services
 * @var float  $amount_due             Amount due now
 * @var string $payment_method         Payment method (full, deposit, partial)
 * @var int    $deposit_percentage     Deposit percentage
 * @var int    $partial_percentage     Partial payment percentage
 */

defined('ABSPATH') || exit;
?>

<?php if ($is_traveler_based && !empty($category_breakdown)) : ?>
<!-- Traveler-based pricing breakdown -->
<div class="yatra-price-breakdown-categories" id="price-breakdown-categories">
    <?php foreach ($category_breakdown as $cat) : ?>
    <div class="yatra-price-row yatra-category-subtotal" data-category-id="<?php echo esc_attr($cat['category_id']); ?>">
        <span><?php echo esc_html($cat['label']); ?> x <span class="category-count"><?php echo (int) $cat['count']; ?></span></span>
        <span class="category-subtotal"><?php echo esc_html(yatra_format_price($cat['subtotal'])); ?></span>
    </div>
    <?php endforeach; ?>
</div>
<?php else : ?>
<!-- Regular pricing -->
<div class="yatra-price-row">
    <span><?php esc_html_e('Price per person', 'yatra'); ?></span>
    <span><?php echo esc_html(yatra_format_price($price_per_person ?? 0)); ?></span>
</div>
<div class="yatra-price-row">
    <span><?php esc_html_e('Number of travelers', 'yatra'); ?></span>
    <span id="summary-travelers"><?php echo (int) $total_travelers; ?></span>
</div>
<?php endif; ?>

<!-- Gross Total -->
<div class="yatra-price-row yatra-price-subtotal">
    <span><strong><?php esc_html_e('Gross Total', 'yatra'); ?></strong></span>
    <span id="summary-gross-total"><strong><?php echo esc_html(yatra_format_price($subtotal)); ?></strong></span>
</div>

<?php if (!empty($coupon_discount_amount) && $coupon_discount_amount > 0) : ?>
<!-- Coupon Discount -->
<div class="yatra-price-row yatra-price-discount" id="yatra-discount-row">
    <span class="yatra-discount-label">
        <?php echo esc_html($coupon_discount_label ?: __('Discount', 'yatra')); ?>
        <span class="yatra-discount-code">(<?php echo esc_html($coupon_code); ?>)</span>
    </span>
    <span class="yatra-discount-amount" style="color: #059669;">-<?php echo esc_html(yatra_format_price($coupon_discount_amount)); ?></span>
</div>
<?php endif; ?>

<?php if (!empty($group_discount_amount) && $group_discount_amount > 0) : ?>
<!-- Group Discount -->
<div class="yatra-price-row yatra-price-discount yatra-group-discount-row" id="yatra-group-discount-row">
    <span class="yatra-discount-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <?php echo esc_html($group_discount_label); ?>
    </span>
    <span class="yatra-discount-amount" style="color: #059669; font-weight: 500;">-<?php echo esc_html(yatra_format_price($group_discount_amount)); ?></span>
</div>
<?php endif; ?>

<?php if (!empty($itinerary_costs)) : ?>
<!-- Itinerary Costs -->
<div class="yatra-price-section">
    <div class="yatra-price-section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <?php esc_html_e('Itinerary Costs', 'yatra'); ?>
    </div>
    <?php foreach ($itinerary_costs as $cost) : ?>
        <?php 
        $cost_price = $cost['price'] ?? 0;
        $price_per = $cost['price_per'] ?? 'person';
        ?>
        <div class="yatra-price-row yatra-price-itinerary">
            <span><?php echo esc_html($cost['name']); ?></span>
            <span><?php echo esc_html(yatra_format_price($cost_price)); ?></span>
        </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<?php if (!empty($additional_services)) : ?>
<!-- Additional Services -->
<?php foreach ($additional_services as $service) : ?>
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
                <span><?php echo esc_html(yatra_format_price($service_price)); ?></span>
            <?php endif; ?>
        </div>
    <?php endif; ?>
<?php endforeach; ?>
<?php endif; ?>

<!-- Net Amount -->
<div class="yatra-price-row yatra-price-total">
    <span><strong><?php esc_html_e('Net Amount', 'yatra'); ?></strong></span>
    <span id="summary-total"><strong><?php echo esc_html(yatra_format_price($total_amount)); ?></strong></span>
</div>

<?php if ($payment_method !== 'full') : ?>
<!-- Due Now -->
<div class="yatra-price-row yatra-price-due">
    <span><?php esc_html_e('Due Now', 'yatra'); ?></span>
    <span id="summary-due"><strong><?php echo esc_html(yatra_format_price($amount_due)); ?></strong></span>
</div>
<?php endif; ?>
