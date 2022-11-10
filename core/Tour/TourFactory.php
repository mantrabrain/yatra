<?php

namespace Yatra\Core\Tour;

class TourFactory
{
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

        $tour_type = self::get_tour_type($tour_id);

        $class = self::get_tour_classname($tour_id, $tour_type);

        return new $class($tour_id);

    }


    public function get_tour_id($tour_id)
    {
        if ($tour_id instanceof \WP_Post) {
            return $tour_id->ID;
        }
        return absint($tour_id);
    }

    public static function get_tour_type($tour_id)
    {
        $default = 'regular';

        $tour_type = get_post_meta($tour_id, 'yatra_tour_meta_tour_type', true);

        if ($tour_type == '') {

            return $default;
        }

        $all_types = yatra_get_tour_types();

        if (isset($all_types[$tour_type])) {

            return $tour_type;
        }
        return $default;
    }

    public static function get_tour_classname($tour_id, $tour_type)
    {
        $classname = apply_filters('yatra_tour_class_name', self::get_classname_from_tour_type($tour_type), $tour_type, $tour_id);

        if (!$classname || !class_exists($classname)) {

            $classname = 'Yatra\\Core\\Tour\\RegularTour';
        }

        return $classname;
    }

    public static function get_classname_from_tour_type($tour_type)
    {
        $namespace = "Yatra\\Core\\Tour\\";

        $tour_type = ucwords(str_replace('_', ' ', $tour_type));

        $tour_type = preg_replace('/\s+/', '', $tour_type) . 'Tour';

        return ($namespace . $tour_type);
    }
}