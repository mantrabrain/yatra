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
    <?php
    $template = get_option('yatra_archive_template', 'template-default');
    switch ($template) {
        case "template-default":
            ?>

            <div class="yatra-thumb-wrap">
                <div class="inner">
                    <?php yatra_tour_thumbnail(); ?>
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
                            <div class="yatra-tour-price">
                                <?php

                                $tour_pricing = yatra_get_minimum_tour_pricing(get_the_ID());

                                ?>
                                <p><span><?php echo __('From ', 'yatra') ?></span>
                                    <?php if (floatval($tour_pricing['sales_price']) < 1) { ?>
                                        <span class="sales-price free"><?php echo __("Free", 'yatra'); ?></span>
                                    <?php } else { ?>
                                        <?php if (floatval($tour_pricing['sales_price']) != floatval($tour_pricing['regular_price'])) { ?>
                                            <del class="regular-price"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), $tour_pricing['regular_price']) ?></del>
                                        <?php } ?>
                                        <span class="sales-price"><?php echo yatra_get_price(yatra_get_current_currency_symbol(), $tour_pricing['sales_price']) ?></span>
                                    <?php } ?>
                                </p>
                            </div>
                            <div class="yatra-tour-more">
                                <a class="button"
                                   href="<?php the_permalink() ?>"><?php echo esc_html__('View Details', 'yatra') ?></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <?php
            break;

    }

    ?>
</div><!-- #tour-${ID} -->
