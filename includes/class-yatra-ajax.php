<?php
defined('ABSPATH') || exit;

class Yatra_Ajax
{


    private function admin_ajax_actions()
    {
        $actions = array(

            'change_tour_attribute',
            'import_content',
            'import_sample_data_on_setup',
            'tour_availability',
            'day_wise_tour_availability',
            'day_wise_tour_availability_save',
            'update_tour_featured_status'
        );

        return $actions;

    }

    private function public_ajax_actions()
    {
        $actions = array(
            'tour_add_to_cart',
            'update_cart',
            'tour_frontend_availability',
            'tour_frontend_availability_month',
            'tour_enquiry',
            'dismiss_admin_promo_notice'
        );
        return $actions;
    }

    private function validate_nonce($nonce_action = '', $nonce_value = '')
    {
        if (empty($nonce_action)) {
            $debug_backtrace = debug_backtrace();

            if (@isset($debug_backtrace[1]['function'])) {

                $nonce_action = 'wp_yatra_' . $debug_backtrace[1]['function'] . '_nonce';
            }
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
            if (in_array($action, $public_ajax_actions)) {
                add_action('wp_ajax_nopriv_yatra_' . $action, array($this, $action));
            }

        }


    }

    public function dismiss_admin_promo_notice()
    {

        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }
        $is_dismissed = isset($_POST['yatra_dismiss_admin_promo']) && (boolean)$_POST['yatra_dismiss_admin_promo'];

