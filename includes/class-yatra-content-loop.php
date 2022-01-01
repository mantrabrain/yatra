<?php

class Yatra_Content_Loop
{
    public static function loop()
    {
        if (have_posts()) {

            // Start the Loop.
            while (have_posts()) :
                the_post();

                $template = '';

                if (!is_single()) {

                    $template = 'listing';
                }
                yatra_get_template_part('parts/content', $template);

            endwhile;

        } else {
            yatra_get_template_part('parts/content', 'none');

        }

    }

}