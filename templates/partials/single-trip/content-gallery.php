<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="gallery" itemscope itemtype="https://schema.org/ImageGallery">
    <h2 class="yatra-trip-section-title">
        <?php echo yatra_svg_icon('camera', 'yatra-trip-section-title-icon'); ?>
        <?php echo esc_html__('Photo Gallery', 'yatra'); ?>
    </h2>
    <div class="yatra-trip-gallery" data-gallery="hero-gallery">
        <?php 
        global $yatra_hero_gallery_images;
        $gallery_images = $yatra_hero_gallery_images ?? [];
        foreach ($gallery_images as $index => $image): ?>
            <?php if ($image): ?>
                <div class="yatra-gallery-item" data-image-index="<?php echo esc_attr($index); ?>" itemscope itemtype="https://schema.org/ImageObject">
                    <img src="<?php echo esc_url($image); ?>" 
                         alt="<?php echo esc_attr(sprintf(__('Photo %d of %s trip gallery', 'yatra'), $index + 1, $trip->title)); ?>"
                         title="<?php echo esc_attr(sprintf(__('Photo %d - %s', 'yatra'), $index + 1, $trip->title)); ?>"
                         itemprop="url" content="<?php echo esc_url($image); ?>">
                    <meta itemprop="contentUrl" content="<?php echo esc_url($image); ?>">
                    <meta itemprop="name" content="<?php echo esc_attr(sprintf(__('Photo %d - %s', 'yatra'), $index + 1, $trip->title)); ?>">
                    <meta itemprop="description" content="<?php echo esc_attr(sprintf(__('Photo %d from the %s trip gallery', 'yatra'), $index + 1, $trip->title)); ?>">
                    <meta itemprop="position" content="<?php echo $index + 1; ?>">
                    <meta itemprop="encodingFormat" content="image/jpeg">
                </div>
            <?php endif; ?>
        <?php endforeach; ?>
    </div>
</section>