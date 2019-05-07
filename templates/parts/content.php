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

    <header class="entry-header">

        <?php the_title('<h1 class="entry-title">', '</h1>'); ?>


        <div class="entry-meta">
            <?php yatra_posted_by(); ?>
            <?php yatra_posted_on();
            yatra_get_taxonomy_term_lists(get_the_ID(), 'activity');

            ?>

            <?php
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

    <div class="entry-content">
        <?php
        the_content(
            sprintf(
                wp_kses(
                /* translators: %s: Name of current post. Only visible to screen readers */
                    __('Continue reading<span class="screen-reader-text"> "%s"</span>', 'yatra'),
                    array(
                        'span' => array(
                            'class' => array(),
                        ),
                    )
                ),
                get_the_title()
            )
        );

        wp_link_pages(
            array(
                'before' => '<div class="page-links">' . __('Pages:', 'yatra'),
                'after' => '</div>',
            )
        );
        ?>
    </div><!-- .entry-content -->
    <div class="entry-footer">
        <?php
        yatra_get_taxonomy_term_lists(get_the_ID(), 'destination');

        ?>
    </div>

</article><!-- #post-${ID} -->
