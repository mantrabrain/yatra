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
    yatra_single_tour_additional_information();
    if (has_post_thumbnail()) {
        yatra_tour_thumbnail('full');
    } ?>
    <div class="yatra-single-meta-content">

        <header class="yatra-tour-header">

            <?php the_title('<h1 class="yatra-tour-title">', '</h1>'); ?>


            <div class="yatra-tour-meta">
                <?php
                yatra_get_taxonomy_term_lists(get_the_ID(), 'destination', false, 'fas fa-map-marker-alt');
                yatra_get_taxonomy_term_lists(get_the_ID(), 'activity', false, 'fa fa-universal-access');
                ?>
            </div><!-- .meta-info -->

        </header>


        <div class="yatra-tour-content">

            <?php
            the_content();
            // Edit post link

            ?>
        </div><!-- .yatra-tour-content -->
        <div class="entry-footer">
            <?php  ?>
        </div>
    </div>
    <div class="yatra-tour-content entry-tabs">
        <?php
        yatra_frontend_tabs(); ?>
    </div>
    <?php
    edit_post_link(
        sprintf(
            wp_kses(
            /* translators: %s: Name of current post. Only visible to screen readers. */
                __('Edit <span class="screen-reader-text">%s</span>', 'yatra'),
                array(
                    'span' => array(
                        'class' => array(),
                    ),
                )
            ),
            get_the_title()
        ),
        '<span class="edit-link">',
        '</span>'
    );

    wp_link_pages(
        array(
            'before' => '<div class="page-links">' . __('Pages:', 'yatra'),
            'after' => '</div>',
        )
    ); ?>
</div><!-- #tour-${ID} -->
