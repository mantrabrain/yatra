<?php

namespace Yatra\Core\Data;

use Yatra\Core\Abstracts\TourParent;

class TourData
{
    /* @var \Yatra\Core\Abstracts\TourParent $tourParent */
    public function read($tourParent)
    {
        $id = $tourParent->get_id();

        $tourParent->set_name(get_the_title($id));
        $tourParent->set_status(get_post_status($id));
        $tourParent->set_type(get_post_meta($id, 'yatra_tour_meta_tour_type', true));
        $disable_booking = get_post_meta($id, 'yatra_tour_meta_disable_booking', true);
        $is_featured = get_post_meta($id, 'yatra_tour_meta_tour_featured', true);
        $tourParent->set_is_featured((boolean)$is_featured);
        $can_book = !((boolean)$disable_booking === true);
        $tourParent->set_can_book($can_book);
        $is_fixed_departure = get_post_meta($id, 'yatra_tour_meta_tour_fixed_departure', true);
        $tourParent->set_is_fixed_departure((boolean)$is_fixed_departure);
        $tourParent->set_external_url(get_post_meta($id, 'yatra_tour_meta_tour_external_url', true));
        $tourParent->set_book_now_text(get_post_meta($id, 'yatra_tour_meta_tour_external_button_text', true));
    }
}