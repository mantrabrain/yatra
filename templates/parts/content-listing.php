<?php
/**
 * Template part for displaying posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package WordPress
 * @subpackage Yatra
 * @since 1.0.0
 */

?>
<div id="tour-<?php the_ID(); ?>" <?php yatra_tour_class(); ?>>
    <div class="yatra-tour-single-item-inner">
        <div class="yatra-thumb-wrap">
            <div class="inner">
                <?php
                if (yatra_is_featured_tour()) {
                    echo '<span class="yatra-featured-tour"><i class="icon fa fa-bullhorn"></i><small class="text">' . __('Featured', 'yatra') . '</small></span>';
                }
                yatra_tour_thumbnail(); ?>
            </div>
        </div>
        <div class="yatra-content-wrap">
            <div class="inner">
                <div class="yatra-content-left">
                    <?php yatra_entry_header(); ?>
                    <?php yatra_entry_post_content(); ?>

                    <div class="yatra-meta-content-wrap">
                        <div class="inner">
                            <?php yatra_entry_meta_options(); ?>
                        </div>
                    </div>
                </div>
                <div class="yatra-content-right">
                    <div class="yatra-tour-details">
                        <?php yatra_get_price_html(get_the_ID()); ?>
                        <div class="yatra-tour-more">
                            <a class="yatra-button button yatra-tour-details-button"
                               href="<?php the_permalink() ?>"><?php echo esc_html(yatra_get_tour_view_details_button_text()) ?></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div><!-- #tour-${ID} -->
