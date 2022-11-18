<?php

namespace Yatra\Core\Hooks;
class TourHooks
{

    public static function init()
    {
        $self = new self;

        add_action('the_post', 'yatra_setup_tour_data');

        add_action('yatra_after_tour_update', array($self, 'after_tour_update'));

        add_filter('post_updated_messages', array($self, 'updated_messages'));

    }

    public function after_tour_update($tour_id)
    {
        $tour_type = isset($_POST['yatra_tour_meta_tour_type']) ? sanitize_text_field($_POST['yatra_tour_meta_tour_type']) : 'regular';

        $all_tour_type = yatra_get_tour_types();

        $tour_type = isset($all_tour_type[$tour_type]) ? $tour_type : 'regular';

        $disable_booking = isset($_POST['yatra_tour_meta_disable_booking']) && (boolean)$_POST['yatra_tour_meta_disable_booking'];

        update_post_meta($tour_id, 'yatra_tour_meta_tour_type', $tour_type);

        update_post_meta($tour_id, 'yatra_tour_meta_disable_booking', $disable_booking);

    }

    public function updated_messages($messages)
    {
        global $post, $post_ID;

        $messages['tour'] = array(
            0 => '', // Unused. Messages start at index 1.
            1 => sprintf(__('Tour updated. <a href="%s">View tour</a>', 'yatra'), esc_url(get_permalink($post_ID))),
            2 => __('Custom field updated.', 'yatra'),
            3 => __('Custom field deleted.', 'yatra'),
            4 => __('Tour updated.', 'yatra'),
            /* translators: %s: date and time of the revision */
            5 => isset($_GET['revision']) ? sprintf(__('Tour restored to revision from %s', 'yatra'), wp_post_revision_title((int)$_GET['revision'], false)) : false,
            6 => sprintf(__('Book published. <a href="%s">View book</a>', 'yatra'), esc_url(get_permalink($post_ID))),
            7 => __('Tour saved.', 'yatra'),
            8 => sprintf(__('Tour submitted. <a target="_blank" href="%s">Preview tour</a>', 'yatra'), esc_url(add_query_arg('preview', 'true', get_permalink($post_ID)))),
            9 => sprintf(__('Tour scheduled for: <strong>%1$s</strong>. <a target="_blank" href="%2$s">Preview tour</a>', 'yatra'),
                // translators: Publish box date format, see http://php.net/date
                date_i18n('M j, Y @ G:i', strtotime($post->post_date)), esc_url(get_permalink($post_ID))),
            10 => sprintf(__('Tour draft updated. <a target="_blank" href="%s">Preview tour</a>', 'yatra'), esc_url(add_query_arg('preview', 'true', get_permalink($post_ID)))),
        );

        return $messages;

    }
}