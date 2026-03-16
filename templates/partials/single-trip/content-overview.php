<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="overview" itemscope itemtype="https://schema.org/TouristTrip">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab->icon ?? null, 'book', 'yatra-trip-section-title-icon', $tab->label ?? 'Overview'); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('Overview', 'yatra')); ?>
    </h2>
    
    <?php if (!empty($trip->short_description)): ?>
        <div class="yatra-trip-short-description-lead" itemprop="description">
            <?php echo \Yatra\Helpers\FormatHelper::sanitizeQuillHtml($trip->short_description); ?>
        </div>
    <?php endif; ?>
    
    <div class="yatra-trip-description" itemprop="about">
        <?php echo \Yatra\Helpers\FormatHelper::sanitizeQuillHtml($trip->description ?? ''); ?>
    </div>

    <?php if (is_array($trip->highlights) && count($trip->highlights) > 0): ?>
        <div class="yatra-trip-highlights" itemprop="additionalProperty" itemscope itemtype="https://schema.org/PropertyValue">
            <meta itemprop="name" content="<?php esc_attr_e('Trip Highlights', 'yatra'); ?>">
            <?php foreach ($trip->highlights as $index => $highlight): ?>
                <?php if (!empty(trim($highlight))): ?>
                    <div class="yatra-highlight-item" itemprop="value" itemscope itemtype="https://schema.org/Text">
                        <?php echo yatra_svg_icon('star', 'yatra-highlight-icon'); ?>
                        <p class="yatra-highlight-text" itemprop="text"><?php echo esc_html($highlight); ?></p>
                        <meta itemprop="position" content="<?php echo $index + 1; ?>">
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>


    </section>

<style>
.yatra-trip-short-description-lead {
    font-size: 1.125rem;
    line-height: 1.7;
    color: #475569;
    font-weight: 500;
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    border-left: 4px solid #3b82f6;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .yatra-trip-short-description-lead {
        color: #cbd5e1;
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        border-left-color: #60a5fa;
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .yatra-trip-short-description-lead {
        font-size: 1rem;
        padding: 16px;
        margin-bottom: 20px;
    }
}
</style>