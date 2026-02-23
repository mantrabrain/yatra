<?php
if (!defined('ABSPATH')) {
    exit;
}

// Quick Facts Section for Single Trip Page
// Expected variables: $trip
?>
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
                if ($trip->trip_type === 'single_day') {
                    echo esc_html__('Day Trip', 'yatra');
                } else {
                    echo esc_html(yatra_format_duration($trip->duration_days, $trip->duration_nights));
                }
                ?>
            </div>
        </div>
    </div>

    <!-- Difficulty -->
    <?php if (!empty($trip->difficulty_level)): ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php 
                $difficulty_icons = [
                    'easy' => 'smile',
                    'moderate' => 'zap',
                    'challenging' => 'alert-triangle',
                    'difficult' => 'trending-up'
                ];
                $icon = $difficulty_icons[$trip->difficulty_level] ?? 'mountain';
                echo yatra_svg_icon($icon, 'yatra-icon-lg');
                ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Difficulty', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value"><?php echo esc_html(ucfirst($trip->difficulty_level)); ?></div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Landmarks -->
    <?php if (!empty($trip->landmarks) && is_array($trip->landmarks)): ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('map-pin', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Landmarks', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php 
                    $landmark_count = count($trip->landmarks);
                    echo esc_html(sprintf(_n('%d landmark', '%d landmarks', $landmark_count, 'yatra'), $landmark_count)); 
                    ?>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Seasonal Availability -->
    <?php if (!empty($trip->seasonal_availability)): ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('calendar', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Season', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php 
                    // Show seasonal availability, but limit length for display
                    $seasonal_text = $trip->seasonal_availability;
                    if (strlen($seasonal_text) > 20) {
                        $seasonal_text = substr($seasonal_text, 0, 20) . '...';
                    }
                    echo esc_html($seasonal_text); 
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
                $min_travelers = $trip->min_travelers ?? 1;
                $max_travelers = $trip->max_travelers ?? 20;
                echo esc_html(sprintf(__('%d-%d travelers', 'yatra'), $min_travelers, $max_travelers)); 
                ?>
            </div>
        </div>
    </div>

    <!-- Price -->
    <?php if (!empty($trip->original_price) && $trip->original_price > 0): ?>
        <div class="yatra-quick-fact">
            <div class="yatra-quick-fact-icon">
                <?php echo yatra_svg_icon('dollar-sign', 'yatra-icon-lg'); ?>
            </div>
            <div class="yatra-quick-fact-content">
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Price', 'yatra'); ?></div>
                <div class="yatra-quick-fact-value">
                    <?php 
                    $price = $trip->original_price;
                    if (!empty($trip->sale_price) && $trip->sale_price < $price) {
                        echo '<span class="yatra-price-current">' . yatra_format_price($trip->sale_price) . '</span>';
                        echo ' <span class="yatra-price-original">' . yatra_format_price($price) . '</span>';
                    } else {
                        echo '<span class="yatra-price-current">' . yatra_format_price($price) . '</span>';
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
                <div class="yatra-quick-fact-label"><?php echo esc_html__('Review', 'yatra'); ?></div>
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

<style>
/* Simple Quick Facts Styles */
.yatra-trip-quick-facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    width: 100%;
}

@media (min-width: 768px) {
    .yatra-trip-quick-facts {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 20px;
    }
}

@media (min-width: 1024px) {
    .yatra-trip-quick-facts {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 24px;
    }
}

.yatra-quick-fact {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
}

.yatra-quick-fact:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.yatra-quick-fact-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #f3f4f6;
    color: #6b7280;
    flex-shrink: 0;
}

.yatra-quick-fact-content {
    flex: 1;
    min-width: 0;
}

.yatra-quick-fact-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 2px;
}

.yatra-quick-fact-value {
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
    line-height: 1.2;
}

/* Rating Display */
.yatra-rating-display {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.yatra-rating-number {
    font-weight: 600;
    color: #374151;
}

.yatra-rating-stars {
    display: flex;
    gap: 1px;
    font-size: 0.8rem;
}

.star-filled {
    color: #fbbf24;
}

.star-empty {
    color: #d1d5db;
}

.yatra-review-count {
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 400;
}

/* Price Display */
.yatra-price-current {
    color: #059669;
    font-weight: 600;
}

.yatra-price-original {
    color: #9ca3af;
    text-decoration: line-through;
    font-weight: 400;
    font-size: 0.85em;
}

.yatra-no-reviews {
    color: #9ca3af;
    font-style: italic;
    font-size: 0.85rem;
}

/* Responsive design */
@media (max-width: 1024px) {
    .yatra-trip-quick-facts {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 768px) {
    .yatra-trip-quick-facts {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 16px;
    }
    
    .yatra-quick-fact {
        padding: 10px;
        gap: 10px;
    }
    
    .yatra-quick-fact-icon {
        width: 36px;
        height: 36px;
    }
    
    .yatra-quick-fact-value {
        font-size: 0.85rem;
    }
    
    .yatra-rating-display {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }
}

@media (max-width: 480px) {
    .yatra-trip-quick-facts {
        grid-template-columns: 1fr;
        gap: 10px;
        padding: 12px;
    }
    
    .yatra-quick-fact {
        padding: 8px;
    }
    
    .yatra-quick-fact-icon {
        width: 32px;
        height: 32px;
    }
    
    .yatra-quick-fact-value {
        font-size: 0.8rem;
    }
}
</style>