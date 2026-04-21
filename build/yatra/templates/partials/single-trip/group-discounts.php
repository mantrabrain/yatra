<?php
if (!defined('ABSPATH')) {
    exit;
}

// Group Discounts Section
// Expected variables: $trip
?>
<section class="yatra-group-discounts-section" id="group-discounts">
    <div class="yatra-group-discounts-container">
        <div class="yatra-group-discounts-header">
            <h2 class="yatra-group-discounts-title">
                <?php echo yatra_svg_icon('users', 'yatra-group-discounts-icon'); ?>
                <?php echo esc_html__('Group Discounts Available', 'yatra'); ?>
            </h2>
            <p class="yatra-group-discounts-subtitle">
                <?php echo esc_html__('Save money when traveling with a group. The more people, the better the deal!', 'yatra'); ?>
            </p>
        </div>

        <div class="yatra-group-discounts-grid">
            <?php foreach ($group_discounts_data as $discount): ?>
                <div class="yatra-group-discount-card">
                    <div class="yatra-group-discount-header">
                        <div class="yatra-group-discount-range">
                            <span class="yatra-group-size"><?php echo esc_html($discount['range_label']); ?></span>
                        </div>
                        <div class="yatra-group-discount-amount">
                            <span class="yatra-discount-text"><?php echo esc_html($discount['discount_label']); ?></span>
                        </div>
                    </div>

                    <div class="yatra-group-discount-details">
                        <?php if ($discount['discount_mode'] === 'category_based' && !empty($discount['category_discounts'])): ?>
                            <div class="yatra-category-discounts">
                                <h4><?php echo esc_html__('Category-Based Savings', 'yatra'); ?></h4>
                                <div class="yatra-category-breakdown">
                                    <?php foreach ($discount['category_discounts'] as $category => $details): ?>
                                        <div class="yatra-category-item">
                                            <span class="yatra-category-name"><?php echo esc_html(ucfirst($category)); ?>:</span>
                                            <span class="yatra-category-saving"><?php echo esc_html($details['discount_rate']); ?><?php echo $details['discount_type'] === 'percentage' ? '%' : ''; ?> off</span>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        <?php else: ?>
                            <div class="yatra-total-discount-info">
                                <p><?php echo esc_html__('Discount applies to the entire booking total.', 'yatra'); ?></p>
                            </div>
                        <?php endif; ?>
                    </div>

                    <div class="yatra-group-discount-cta">
                        <button type="button" class="yatra-group-discount-btn" data-group-size="<?php echo esc_attr($discount['min_group_size']); ?>">
                            <?php echo esc_html__('Book for', 'yatra'); ?> <?php echo esc_html($discount['min_group_size']); ?>+
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="yatra-group-discounts-footer">
            <div class="yatra-group-benefits">
                <h3><?php echo esc_html__('Why Travel in a Group?', 'yatra'); ?></h3>
                <div class="yatra-group-benefits-grid">
                    <div class="yatra-benefit-item">
                        <div class="yatra-benefit-icon">
                            <?php echo yatra_svg_icon('dollar-sign', 'yatra-icon-sm'); ?>
                        </div>
                        <div class="yatra-benefit-content">
                            <h4><?php echo esc_html__('Save Money', 'yatra'); ?></h4>
                            <p><?php echo esc_html__('Group discounts can save you hundreds per person.', 'yatra'); ?></p>
                        </div>
                    </div>
                    <div class="yatra-benefit-item">
                        <div class="yatra-benefit-icon">
                            <?php echo yatra_svg_icon('users', 'yatra-icon-sm'); ?>
                        </div>
                        <div class="yatra-benefit-content">
                            <h4><?php echo esc_html__('Share the Experience', 'yatra'); ?></h4>
                            <p><?php echo esc_html__('Travel with friends, family, or colleagues.', 'yatra'); ?></p>
                        </div>
                    </div>
                    <div class="yatra-benefit-item">
                        <div class="yatra-benefit-icon">
                            <?php echo yatra_svg_icon('heart', 'yatra-icon-sm'); ?>
                        </div>
                        <div class="yatra-benefit-content">
                            <h4><?php echo esc_html__('Special Treatment', 'yatra'); ?></h4>
                            <p><?php echo esc_html__('Groups often get priority service and attention.', 'yatra'); ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="yatra-group-discounts-note">
                <p>
                    <?php echo yatra_svg_icon('info', 'yatra-icon-xs'); ?>
                    <?php echo esc_html__('Group discounts are applied automatically when you select the required number of travelers. No coupon codes needed!', 'yatra'); ?>
                </p>
            </div>
        </div>
    </div>
</section>
