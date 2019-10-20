<?php
if (!function_exists('yatra_get_discount_deals_lists')) {

    function yatra_get_discount_deals_lists($atts = array())
    {

        $args = array(
            'meta_query' => array(
                array(
                    'key' => 'yatra_tour_meta_sales_price',
                    'value' => array(''),
                    'compare' => 'NOT IN'
                )
            ),
            'post_type' => 'tour',
            'posts_per_page' => 6
        );
        $posts = get_posts($args);
        echo '<pre>';
        print_r($posts);
        echo '</pre>';
        exit;

        echo '<div class="yatra-discount-deails-wrap yatra-col-3">';

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
