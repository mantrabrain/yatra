<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<section class="yatra-trip-section" id="gallery">
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
                <div class="yatra-gallery-item" data-image-index="<?php echo esc_attr($index); ?>">
                    <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr(sprintf(__('Gallery Image %d', 'yatra'), $index + 1)); ?>">
                </div>
            <?php endif; ?>
        <?php endforeach; ?>
    </div>
</section>