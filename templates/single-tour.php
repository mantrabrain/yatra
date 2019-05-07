<?php
/**
 * The template for displaying all single tour
 *
 * @package Yatra
 * @subpackage Yatra/includes
 * @since 1.0.0
 */

get_header();
?>
    <section id="primary" class="content-area">
        <main id="main" class="site-main">

            <?php

            /* Start the Loop */
            while (have_posts()) :
                the_post();

                ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>

                    <header class="entry-header">

                        <?php the_title('<h1 class="entry-title">', '</h1>'); ?>


                        <div class="entry-meta">
                            <?php yatra_posted_by(); ?>
                            <?php yatra_posted_on(); ?>
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

                </article><!-- #post-${ID} -->
            <?php


            endwhile; // End of the loop.
            ?>
            <div class="yatra-book-btn-wrapper book-btn">
                <?php $book_now_text = __('Book Now', 'yatra'); ?>
                <a href="" class="btn primary-btn yatra-book-now-btn"
                   data-text="<?php echo esc_attr($book_now_text); ?>" data-loading-text="Loading...."
                   data-tour-id="<?php the_ID(); ?>"><?php echo esc_html($book_now_text); ?></a>
            </div>
        </main><!-- #main -->
    </section><!-- #primary -->

<?php

get_footer();