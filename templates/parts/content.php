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
<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
    <div class="yatra-single-meta-content">

        <header class="entry-header">

            <?php the_title('<h1 class="entry-title">', '</h1>'); ?>


            <div class="entry-meta">
                <?php yatra_posted_by(); ?>
                <?php yatra_posted_on();
                echo "&nbsp;";
                yatra_get_taxonomy_term_lists(get_the_ID(), 'destination');
                yatra_post_thumbnail('full');
                // Edit post link.
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
                ?>
            </div><!-- .meta-info -->

        </header>

        <div class="entry-footer">
            <?php yatra_get_taxonomy_term_lists(get_the_ID(), 'activity'); ?>
        </div>
        <div class="entry-content">

            <?php
            the_content();
            wp_link_pages(
                array(
                    'before' => '<div class="page-links">' . __('Pages:', 'yatra'),
                    'after' => '</div>',
                )
            );
            ?>
        </div><!-- .entry-content -->
    </div>
    <div class="yatra-single-meta-options">
        <?php

        yatra_frontend_options();
        ?>

    </div>

    <div class="entry-content entry-tabs">
        <?php
        yatra_book_now_button();
        yatra_frontend_tabs(); ?>
    </div>


</article><!-- #post-${ID} -->
