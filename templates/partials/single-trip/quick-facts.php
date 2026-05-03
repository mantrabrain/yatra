<?php
if (!defined('ABSPATH')) {
    exit;
}

// Quick Facts Section for Single Trip Page
// Expected variables: $trip
?>
<div class="yatra-trip-quick-facts-section">
<div class="yatra-spec-sheet yatra-spec-sheet--quick-facts">
<div class="yatra-trip-quick-facts">
    <!-- Duration -->
    <div class="yatra-quick-fact">
        <div class="yatra-quick-fact-icon">
            <?php echo yatra_svg_icon('calendar', 'yatra-icon-lg'); ?>
        </div>
        <div class="yatra-quick-fact-content">
            <div class="yatra-quick-fact-label"><?php echo esc_html__('Duration', 'yatra'); ?></div>
            <div class="yatra-quick-fact-value">
                <?php
                if ($trip->getTripType() === 'single_day') {
                    echo esc_html__('Day Trip', 'yatra');
                } else {
                    echo esc_html(yatra_format_duration($trip->getDurationDays(), $trip->getDurationNights()));
                }
                ?>
            </div>
        </div>
    </div>

    <!-- Difficulty -->
    <?php 
    $difficulty_level = $trip->getDifficultyLevel();
    if (!empty($difficulty_level)): 
    ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php 
                $difficulty_icons = [
                    'easy' => 'heart',
                    'moderate' => 'activity',
                    'challenging' => 'zap',
                    'difficult' => 'flame',
                ];
                $icon = $difficulty_icons[$difficulty_level] ?? 'mountain';
                echo yatra_svg_icon($icon, 'yatra-icon-lg');
                ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Difficulty', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value"><?php echo esc_html(ucfirst($difficulty_level)); ?></div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Landmarks -->
    <?php 
    $landmarks = $trip->getLandmarks();
    if (!empty($landmarks)): 
    ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('map-pin', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Landmarks', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php 
                    $landmark_count = count($landmarks);
                    echo esc_html(sprintf(_n('%d landmark', '%d landmarks', $landmark_count, 'yatra'), $landmark_count)); 
                    ?>
                </div>
            </div>
        </div>
    <?php endif; ?>

    
    <!-- Group Size -->
    <div class="yatra-quick-fact">
        <div class="yatra-quick-fact-icon">
            <?php echo yatra_svg_icon('users', 'yatra-icon-lg'); ?>
        </div>
        <div class="yatra-quick-fact-content">
            <div class="yatra-quick-fact-label"><?php echo esc_html__('Group Size', 'yatra'); ?></div>
            <div class="yatra-quick-fact-value">
                <?php 
                $min_travelers = $trip->getMinTravelers();
                $max_travelers = $trip->getMaxTravelers();
                echo esc_html(sprintf(__('%d-%d travelers', 'yatra'), $min_travelers, $max_travelers)); 
                ?>
            </div>
        </div>
    </div>

    <!-- Price (aligned with booking sidebar — TripPricingService, not legacy trip-level sale/original only) -->
    <?php
    $dp = (isset($display_pricing) && is_array($display_pricing))
        ? $display_pricing
        : \Yatra\Services\TripPricingService::resolveDisplayPricing($trip);
    $qf_current = (float) ($dp['effective_price_min'] ?? 0);
    $qf_original = (float) ($dp['min_category_original_price'] ?? 0);
    if ($qf_original <= 0 && $qf_current > 0) {
        $qf_original = (float) ($trip->getOriginalPrice() ?? 0);
    }
    if ($qf_current > 0 || $qf_original > 0):
        $yatra_qf_dp = function_exists('yatra_get_dynamic_pricing_display_flags') ? yatra_get_dynamic_pricing_display_flags() : [
            'show_original_price' => true,
            'show_urgency_messages' => false,
        ];
        $show_strike = !empty($yatra_qf_dp['show_original_price']) && $qf_original > 0 && $qf_current > 0 && $qf_current < $qf_original;
    ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('dollar-sign', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Price', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php if ($qf_current > 0): ?>
                        <span class="yatra-price-current"><?php echo esc_html(yatra_format_price($qf_current)); ?></span>
                        <?php if ($show_strike): ?>
                            <span class="yatra-price-original"><?php echo esc_html(yatra_format_price($qf_original)); ?></span>
                        <?php endif; ?>
                        <?php
                        if (!empty($yatra_qf_dp['show_urgency_messages']) && function_exists('yatra_trip_card_dynamic_pricing_urgency_lines')) {
                            $yatra_qf_urg = yatra_trip_card_dynamic_pricing_urgency_lines((int) $trip->getId(), [
                                'base_sale_price' => $qf_current,
                                'base_original_price' => $qf_original,
                                'sale_price' => $qf_current,
                                'original_price' => $qf_original,
                                'departure_date' => null,
                                'spots_remaining' => null,
                                'availability_id' => null,
                                'surface' => 'quick_facts',
                            ]);
                            foreach ($yatra_qf_urg as $yatra_qf_line) {
                                echo '<div class="yatra-quick-fact-dp-urgency" style="margin-top:6px;font-size:11px;line-height:1.35;color:#92400e;background:#fef3c7;padding:4px 6px;border-radius:4px;">' . esc_html($yatra_qf_line) . '</div>';
                            }
                        }
                        ?>
                    <?php else: ?>
                        <span class="yatra-price-current"><?php echo esc_html(yatra_format_price($qf_original)); ?></span>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Rating -->
    <?php 
    $avg_rating = $trip->average_rating ?? 0;
    $review_count = $trip->review_count ?? 0;
    
    if ($avg_rating > 0): 
    ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('star', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Reviews', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <div class="yatra-rating-display">
                        <span class="yatra-rating-number"><?php echo esc_html(number_format($avg_rating, 1)); ?></span>
                        <div class="yatra-rating-stars">
                            <?php
                            $rating = round($avg_rating);
                            for ($i = 1; $i <= 5; $i++) {
                                if ($i <= $rating) {
                                    echo '<span class="star-filled">★</span>';
                                } else {
                                    echo '<span class="star-empty">☆</span>';
                                }
                            }
                            ?>
                        </div>
                        <span class="yatra-review-count">(<?php echo esc_html($review_count); ?> <?php echo esc_html(_n('review', 'reviews', $review_count, 'yatra')); ?>)</span>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>
</div>
</div>