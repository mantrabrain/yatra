<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="overview" itemscope itemtype="https://schema.org/TouristTrip">
    <h2 class="yatra-trip-section-title">
        <?php yatra_render_tab_icon($tab->icon ?? null, 'book', 'yatra-trip-section-title-icon', $tab->label ?? __('Overview', 'yatra')); ?>
        <?php echo esc_html(isset($tab->label) ? $tab->label : __('Overview', 'yatra')); ?>
    </h2>
    
    <?php if (!empty($trip->getShortDescription())): ?>
        <div class="yatra-trip-short-description-lead" itemprop="description">
            <?php echo \Yatra\Helpers\FormatHelper::sanitizeQuillHtml($trip->getShortDescription()); ?>
        </div>
    <?php endif; ?>
    
    <div class="yatra-trip-description" itemprop="about">
        <?php echo \Yatra\Helpers\FormatHelper::sanitizeQuillHtml($trip->getDescription()); ?>
    </div>

    <?php 
    $highlights = $trip->getHighlights();
    if (!empty($highlights)): 
    ?>
        <div class="yatra-trip-highlights" itemprop="additionalProperty" itemscope itemtype="https://schema.org/PropertyValue">
            <meta itemprop="name" content="<?php esc_attr_e('Trip Highlights', 'yatra'); ?>">
            <?php foreach ($highlights as $index => $highlight): ?>
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