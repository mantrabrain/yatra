<?php
if (!function_exists('yatra_get_discount_deals_lists')) {

    function yatra_get_discount_deals_lists($atts = array())
    {
        $order = isset($atts['order']) ? sanitize_text_field($atts['order']) : 'DESC';
        $order = in_array(strtolower($order), array('asc', 'desc')) ? $order : 'desc';
        $args = array(
            'meta_query' => array(
                array(
                    'key' => 'yatra_tour_meta_sales_price',
                    'value' => array('', 0, '0'),
                    'compare' => 'NOT IN'
                )
            ),
            'post_type' => 'tour',
            'order' => $order,
            'posts_per_page' => 9
        );
        $posts = get_posts($args);

        echo '<div class="yatra-discount-deals-wrap yatra-col-3">';

        foreach ($posts as $item) {

            $data['data'] = array(
                'id' => $item->ID,
                'title' => $item->post_title,
                'excerpt' => $item->post_excerpt,
                'permalink' => get_permalink($item->ID),
                'image' => ''
            );

            $attachment_id = (int)get_post_thumbnail_id($item);

            if (($attachment_id) > 0) {

                $attachment_link = wp_get_attachment_image_url($attachment_id, 'full');

                $data['data']['image'] = $attachment_link;
            }

            yatra_get_template('tmpl-deals-item.php', $data);

        }
        echo '</div>';

    }

}

if (!function_exists('yatra_get_tour_lists')) {

    function yatra_get_tour_lists($atts = array())
    {
        $order = isset($atts['order']) ? sanitize_text_field($atts['order']) : 'DESC';

        $order = in_array(strtolower($order), array('asc', 'desc')) ? $order : 'desc';

        $featured = isset($atts['featured']) ? absint($atts['featured']) : 2;

        $meta_query = array();


        switch ($featured) {

            case 0:
                $meta_query[] =

                    array(
                        'relation' => 'OR',
                        array(
                            'key' => 'yatra_tour_meta_tour_featured',
                            'value' => array(1, '1'),
                            'compare' => 'NOT IN'
                        ),
                        array(
                            'key' => 'yatra_tour_meta_tour_featured',
                            'compare' => 'NOT EXISTS',
                            'value' => 'null',
                        )
                    );
                break;

            case 1:
                $meta_query[] =
                    array(
                        'key' => 'yatra_tour_meta_tour_featured',
                        'value' => array(1, '1'),
                        'compare' => 'IN'

                    );
                break;
        }

        $args = array(
            'post_type' => 'tour',
            'order' => $order,
            'posts_per_page' => 9
        );

        if (count($meta_query) > 0) {
            $args['meta_query'] = $meta_query;
        }

        $posts = get_posts($args);

        echo '<div class="yatra-tour-list-wrap yatra-col-3">';

        foreach ($posts as $item) {

            $data['data'] = array(
                'id' => $item->ID,
                'title' => $item->post_title,
                'excerpt' => $item->post_excerpt,
                'permalink' => get_permalink($item->ID),
                'image' => ''
            );

            $attachment_id = (int)get_post_thumbnail_id($item);

            if (($attachment_id) > 0) {

                $attachment_link = wp_get_attachment_image_url($attachment_id, 'full');

                $data['data']['image'] = $attachment_link;
            }

            yatra_get_template('tmpl-tour-item.php', $data);

        }
        echo '</div>';

    }

}
if (!function_exists('yatra_booking_pricing_details')) {
    function yatra_booking_pricing_details()
    {
        global $post;

        $tour_id = isset($post->ID) ? $post->ID : '';

        if ($tour_id == '') {
            return array();
        }
        $yatra_tour_meta_regular_price = get_post_meta($tour_id, 'yatra_tour_meta_regular_price', true);
        $yatra_tour_meta_sales_price = get_post_meta($tour_id, 'yatra_tour_meta_sales_price', true);
        $yatra_multiple_pricing = get_post_meta($tour_id, 'yatra_multiple_pricing', true);
        $yatra_tour_meta_price_per = get_post_meta($tour_id, 'yatra_tour_meta_price_per', true);
        $yatra_tour_meta_group_size = get_post_meta($tour_id, 'yatra_tour_meta_group_size', true);
        $current_currency_symbol = yatra_get_current_currency_symbol();
        $pricing_details = array();
        if (is_array($yatra_multiple_pricing)) {
            if (count($yatra_multiple_pricing) > 0) {
                foreach ($yatra_multiple_pricing as $pricing_id => $pricing) {
                    $pricing_details[] = array(
                        'name' => 'yatra_number_of_person[multi_pricing][' . $pricing_id . ']',
                        'pricing_label' => $pricing['pricing_label'],
                        'regular_price' => $current_currency_symbol . ' ' . $pricing['regular_price'],
                        'sales_price' => $current_currency_symbol . ' ' . $pricing['sales_price'],
                        'pricing_per' => $yatra_tour_meta_price_per,
                        'group_size' => $yatra_tour_meta_group_size,
                    );
                }
                return $pricing_details;
            }
        }
        $pricing_details[] = array(
            'name' => 'yatra_number_of_person[single_pricing]',
            'pricing_label' => 'Person',
            'regular_price' => $current_currency_symbol . ' ' . $yatra_tour_meta_regular_price,
            'sales_price' => $current_currency_symbol . ' ' . $yatra_tour_meta_sales_price,
            'pricing_per' => $yatra_tour_meta_price_per,
            'group_size' => $yatra_tour_meta_group_size,
        );
        return $pricing_details;

    }
}