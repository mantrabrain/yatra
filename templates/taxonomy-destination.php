<?php
/**
 * The template for displaying trips archive page
 *
 * @package Yatra
 * @subpackage Yatra/includes/templates
 * @since 1.0.0
 */
get_header();
?>

    <section id="primary" class="content-area">
        <main id="main" class="site-main">

            <?php if (have_posts()) : ?>

                <header class="page-header">
                    <?php
                    the_archive_title('<h1 class="page-title">', '</h1>');
                    ?>
                </header><!-- .page-header -->

                <?php
                // Start the Loop.
                while (have_posts()) :
                    the_post();

                    /*
                     * Include the Post-Format-specific template for the content.
                     * If you want to override this in a child theme, then include a file
                     * called content-___.php (where ___ is the Post Format name) and that will be used instead.
                     */

                    yatra_get_template_part('parts/content', 'listing');

                    // End the loop.
                endwhile;

                // Previous/next page navigation.
                the_posts_pagination(array(
                    'prev_text' => '<i class="fa fa-angle-double-left"></i>',
                    'next_text' => '<i class="fa fa-angle-double-right"></i>'
                ));


            // If no content, include the "No posts found" template.
            else :
                yatra_get_template_part('parts/content', 'none');

            endif;
            ?>
        </main><!-- #main -->
    </section><!-- #primary -->

<?php
get_footer();