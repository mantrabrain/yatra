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

                yatra_get_template_part('parts/content');


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