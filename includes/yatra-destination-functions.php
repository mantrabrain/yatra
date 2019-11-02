<?php

if (!function_exists('yatra_get_destination_lists')) {
    function yatra_get_destination_lists($atts = array())
    {
        $order = isset($atts['order']) ? sanitize_text_field($atts['order']) : 'ASC';

        $order = in_array(strtolower($order), array('asc', 'desc')) ? $order : 'asc';

        $destination_terms = get_terms(array(
            'taxonomy' => 'destination',
            'hide_empty' => false,
            'order' => $order,

        ));
        echo '<div class="yatra-destination-wrap yatra-col-4">';

        foreach ($destination_terms as $term) {

            $data['data'] = array(
                'id' => $term->term_id,
                'name' => $term->name,
                'slug' => $term->slug,
                'count' => $term->count,
                'permalink' => get_term_link($term->term_id),
                'image' => ''
            );

            $attachment_id = (int)get_term_meta($term->term_id, 'destination_image_id', true);

            if ($attachment_id > 0) {

                $data['data']['image'] = wp_get_attachment_url($attachment_id);
            }

            yatra_get_template('destination/item.php', $data);

        }
        echo '</div>';

    }

}