        if ($is_dismissed) {

            update_option('yatra_promo_notice_key', 'hide');

            wp_send_json_success();
        }
        wp_send_json_error();

    }

    public function update_tour_featured_status()
    {
        $tour_id = isset($_POST['tour_id']) ? absint($_POST['tour_id']) : 0;

        $nonce_action = 'yatra_tour_update_feature_status_' . $tour_id;

        $status = $this->validate_nonce($nonce_action);

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }
        $status = isset($_POST['featured_status']) && (boolean)$_POST['featured_status'];

        $updated_featured_status = $status ? 0 : 1;

        if (FALSE === get_post_status($tour_id)) {
            wp_send_json_error();
        }

        update_post_meta($tour_id, 'yatra_tour_meta_tour_featured', $updated_featured_status);

        wp_send_json_success($updated_featured_status);
    }

    public function tour_add_to_cart()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }

        $start_date = isset($_POST['yatra_tour_start_date']) ? sanitize_text_field($_POST['yatra_tour_start_date']) : '';

        if ($start_date == '') {

            wp_send_json_error('Please select proper date from above calendar');
        }

        $tour_id = isset($_POST['tour_id']) ? absint($_POST['tour_id']) : 0;

        $number_of_persons = isset($_POST['yatra_number_of_person']) ? ($_POST['yatra_number_of_person']) : array();

        if ($tour_id < 1 || (!is_array($number_of_persons))) {
            wp_send_json_error($this->ajax_error());
        }
        if (count($number_of_persons) < 1) {
            wp_send_json_error($this->ajax_error());
        }
        if (!isset($number_of_persons['single_pricing']) && !isset($number_of_persons['multi_pricing'])) {
            wp_send_json_error();
        }


        $type = 'single';

        if (isset($number_of_persons['single_pricing'])) {

            $number_of_persons = $number_of_persons['single_pricing'];

            $type = 'single';

        } else if (isset($number_of_persons['multi_pricing'])) {

            $number_of_persons = $number_of_persons['multi_pricing'];

            $type = 'multi';

        } else {
            $number_of_persons = 0;
        }

        $booking_validation = new Yatra_Tour_Availability_Validation($tour_id, $start_date, $number_of_persons);

        $isAvailabilityValid = $booking_validation->validate();

        if (!$isAvailabilityValid || yatra()->yatra_error->has_errors()) {

            if (yatra()->yatra_error->has_errors()) {

                wp_send_json_error(yatra()->yatra_error->get_error_messages());

            } else {
                wp_send_json_error("Something wrong, please try again");
            }
        }


        $tour = get_post($tour_id);

        if (!isset($tour->post_type) || $tour->post_type != 'tour') {

            wp_send_json_error($this->ajax_error());
        }

        $status = yatra()->cart->update_cart($tour_id, $number_of_persons, $type, $start_date);

        if ($status) {

            $return_data = array(

                'cart_page_url' => yatra_get_cart_page(true)
            );
            wp_send_json_success($return_data);
        }

        wp_send_json_error('Something wrong, please try again.');

    }

    public function update_cart()
    {

        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }

        $yatra_cart_submit_type = isset($_POST['yatra_cart_submit_type']) ? $_POST['yatra_cart_submit_type'] : 'update_cart';

        $yatra_cart_submit_type = in_array($yatra_cart_submit_type, array('apply_coupon', 'update_cart')) ? $yatra_cart_submit_type : 'update_cart';

        if ($yatra_cart_submit_type === "apply_coupon") {

            $coupon_code = isset($_POST['yatra_coupon_code']) ? sanitize_text_field($_POST['yatra_coupon_code']) : '';

            if ($coupon_code === '') {

                wp_send_json_error(__('Empty coupon code', 'yatra'));
            }

            $coupon = new Yatra_Core_Coupon($coupon_code);

            $status = $coupon->apply();

            if (!$status['status']) {

                wp_send_json_error($status['message']);
            }

            $message = __('Coupon Successfully applied', 'yatra');

        } else {
            $number_of_persons = isset($_POST['yatra_number_of_person']) ? $_POST['yatra_number_of_person'] : array();

            $yatra_tour_start_date = isset($_POST['yatra_tour_start_date']) ? $_POST['yatra_tour_start_date'] : array();

            foreach ($number_of_persons as $tour_id => $number_of_person) {

                $start_date = isset($yatra_tour_start_date[$tour_id]) ? sanitize_text_field($yatra_tour_start_date[$tour_id]) : '';

                $tour_id = absint($tour_id);

                if ($start_date === '') {

                    wp_send_json_error('Invalid Date');

                }

                if ($tour_id < 1) {
                    wp_send_json_error('Invalid Tour ID');

                }


                $type = 'single';

                if (isset($number_of_person['single_pricing'])) {

                    $number_of_person = $number_of_person['single_pricing'];

                    $type = 'single';

                } else if (isset($number_of_person['multi_pricing'])) {

                    $number_of_person = $number_of_person['multi_pricing'];

                    $type = 'multi';

                } else {
                    $number_of_person = 0;
                }

                $booking_validation = new Yatra_Tour_Availability_Validation($tour_id, $start_date, $number_of_person);

                $isAvailabilityValid = $booking_validation->validate();

                if (!$isAvailabilityValid || yatra()->yatra_error->has_errors()) {

                    if (yatra()->yatra_error->has_errors()) {

                        wp_send_json_error(yatra()->yatra_error->get_error_messages());

                    } else {
                        wp_send_json_error("Something wrong, please try again");
                    }
                }

                $tour = get_post($tour_id);

                if (!isset($tour->post_type) || $tour->post_type != 'tour') {

                    wp_send_json_error("Invalid tour type");
                }

                if (!yatra()->cart->is_valid_tour_id_on_cart($tour_id)) {

                    wp_send_json_error("Invalid Tour ID on cart");
                }

                $status = yatra()->cart->update_cart($tour_id, $number_of_person, $type, $start_date);

            }
            $message = __('Cart Successfully updated', 'yatra');
        }
        $cart_table = yatra()->cart->get_cart_table(true);

        wp_send_json_success(array('message' => $message, 'table' => $cart_table));
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


    public function import_content()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }


        $target_dir = yatra()->get_upload_dir();

        $import_file = isset($_FILES['yatra_import_file']) ? $_FILES['yatra_import_file'] : array();

        if (!isset($import_file['name'])) {
            wp_send_json_error();
        }

        $target_file = $target_dir . basename($import_file["name"]);

        $temp_name = $import_file["tmp_name"];

        $file_type = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

        $yatra_allowed_file_type = $import_file["type"];

        if ($file_type != "json" || $yatra_allowed_file_type != "application/json") {
            wp_send_json_error(__('Invalid file type. Please use vaild json file.', 'yatra'));

        }

        if (!move_uploaded_file($temp_name, $target_file)) {

            wp_send_json_error(__('File upload failed. Please try again.', 'yatra'));
        }

        $status = yatra()->importer->import($target_file);

        unlink($target_file);

        if ($status) {
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }

    }

    public function import_sample_data_on_setup()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }

        if (get_option('yatra_setup_wizard_importer_already_ran', '') == '1') {
            wp_send_json_error();
        }
        $sample_data_file_path = YATRA_ABSPATH . 'sample-data/sample-data.json';

        $status = yatra()->importer->import($sample_data_file_path);

        if ($status) {
            update_option('yatra_setup_wizard_importer_already_ran', 1);
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }

    }

    public function tour_availability()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }

        $start_date = isset($_POST['start']) ? sanitize_text_field($_POST['start']) : '';

        $end_date = isset($_POST['end']) ? sanitize_text_field($_POST['end']) : '';

        $tour_id = isset($_POST['tour_id']) ? absint($_POST['tour_id']) : 0;

        if ($tour_id < 1) {
            wp_send_json_error();

        }

        $availability = Yatra_Core_Tour_Availability::get_availability($tour_id, $start_date, $end_date);

        if (!is_wp_error($availability)) {
            echo json_encode($availability);
        }
        exit;


    }

    public function day_wise_tour_availability()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }

        $tour_id = isset($_POST['tour_id']) ? absint($_POST['tour_id']) : 0;

        $start_date = isset($_POST['start_date']) ? sanitize_text_field($_POST['start_date']) : '';

        $end_date = isset($_POST['end_date']) ? sanitize_text_field($_POST['end_date']) : '';


        $content_only = isset($_POST['content_only']) ? (boolean)($_POST['content_only']) : false;

        if ($tour_id < 1 || $start_date == '' || $end_date == '') {

            wp_send_json_error();

        }

        Yatra_Core_Tour_Availability::get_day_wise_availability_form($tour_id, $start_date, $end_date, $content_only);

        exit;

    }

    public function day_wise_tour_availability_save()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }


        $date_ranges = isset($_POST['yatra_availability_selected_date_ranges']) ? $_POST['yatra_availability_selected_date_ranges'] : "";

        $date_ranges = (yatra_maybe_json_decode(stripslashes($date_ranges), true));

        $start_date = isset($date_ranges['start']) ? $date_ranges['start'] : '';

        $end_date = isset($date_ranges['end']) ? $date_ranges['end'] : $start_date;

        $yatra_availability = isset($_POST['yatra_availability']) ? $_POST['yatra_availability'] : array();

        $tour_id = isset($_POST['yatra_tour_id']) ? absint($_POST['yatra_tour_id']) : 0;

        if ($tour_id < 1) {
            wp_send_json_error();

        }

        $yatra_pricing = isset($_POST['yatra_availability_pricing']) ? $_POST['yatra_availability_pricing'] : array();


        $status = Yatra_Core_Tour_Availability::update_availability(
            $start_date, $end_date, $yatra_availability, $yatra_pricing, $tour_id
        );

        wp_send_json_success(
            $status
        );

    }

    public function tour_frontend_availability()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }
        $tour_id = isset($_POST['tour_id']) ? absint($_POST['tour_id']) : 0;

        $selected_date = isset($_POST['selected_date']) ? sanitize_text_field($_POST['selected_date']) : '';

        if ($tour_id < 1 || '' === $selected_date) {
            wp_send_json_error();

        }

        $yatra_tour_options = new Yatra_Tour_Options($tour_id, $selected_date, $selected_date);

        $todayDataSettings = $yatra_tour_options->getTodayData($selected_date);

        if ($todayDataSettings instanceof Yatra_Tour_Dates) {

            $todayData = (boolean)$todayDataSettings->isActive() ? $todayDataSettings : $yatra_tour_options->getTourData();

        } else {

            $todayData = $yatra_tour_options->getTourData();
        }


        $pricing_type = $todayData->getPricingType();

        ob_start();

        Yatra_Template_Hooks::tour_booking_pricing_content($todayData, $pricing_type, $tour_id, $selected_date);

        $content = ob_get_clean();

        wp_send_json_success($content);
    }

    public function tour_frontend_availability_month()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }
        $tour_id = isset($_POST['tour_id']) ? absint($_POST['tour_id']) : 0;

        $selected_date = isset($_POST['selected_date']) ? sanitize_text_field($_POST['selected_date']) : '';

        $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : 'calendar';

        $listing_type = get_option('yatra_date_selection_type', 'calendar');

        if ($type === 'date_listing' && $listing_type === $type) {

            ob_start();

            yatra_get_calendar_date_listing($selected_date, $tour_id);

            $content = ob_get_clean();
            
            wp_send_json_success(array('content' => $content));

            exit;
        }

        $selected_date = new DateTime($selected_date);

        $month = $selected_date->format('m');

        $year = $selected_date->format('Y');

        $date_range = yatra_get_current_month_start_and_end_date($year, $month);

        $yatra_available_date_data = Yatra_Core_Tour_Availability::get_availability($tour_id, $date_range['start'], $date_range['end'], array(
            'is_expired' => false,
            'is_full' => false
        ), true);

        $enabled_date = array_keys($yatra_available_date_data);


        if ($tour_id < 1 || '' === $selected_date) {
            wp_send_json_error();

        }
        wp_send_json_success(array('enable_dates' => $enabled_date, 'available_data' => $yatra_available_date_data));
    }

    public function tour_enquiry()
    {
        $status = $this->validate_nonce();

        if (!$status) {
            wp_send_json_error($this->ajax_error());
        }

        $selected_date = isset($_POST['selected_date']) ? sanitize_text_field($_POST['selected_date']) : '';

        $show_enquiry_form = get_option('yatra_enquiry_form_show', 'yes');

        if ($show_enquiry_form != 'yes') {

            if ($selected_date === '') {

                wp_send_json_error(__('Enquiry form is disabled by admin.', 'yatra'));

            } else {

                $tour_id = $_POST['tour_id'] ? absint($_POST['tour_id']) : 0;

                if ($tour_id > 0) {

                    $yatra_tour_options = new Yatra_Tour_Options($tour_id, $selected_date, $selected_date);

                    $tourData = $yatra_tour_options->getTodayData($selected_date);

                    if ($tourData->getAvailabilityFor($tour_id, $selected_date) !== 'enquiry') {

                        wp_send_json_error(__('Error::Enquiry form is disabled by admin.', 'yatra'));

                    }
                }

            }
        }
        if (!yatra_privacy_policy_pass('yatra_enquiry_form_show_agree_to_privacy_policy')) {

            wp_send_json_error(__('You must have to agree privacy policy.', 'yatra'));
        }
        if (!yatra_terms_and_conditions_pass('yatra_enquiry_form_show_agree_to_terms_policy')) {

            wp_send_json_error(__('You must have to agree terms and conditions.', 'yatra'));

        }
        $status = Yatra_Enquiry_Form::get_instance()->save_enquiry($_POST);

        if (yatra()->yatra_error->has_errors()) {
            wp_send_json_error(yatra()->yatra_error->get_error_messages());

        }
        if (!$status) {
            wp_send_json_error(__('Something wrong, please try again.', 'yatra'));
        }
        wp_send_json_success(__(
            'Thank you for your query. We will get back to you soon'
            , 'yatra'));
    }


}

new Yatra_Ajax();
