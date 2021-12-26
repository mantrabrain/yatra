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
                                <p>From $2000</p>
                            </div>
                            <div class="yatra-tour-more">
                                <a class="" href="https://themepalacedemo.com/tourable-pro/itinerary/venice-beach/">Explore</a>
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
