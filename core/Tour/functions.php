<?php

use Yatra\Core\Tour\RegularTour;

/**
 * @param mixed $the_tour Post object or post ID of the tour.
 * @return RegularTour|null|false
 * @since 2.1.12
 *
 */
function yatra_get_tour($the_tour = false)
{
    if (!did_action('yatra_loaded')) {
        /* translators: 1: yatra_loaded */
        _doing_it_wrong(__FUNCTION__, sprintf(__('%1$s should not be called before the %2$s actions have finished.', 'yatra'), 'yatra_loaded'), '2.1.12');
        return false;
    }

    return yatra()->tour_factory->get_tour($the_tour);
}

function yatra_setup_tour_data($post)
{
    /**
     * @global RegularTour $yatra_tour
     * @since 2.1.12
     */
    global $yatra_tour;

    if (is_int($post)) {
        $post = get_post($post);
    }

    if (empty($post->post_type) || !in_array($post->post_type, array('tour'), true)) {
        return;
    }
    $yatra_tour = yatra_get_tour($post);

}

