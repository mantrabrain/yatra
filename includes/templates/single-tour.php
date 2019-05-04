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
    <section class="wrapper wrap-detail-page" id="main-content">
        <div class="container">
            <div class="row">
                <?php if (yatri_get_option('single_layout') == 'left'): ?>
                    <?php get_sidebar(); ?>
                <?php endif; ?>
                <?php $class = ''; ?>
                <div class="<?php echo esc_attr($class); ?>">
                    <main id="main" class="post-main-content" role="main">
                        <?php
                        # Loop Start
                        while (have_posts()): the_post();


                            # Print posts respect to the post format
                            ?>
                            <article id="post-<?php the_ID(); ?>" <?php post_class('post-content'); ?>>
                                <div class="post-content-inner">
                                    <?php if (has_post_thumbnail()): ?>
                                        <div class="post-thumbnail">
                                            <?php the_post_thumbnail('yatri-1200-850'); ?>
                                        </div>
                                    <?php endif; ?>
                                    <div class="post-text">
                                        <?php
                                        # Prints out the contents of this post after applying filters.
                                        the_content();
                                        ?>
                                    </div>

                                </div>

                            </article>
                            <div class="book-btn">
                                <?php $book_now_text = __('Book Now', 'yatra'); ?>
                                <a href="" class="btn primary-btn yatra-book-now-btn"
                                   data-text="<?php echo esc_attr($book_now_text); ?>" data-loading-text="Loading...."
                                   data-tour-id="<?php the_ID(); ?>"><?php echo esc_html($book_now_text); ?></a>
                            </div>
                        <?php

                            # Loop End
                        endwhile;
                        ?>
                    </main>
                </div>
            </div>
        </div>
    </section>

<?php

get_footer();