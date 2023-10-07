<?php

if (!function_exists('yatra_get_activity_lists')) {

    function yatra_get_activity_lists($atts = array())
    {
        $order = isset($atts['order']) ? sanitize_text_field($atts['order']) : 'ASC';

        $columns = isset($atts['columns']) ? absint($atts['columns']) : 4;

        $order = in_array(strtolower($order), array('asc', 'desc')) ? $order : 'asc';

        $per_page = isset($atts['per_page']) ? intval($atts['per_page']) : -1;

        $current_page = isset($atts['current']) ? absint($atts['current']) : 1;

        $current_page = $current_page < 1 ? 1 : $current_page;

        $term_args = array(
            'taxonomy' => 'activity',
            'hide_empty' => false,
            'order' => $order,
        );

        $term_count = wp_count_terms($term_args);

        $total_page = $per_page < 1 ? 0 : ceil($term_count / $per_page);

        $current_page = $total_page < $current_page ? 1 : $current_page;

        if ($per_page > 0) {

            $term_args['number'] = $per_page;

        }

        $term_args['offset'] = ($current_page - 1) * $per_page;

        $activity_terms = get_terms($term_args);

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

        yatra_get_template('parts/pagination.php', [
            'total' => $total_page,
            'current' => $current_page,
            'base' => '',
            'format' => '',
            'class' => 'yatra-ajax-pagination',
            'attributes' => $atts,
            'type' => 'activity'
        ]);

        echo '</div>';

    }

}
