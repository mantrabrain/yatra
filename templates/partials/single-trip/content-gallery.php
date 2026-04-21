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
        $gallery_images = array_values(array_filter($yatra_hero_gallery_images ?? []));
        if (empty($gallery_images)) :
            ?>
            <p class="yatra-trip-gallery-empty"><?php echo esc_html__('Photos will appear here when this trip has gallery images.', 'yatra'); ?></p>
            <?php
        else :
            foreach ($gallery_images as $index => $image) :
                ?>
                <div class="yatra-gallery-item" data-image-index="<?php echo esc_attr($index); ?>" itemscope itemtype="https://schema.org/ImageObject">
                    <img src="<?php echo esc_url($image); ?>"
                         alt="<?php echo esc_attr(sprintf(__('Photo %d of %s trip gallery', 'yatra'), $index + 1, $trip->getTitle())); ?>"
                         title="<?php echo esc_attr(sprintf(__('Photo %d - %s', 'yatra'), $index + 1, $trip->getTitle())); ?>"
                         itemprop="url" content="<?php echo esc_url($image); ?>"
                         data-yatra-src="<?php echo esc_url($image); ?>"
                         data-no-lazy="1">
                    <meta itemprop="contentUrl" content="<?php echo esc_url($image); ?>">
                    <meta itemprop="name" content="<?php echo esc_attr(sprintf(__('Photo %d - %s', 'yatra'), $index + 1, $trip->getTitle())); ?>">
                    <meta itemprop="description" content="<?php echo esc_attr(sprintf(__('Photo %d from the %s trip gallery', 'yatra'), $index + 1, $trip->getTitle())); ?>">
                    <meta itemprop="position" content="<?php echo $index + 1; ?>">
                    <meta itemprop="encodingFormat" content="image/jpeg">
                </div>
                <?php
            endforeach;
        endif;
        ?>
    </div>
</section>