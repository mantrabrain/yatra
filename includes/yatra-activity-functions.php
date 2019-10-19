<?php

if (!function_exists('yatra_get_activity_lists')) {
    function yatra_get_activity_lists()
    {

        $activity_terms = get_terms(array(
            'taxonomy' => 'activity',
            'hide_empty' => false,
        ));
        echo '<div class="yatra-activity-wrap yatra-col-4">';

        foreach ($activity_terms as $term) {

            $data['data'] = array(
                'id' => $term->term_id,
                'name' => $term->name,
                'slug' => $term->slug,
                'count' => $term->count,
                'permalink' => get_term_link($term->term_id),
                'image' => ''
            );

            $attachment_id = (int)get_term_meta($term->term_id, 'activity_image_id', true);

            if ($attachment_id > 0) {

                $data['data']['image'] = wp_get_attachment_url($attachment_id);
            }

            yatra_get_template('activity/item.php', $data);

        }
        echo '</div>';

    }

}
