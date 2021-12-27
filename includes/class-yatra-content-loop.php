<?php

class Yatra_Content_Loop
{
    public static function loop()
    {
        if (have_posts()) {


            if (!is_single()) {
                ?>
                <header class="yatra-page-header">
                    <?php
                    the_archive_title('<h1 class="page-title">', '</h1>');
                    ?>
                </header><!-- .page-header -->

                <?php
            }
            // Start the Loop.
            while (have_posts()) :
                the_post();

                $template = '';
                if (!is_single()) {

                    $template = 'listing';
                }
                yatra_get_template_part('parts/content', $template);

            endwhile;


            if (!is_single()) {
                the_posts_pagination(array(
                    'prev_text' => '<i class="fa fa-angle-double-left"></i>',
                    'next_text' => '<i class="fa fa-angle-double-right"></i>'
                ));
            }

        } else {
            yatra_get_template_part('parts/content', 'none');

        }

    }

}