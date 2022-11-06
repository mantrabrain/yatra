<?php

namespace Yatra\Core\Tour;

class TourFactory
{

    public function __construct()
    {
        require_once YATRA_ABSPATH . 'core/Tour/functions.php';

        TourHooks::init();
    }

    /**
     * @param $tour_id : tour ID
     *
     * @return RegularTour
     */
    public function get_tour($tour_id)
    {
        $tour_id = $this->get_tour_id($tour_id);

        if (!$tour_id) {
            return false;
        }
        return new RegularTour($tour_id);

    }


    public function get_tour_id($tour_id)
    {
        if ($tour_id instanceof \WP_Post) {
            return $tour_id->ID;
        }
        return absint($tour_id);
    }
}