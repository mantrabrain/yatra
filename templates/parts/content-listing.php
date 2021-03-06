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
    <?php
    $template = get_option('yatra_archive_template', 'template-default');
    switch ($template) {
        case "template-default":
            ?>

            <div class="thumb-wrap">
                <div class="inner">
                    <?php yatra_post_thumbnail(); ?>
                </div>
            </div>

            <div class="content-wrap">
                <div class="inner">
                    <?php yatra_entry_header(); ?>
                    <?php yatra_entry_post_content(); ?>
                </div>
            </div>


            <div class="meta-content-wrap">
                <div class="inner">
                    <?php yatra_entry_meta_options(); ?>
                </div>
            </div>


            <?php
            break;

    }

    //yatra_entry_footer();

    ?>
</article><!-- #post-${ID} -->
