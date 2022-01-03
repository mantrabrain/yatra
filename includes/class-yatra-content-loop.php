<?php

class Yatra_Content_Loop
{
    public static function loop()
    {
        
        if (have_posts()) {

            do_action('yatra_before_main_content_loop');

            // Start the Loop.
            while (have_posts()) :
                the_post();

                $template = '';

                if (!is_single()) {

                    $template = 'listing';
                }
                yatra_get_template_part('parts/content', $template);

            endwhile;

            do_action('yatra_after_main_content_loop');

        } else {
            yatra_get_template_part('parts/content', 'none');

        }


    }

}