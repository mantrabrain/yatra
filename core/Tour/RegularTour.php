<?php

namespace Yatra\Core\Tour;

class RegularTour
{
    private $tour_id = 0;

    private $is_booking_disabled = false;

    public function __construct($tour_id)
    {
        $this->tour_id = $tour_id;

        $this->is_booking_disabled = (boolean)get_post_meta($this->tour_id, 'yatra_tour_meta_disable_booking', true);
    }

    public function is_booking_disabled()
    {
        return $this->is_booking_disabled;
    }
}