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

        $posts_per_page = isset($atts['posts_per_page']) ? absint($atts['posts_per_page']) : 9;

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
            'posts_per_page' => $posts_per_page
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
    function yatra_booking_pricing_details($tour_id = null)
    {
        global $post;

        if (is_null($tour_id)) {
            $tour_id = isset($post->ID) ? $post->ID : '';
        }
        if ($tour_id == '' || is_null($tour_id)) {
            return array();
        }
        $yatra_tour_meta_regular_price = get_post_meta($tour_id, 'yatra_tour_meta_regular_price', true);
        $yatra_tour_meta_sales_price = get_post_meta($tour_id, 'yatra_tour_meta_sales_price', true);
        $yatra_multiple_pricing = get_post_meta($tour_id, 'yatra_multiple_pricing', true);
        $yatra_tour_meta_price_per = get_post_meta($tour_id, 'yatra_tour_meta_price_per', true);
        $yatra_tour_meta_group_size = get_post_meta($tour_id, 'yatra_tour_meta_group_size', true);
        $pricing_details = array();
        if (is_array($yatra_multiple_pricing)) {
            if (count($yatra_multiple_pricing) > 0) {
                foreach ($yatra_multiple_pricing as $pricing_id => $pricing) {
                    $sales_price = $pricing['sales_price'];
                    $regular_price = $pricing['regular_price'];
                    $pricing_details[$pricing_id] = array(
                        'name' => 'yatra_number_of_person[multi_pricing][' . $pricing_id . ']',
                        'pricing_label' => $pricing['pricing_label'],
                        'pricing_description' => $pricing['pricing_description'],
                        'minimum_pax' => $pricing['minimum_pax'],
                        'maximum_pax' => $pricing['maximum_pax'],
                        'pricing_per' => $pricing['price_per'] === '' ? $yatra_tour_meta_price_per : $pricing['price_per'],
                        'group_size' => $pricing['price_per'] === '' ? $yatra_tour_meta_group_size : $pricing['group_size'],
                        'regular_price' => $regular_price,
                        'sales_price' => $sales_price,
                        
                    );
                }
                return $pricing_details;
            }
        }
        $regular_price = $yatra_tour_meta_regular_price;
        $sales_price = $yatra_tour_meta_sales_price;
        $pricing_details[] = array(
            'name' => 'yatra_number_of_person[single_pricing]',
            'pricing_label' => 'Person',
            'regular_price' => $regular_price,
            'sales_price' => $sales_price,
            'pricing_per' => $yatra_tour_meta_price_per,
            'group_size' => $yatra_tour_meta_group_size,
        );
        return $pricing_details;

    }
}
if (!function_exists('yatra_cart_pricing_details')) {
    function yatra_cart_pricing_details($tour_id, $cart_items)
    {
        $booking_pricing_details = yatra_booking_pricing_details($tour_id);

        $updated_booking_details = array();

        $pricing_type = isset($cart_items['pricing_type']) ? $cart_items['pricing_type'] : 'single';
        $number_of_person = isset($cart_items['number_of_person']) ? $cart_items['number_of_person'] : '';

        switch ($pricing_type) {
            case "multi":
                foreach ($booking_pricing_details as $pricing_id => $pricing_detail) {
                    $updated_booking_details[$pricing_id] = $pricing_detail;
                    $price_per = isset($pricing_detail['pricing_per']) ? $pricing_detail['pricing_per'] : 'single';
                    $group_size = isset($pricing_detail['group_size']) ? $pricing_detail['group_size'] : 1;
                    $person_count = is_array($number_of_person) && isset($number_of_person[$pricing_id]) ? (absint($number_of_person[$pricing_id])) : 0;
                    $updated_booking_details[$pricing_id]['number_of_person'] = $person_count;
                    $person_count = $price_per == 'person' ? $person_count : ceil($person_count / $group_size);
                    $regular_price = isset($pricing_detail['regular_price']) ? absint($pricing_detail['regular_price']) : 0;
                    $sales_price = isset($pricing_detail['sales_price']) ? absint($pricing_detail['sales_price']) : 0;
                    $sales_price = isset($pricing_detail['sales_price']) && '' != $pricing_detail['sales_price'] ? $sales_price : $regular_price;
                    $updated_booking_details[$pricing_id]['total'] = ($sales_price * $person_count);
                    $updated_booking_details[$pricing_id]['name'] = 'yatra_number_of_person[' . $tour_id . '][multi_pricing][' . $pricing_id . ']';
                }
                break;
            case "single":
                $sales_price = isset($booking_pricing_details[0]['sales_price']) && '' != $booking_pricing_details[0]['sales_price'] ? absint($booking_pricing_details[0]['sales_price']) : absint($booking_pricing_details[0]['regular_price']);
                $price_per = isset($booking_pricing_details[0]['pricing_per']) ? $booking_pricing_details[0]['pricing_per'] : 'single';
                $group_size = isset($booking_pricing_details[0]['group_size']) ? absint($booking_pricing_details[0]['group_size']) : 1;
                $person_count = !is_array($number_of_person) ? (absint($number_of_person)) : 0;
                $booking_pricing_details[0]['number_of_person'] = $person_count;
                $person_count = $price_per == 'person' ? $person_count : ceil($person_count / $group_size);
                $booking_pricing_details[0]['total'] = $person_count * $sales_price;
                $booking_pricing_details[0]['name'] = 'yatra_number_of_person[' . $tour_id . '][single_pricing]';
                $updated_booking_details = $booking_pricing_details;


                break;
        }
        return $updated_booking_details;


    }
}

function yatra_export($args = array())
{
    $defaults = array(

        'content' => array(),

    );

    $args = wp_parse_args($args, $defaults);

    do_action('export_yatra', $args);

    $sitename = strtolower(sanitize_key(get_bloginfo('name')));

    if (!empty($sitename)) {

        $sitename .= '.';
    }

    $content = $args['content'];

    $content = is_string($content) ? $content : json_encode($content);

    $date = gmdate('Y-m-d');

    $wp_filename = $sitename . 'yatra.' . $date . '.json';

    $filename = apply_filters('export_wp_filename', $wp_filename, $sitename, $date);

    header('Content-Description: File Transfer');

    header('Content-Disposition: attachment; filename=' . $filename);

    header('Content-Type: text/json; charset=' . get_option('blog_charset'), true);

    echo $content;

    exit;

}
