<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="trip-story">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon($tab->icon ?? 'book', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('Trip Story', 'yatra')); ?>
    </h2>
    <div class="yatra-trip-story-container">
        <div class="yatra-trip-story-content">
            <div class="yatra-trip-story-text">
                <?php 
                $story_content = $trip->trip_story ?? '';
                if (!empty($story_content)) {
                    // Use wp_kses_post to allow basic HTML formatting but strip dangerous content
                    echo wp_kses_post($story_content);
                } else {
                    echo '<p class="yatra-no-content">' . esc_html__('No story available for this trip yet.', 'yatra') . '</p>';
                }
                ?>
            </div>
        </div>
        
        <?php if (!empty($story_content)): ?>
            <div class="yatra-trip-story-meta">
                <div class="yatra-story-highlight">
                    <?php echo yatra_svg_icon('heart', 'yatra-story-icon'); ?>
                    <span><?php echo esc_html__('Crafted with passion for travelers like you', 'yatra'); ?></span>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>

<style>
.yatra-trip-story-container {
    max-width: 800px;
    margin: 0 auto;
}

.yatra-trip-story-content {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
}

.yatra-trip-story-content::before {
    content: '"';
    position: absolute;
    top: -20px;
    left: 20px;
    font-size: 120px;
    color: #e2e8f0;
    font-family: Georgia, serif;
    z-index: 0;
}

.yatra-trip-story-text {
    position: relative;
    z-index: 1;
    font-size: 1.125rem;
    line-height: 1.8;
    color: #475569;
}

.yatra-trip-story-text p {
    margin-bottom: 1.5rem;
}

.yatra-trip-story-text p:last-child {
    margin-bottom: 0;
}

.yatra-trip-story-text h1,
.yatra-trip-story-text h2,
.yatra-trip-story-text h3 {
    color: #1e293b;
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.yatra-trip-story-text h1 { font-size: 1.875rem; }
.yatra-trip-story-text h2 { font-size: 1.5rem; }
.yatra-trip-story-text h3 { font-size: 1.25rem; }

.yatra-trip-story-text ul,
.yatra-trip-story-text ol {
    margin: 1.5rem 0;
    padding-left: 2rem;
}

.yatra-trip-story-text li {
    margin-bottom: 0.5rem;
    color: #475569;
}

.yatra-trip-story-text blockquote {
    border-left: 4px solid #3b82f6;
    padding-left: 1.5rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: #64748b;
}

.yatra-trip-story-text strong {
    color: #1e293b;
    font-weight: 600;
}

.yatra-trip-story-text em {
    color: #64748b;
    font-style: italic;
}

.yatra-trip-story-meta {
    margin-top: 24px;
    text-align: center;
}

.yatra-story-highlight {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #fef3c7;
    border-radius: 20px;
    color: #92400e;
    font-size: 0.875rem;
    font-weight: 500;
}

.yatra-story-icon {
    width: 16px;
    height: 16px;
}

.yatra-no-content {
    color: #94a3b8;
    font-style: italic;
    text-align: center;
    padding: 2rem;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .yatra-trip-story-content {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
    
    .yatra-trip-story-content::before {
        color: #475569;
    }
    
    .yatra-trip-story-text {
        color: #cbd5e1;
    }
    
    .yatra-trip-story-text h1,
    .yatra-trip-story-text h2,
    .yatra-trip-story-text h3 {
        color: #f8fafc;
    }
    
    .yatra-trip-story-text li {
        color: #cbd5e1;
    }
    
    .yatra-trip-story-text blockquote {
        color: #94a3b8;
        border-left-color: #60a5fa;
    }
    
    .yatra-trip-story-text strong {
        color: #f8fafc;
    }
    
    .yatra-trip-story-text em {
        color: #94a3b8;
    }
    
    .yatra-story-highlight {
        background: #451a03;
        color: #fbbf24;
    }
    
    .yatra-no-content {
        color: #64748b;
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .yatra-trip-story-content {
        padding: 30px 20px;
    }
    
    .yatra-trip-story-text {
        font-size: 1rem;
    }
    
    .yatra-trip-story-content::before {
        font-size: 80px;
        top: -10px;
        left: 10px;
    }
}
</style>
