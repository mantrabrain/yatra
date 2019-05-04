<?php
defined('ABSPATH') || exit;

class Yatra_Ajax
{

    private function admin_ajax_actions()
    {
        $actions = array();

        return $actions;

    }

    private function public_ajax_actions()
    {
        $actions = array(

            'book_tour'
        );
        return $actions;
    }

    private function validate_nonce($nonce_action = '', $nonce_value = '')
    {
        $debug_backtrace = debug_backtrace();
        if (@isset($debug_backtrace[1]['function'])) {

            $nonce_action = 'wp_yatra_' . $debug_backtrace[1]['function'] . '_nonce';
        }
        if (empty($nonce_value)) {
            $nonce_value = isset($_REQUEST['yatra_nonce']) ? $_REQUEST['yatra_nonce'] : '';
        }

        return wp_verify_nonce($nonce_value, $nonce_action);

    }

    private function ajax_error()
    {
        return array('message' => __('Something wrong, please try again.', 'yatra'), 'status' => false);
    }

    public function __construct()
    {
        $admin_actions = $this->admin_ajax_actions();
        $public_ajax_actions = $this->public_ajax_actions();
        $all_ajax_actions = array_unique(array_merge($admin_actions, $public_ajax_actions));

        foreach ($all_ajax_actions as $action) {
            add_action('wp_ajax_yatra_' . $action, array($this, $action));
            if (isset($public_ajax_actions[$action])) {
                add_action('wp_ajax_nopriv_yatra_' . $action, array($this, $action));
            }


        }


    }

    public function book_tour()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }
        $tour_id = isset($_POST['tour_id']) ? absint($_POST['tour_id']) : 0;
        if ($tour_id < 1) {
            wp_send_json_error($this->ajax_error());
        }

        $tour = get_post($tour_id);
        if (!isset($tour->post_type) || $tour->post_type != 'tour') {
            wp_send_json_error($this->ajax_error());
        }
        $status = yatra_set_session('tour_cart', $tour);

        if ($status) {

            global $wpdb;

            $pageID = $wpdb->get_var('SELECT ID FROM ' . $wpdb->prefix . 'posts WHERE post_content LIKE "%[yatra_checkout]%" AND post_parent = 0');

            $redirect_url = get_permalink($pageID);

            $return_data = array(

                'redirect_url' => $redirect_url
            );
            wp_send_json_success($return_data);
        }

        wp_send_json_error();

    }


}

new Yatra_Ajax();