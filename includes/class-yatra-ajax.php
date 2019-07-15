<?php
defined('ABSPATH') || exit;

class Yatra_Ajax
{

    private function admin_ajax_actions()
    {
        $actions = array(

            'change_tour_attribute'
        );

        return $actions;

    }

    private function public_ajax_actions()
    {
        $actions = array(
            'select_tour',
            'book_selected_tour',
            'update_cart'
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

    public function book_selected_tour()
    {
        $status = $this->validate_nonce();
        if (!$status) {
            wp_safe_redirect(yatra_get_checkout_page(true));
        }
        $yatra_booking = new Yatra_Tour_Booking();

        $status = $yatra_booking->book($_POST);
        if ($status) {
            $success_redirect_page_id = get_option('yatra_thankyou_page');
            yatra_clear_session('yatra_tour_cart');
            $page_permalink = get_permalink($success_redirect_page_id);

            wp_safe_redirect($page_permalink);
        }
        die('Could not booked, please try again');
    }

    public function select_tour()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }
        $tour_id = isset($_POST['tour_id']) ? absint($_POST['tour_id']) : 0;

        $number_of_person = isset($_POST['number_of_person']) ? absint($_POST['number_of_person']) : 0;

        if ($tour_id < 1 || $number_of_person < 1) {
            wp_send_json_error($this->ajax_error());
        }

        $tour = get_post($tour_id);

        if (!isset($tour->post_type) || $tour->post_type != 'tour') {
            wp_send_json_error($this->ajax_error());
        }
        $status = yatra_instance()->cart->update_cart($tour_id, $number_of_person);

        if ($status) {

            $return_data = array(

                'cart_page_url' => yatra_get_cart_page(true)
            );
            wp_send_json_success($return_data);
        }

        wp_send_json_error();

    }

    public function change_tour_attribute()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }
        $attribute_type = isset($_POST['attribute_type']) ? sanitize_text_field($_POST['attribute_type']) : '';

        $is_edit = isset($_POST['is_edit']) ? (boolean)($_POST['is_edit']) : false;


        $attribute_parser = new Yatra_Tour_Attribute_Parser($attribute_type);

        $parsed_html = $attribute_parser->parse(true, $is_edit);

        if (empty($attribute_type) || !$parsed_html) {
            wp_send_json_error($this->ajax_error());
        }

        wp_send_json_success($parsed_html);


    }

    public function update_cart()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }

        $number_of_persons = isset($_POST['number_of_person']) ? $_POST['number_of_person'] : array();


        foreach ($number_of_persons as $tour_id => $number_of_person) {

            $tour_id = absint($tour_id);

            $number_of_person = absint($number_of_person);

            if ($tour_id > 0 && yatra_instance()->cart->is_valid_tour_id_on_cart($tour_id)) {

                yatra_instance()->cart->update_cart($tour_id, $number_of_person);

            }

        }

        $cart_table = yatra_instance()->cart->get_cart_table(true);

        wp_send_json_success($cart_table);

    }


}

new Yatra_Ajax();