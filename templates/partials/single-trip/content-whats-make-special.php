<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="what-makes-special">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon($tab->icon ?? 'star', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('What Makes This Trip Special', 'yatra')); ?>
    </h2>
    <div class="yatra-trip-special-container">
        <div class="yatra-trip-special-content">
            <div class="yatra-special-features">
                <?php 
                $special_content = $trip->what_makes_special ?? '';
                if (!empty($special_content)) {
                    // Split content by lines and create feature items
                    $features = preg_split('/\r\n|\r|\n/', $special_content);
                    $features = array_filter($features, function($line) {
                        return !empty(trim($line));
                    });
                    
                    if (!empty($features)) {
                        foreach ($features as $index => $feature) {
                            $feature = trim($feature);
                            if (!empty($feature)) {
                                ?>
                                <div class="yatra-special-feature-item">
                                    <div class="yatra-special-feature-icon">
                                        <?php echo yatra_svg_icon('check-circle', 'yatra-feature-check'); ?>
                                    </div>
                                    <div class="yatra-special-feature-text">
                                        <?php echo wp_kses_post($feature); ?>
                                    </div>
                                </div>
                                <?php
                            }
                        }
                    } else {
                        // Fallback to simple paragraph if no line breaks
                        ?>
                        <div class="yatra-special-feature-item">
                            <div class="yatra-special-feature-icon">
                                <?php echo yatra_svg_icon('star', 'yatra-feature-check'); ?>
                            </div>
                            <div class="yatra-special-feature-text">
                                <?php echo wp_kses_post($special_content); ?>
                            </div>
                        </div>
                        <?php
                    }
                } else {
                    echo '<p class="yatra-no-content">' . esc_html__('No special features listed for this trip yet.', 'yatra') . '</p>';
                }
                ?>
            </div>
        </div>
        
        <?php if (!empty($special_content)): ?>
            <div class="yatra-special-badge">
                <?php echo yatra_svg_icon('award', 'yatra-badge-icon'); ?>
                <span><?php echo esc_html__('Premium Experience', 'yatra'); ?></span>
            </div>
        <?php endif; ?>
    </div>
</section>

<style>
.yatra-trip-special-container {
    max-width: 800px;
    margin: 0 auto;
}

.yatra-trip-special-content {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
}

.yatra-trip-special-content::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%);
    animation: float 6s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
}

.yatra-special-features {
    position: relative;
    z-index: 1;
}

.yatra-special-feature-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    transition: all 0.3s ease;
}

.yatra-special-feature-item:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px rgba(251, 191, 36, 0.2);
}

.yatra-special-feature-item:last-child {
    margin-bottom: 0;
}

.yatra-special-feature-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    color: #f59e0b;
    margin-top: 2px;
}

.yatra-special-feature-text {
    font-size: 1rem;
    line-height: 1.6;
    color: #78350f;
    font-weight: 500;
}

.yatra-special-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 12px 20px;
    background: #f59e0b;
    color: white;
    border-radius: 25px;
    font-weight: 600;
    font-size: 0.875rem;
    box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
}

.yatra-badge-icon {
    width: 16px;
    height: 16px;
}

.yatra-no-content {
    color: #92400e;
    font-style: italic;
    text-align: center;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 12px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .yatra-trip-special-content {
        background: linear-gradient(135deg, #451a03 0%, #78350f 100%);
    }
    
    .yatra-special-feature-item {
        background: rgba(30, 41, 59, 0.7);
    }
    
    .yatra-special-feature-item:hover {
        background: rgba(30, 41, 59, 0.9);
    }
    
    .yatra-special-feature-text {
        color: #fbbf24;
    }
    
    .yatra-special-badge {
        background: #f59e0b;
        color: #451a03;
    }
    
    .yatra-no-content {
        color: #fbbf24;
        background: rgba(30, 41, 59, 0.5);
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .yatra-trip-special-content {
        padding: 30px 20px;
    }
    
    .yatra-special-feature-item {
        padding: 12px;
        gap: 12px;
    }
    
    .yatra-special-feature-icon {
        width: 20px;
        height: 20px;
    }
    
    .yatra-special-feature-text {
        font-size: 0.9rem;
    }
}
</style>