<?php

namespace Yatra\Core\Hooks;
class TourHooks
{

    public static function init()
    {
        $self = new self;

        add_action('the_post', 'yatra_setup_tour_data');

        add_action('yatra_after_tour_update', array($self, 'after_tour_update'));

    }

    public function after_tour_update($tour_id)
    {
        $tour_type = isset($_POST['yatra_tour_meta_tour_type']) ? sanitize_text_field($_POST['yatra_tour_meta_tour_type']) : 'regular';

        $all_tour_type = yatra_get_tour_types();

        $tour_type = isset($all_tour_type[$tour_type]) ? $tour_type : 'regular';

        $disable_booking = isset($_POST['yatra_tour_meta_disable_booking']) && (boolean)$_POST['yatra_tour_meta_disable_booking'];

        update_post_meta($tour_id, 'yatra_tour_meta_tour_type', $tour_type);

        update_post_meta($tour_id, 'yatra_tour_meta_disable_booking', $disable_booking);

    }
}