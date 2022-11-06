<?php

namespace Yatra\Core\Tour;

class TourHooks
{
    public static function init()
    {
        add_action('the_post', 'yatra_setup_tour_data');
    }
}