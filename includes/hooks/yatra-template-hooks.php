<?php

class Yatra_Template_Hooks
{
    public function __construct()
    {
        add_action('yatra_main_content', array($this, 'single_tour_info'), 15);
        add_action('single_tour_info', array($this, 'tour_info'), 10);
    }

    public function single_tour_info()
    {
        if (is_single()) {
            do_action('single_tour_info');
        }
    }

    public function tour_info()
    {
        yatra_get_template('parts/tour-sidebar.php',
            array(
                //'map' => $yatra_tour_meta_map_content,
                //'title' => $title
            )
        );
    }

}

new Yatra_Template_Hooks();