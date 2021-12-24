<?php

class Yatra_List_Table_Hooks
{
    public function __construct()
    {
        add_filter('manage_edit-tour_columns', array($this, 'add_new_columns'));
        add_action('manage_tour_posts_custom_column', array($this, 'custom_columns'), 15, 2);

    }


    function add_new_columns($columns)
    {

        unset($columns['taxonomy-attributes']);
        unset($columns['date']);

        $columns['attributes'] = __('Attributes', 'yatra');
        $columns['bookings'] = __('Total Booking', 'yatra');
        $columns['featured'] = __('Featured', 'yatra');
        $columns['date'] = __('Date', 'yatra');

        return $columns;

    }

    function custom_columns($column, $a)
    {
        global $post;

        $post_id = $post->ID;

        switch ($column) {
            case "attributes":
                $this->attributes($post_id);
                break;
            case "bookings":
                $this->bookings($post_id);
                break;
            case "featured":
                $this->featured($post_id);
                break;
        }


    }

    public function attributes($post_id)
    {
        $tour_meta_custom_attributes = get_post_meta($post_id, 'tour_meta_custom_attributes', true);

        if (!is_array($tour_meta_custom_attributes)) {

            $tour_meta_custom_attributes = array();
        }

        foreach ($tour_meta_custom_attributes as $term_id => $content) {

            $term = get_term($term_id, 'attributes');

            $term_content = $term->name;

            if (isset($content['content'])) {
                $term_content .= " : <strong>" . esc_html($content['content']) . '</strong>';
            } else if ($content['shortcode']) {

                $term_content .= " : <strong>" . esc_html($content['shortcode']) . '</strong>';
            }
            echo $term_content . '<br/>';
        }
    }

    public function bookings($tour_id)
    {
        $booking_count = Yatra_Core_DB::get_count(Yatra_Tables::TOUR_BOOKING_STATS, array(
            'tour_id' => absint($tour_id)
        ));
        echo '<span>' . absint($booking_count) . '</span>';

    }

    public function featured($tour_id)
    {
        $is_featured = (boolean)get_post_meta($tour_id, 'yatra_tour_meta_tour_featured', true);
        $star_class = $is_featured ? 'star-filled' : 'star-empty';
        ?>
        <span class="yatra-featured-tour dashicons dashicons-<?php echo esc_attr($star_class) ?>"></span>
        <?php
    }
}

new Yatra_List_Table_Hooks();
