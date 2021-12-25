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

        $pricing_tooltip = '<span class="yatra-tippy-tooltip dashicons dashicons-editor-help" data-tippy-content="' . esc_attr__('Pricing might be different as per selected date on booking.', 'yatra') . '"></span>';
        $columns['attributes'] = __('Attributes', 'yatra');
        $columns['price'] = sprintf(__('Price %s', 'yatra'), $pricing_tooltip);
        $columns['bookings'] = __('Total Booking', 'yatra');
        $columns['featured'] = __('Featured', 'yatra');
       // $columns['earning'] = __('Earning', 'yatra');
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
            case "price":
                $this->price($post_id);
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

        $nonce = wp_create_nonce('yatra_tour_update_feature_status_' . $tour_id);

        $featured_status = $is_featured ? 1 : 0;

        ?>
        <span class="yatra-featured-tour yatra-update-feature-tour-icon dashicons dashicons-<?php echo esc_attr($star_class) ?>"
              data-tour-id="<?php echo absint($tour_id); ?>"
              data-tour-nonce="<?php echo esc_attr($nonce); ?>"
              data-is-featured="<?php echo absint($featured_status) ?>"
        ></span>
        <?php
    }

    public function price($tour_id)
    {
        $tour_options = new Yatra_Tour_Options($tour_id);


        $tour_data = $tour_options->getTourData();

        $pricing = $tour_data->getPricing();

        if ($pricing instanceof Yatra_Tour_Pricing) {

            $regular_price = $pricing->getRegularPrice();

            $sales_price = $pricing->getSalesPrice();

            $final_price = $sales_price === '' ? $regular_price : $sales_price;

            echo '<span>';

            echo esc_html(yatra_get_price(yatra_get_current_currency_symbol(), $final_price));

            echo '</span>';

        } else {

            $min_price = yatra_get_minimum_tour_price($pricing);

            $max_price = yatra_get_maximum_tour_price($pricing);

            echo '<span>';

            echo esc_html(yatra_get_price(yatra_get_current_currency_symbol(), $min_price));

            echo ' &nbsp;– &nbsp;';

            echo esc_html(yatra_get_price(yatra_get_current_currency_symbol(), $max_price));

            echo '</span>';

        }
    }
}

new Yatra_List_Table_Hooks();
