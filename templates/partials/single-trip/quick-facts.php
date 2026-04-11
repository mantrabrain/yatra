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

    <!-- Price -->
    <?php 
    $original_price = $trip->getOriginalPrice();
    if ($original_price > 0): 
    ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('dollar-sign', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Price', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php 
                    $sale_price = $trip->getSalePrice();
                    if ($sale_price > 0 && $sale_price < $original_price) {
                        echo '<span class="yatra-price-current">' . yatra_format_price($sale_price) . '</span>';
                        echo ' <span class="yatra-price-original">' . yatra_format_price($original_price) . '</span>';
                    } else {
                        echo '<span class="yatra-price-current">' . yatra_format_price($original_price) . '</span>';
                    }
                    ?>
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