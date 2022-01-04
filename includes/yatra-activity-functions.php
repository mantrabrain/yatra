<?php

if (!function_exists('yatra_get_activity_lists')) {
    function yatra_get_activity_lists($atts = array())
    {
        $order = isset($atts['order']) ? sanitize_text_field($atts['order']) : 'ASC';

        $columns = isset($atts['columns']) ? absint($atts['columns']) : 4;

        $order = in_array(strtolower($order), array('asc', 'desc')) ? $order : 'asc';

        $activity_terms = get_terms(array(
            'taxonomy' => 'activity',
            'hide_empty' => false,
            'order' => $order,
        ));

        $grid_class = 'yatra-col-sm-6 ';

        switch ($columns) {
            case 2:
                $grid_class .= 'yatra-col-md-6';
                break;
            case 3:
                $grid_class .= 'yatra-col-md-4';
                break;
            default:
                $grid_class .= 'yatra-col-md-3';
        }

        echo '<div class="yatra-activity-list-container">';

        echo '<div class="yatra-row yatra-activity-wrap">';

        foreach ($activity_terms as $term) {

            $data['data'] = array(
                'id' => $term->term_id,
                'name' => $term->name,
                'slug' => $term->slug,
                'count' => $term->count,
                'permalink' => get_term_link($term->term_id),
                'image' => '',
                'class' => $grid_class
            );

            $attachment_id = (int)get_term_meta($term->term_id, 'activity_image_id', true);

            if ($attachment_id > 0) {

                $data['data']['image'] = wp_get_attachment_url($attachment_id);
            }

            yatra_get_template('activity/item.php', $data);

        }
        echo '</div>';

        echo '</div>';

    }

}
