<?php
defined('ABSPATH') || exit;

use Yatra\Core\Admin\Emails\AdminEmail;
use Yatra\Core\Admin\Emails\CustomerEmail;

if (!class_exists('Yatra_Email')) {

    class Yatra_Email
    {
        public function load_helper()
        {
            include_once YATRA_ABSPATH . 'includes/helpers/email-helper.php';
        }

        public function is_email_enabled()
        {
            $this->load_helper();

            return 'yes' != get_option('yatra_disable_all_email', 'no');

        }

        public function __construct()
        {

            if (!$this->is_email_enabled()) {
                return;
            }

            // Before Email & After Email Hooks
            add_action('yatra_email_send_before', array($this, 'yatra_send_email_before'));
            add_action('yatra_email_send_after', array($this, 'yatra_send_email_after'));

            // End of Before Email & After Email Hooks


            // Booking Complete Email Hook

            add_action('yatra_after_tour_booking_completed', array($this, 'booking_completed_email'), 10);

            // Booking Status Change Hook
            add_action('yatra_after_booking_status_change', array($this, 'booking_status_change'), 10);

            // after enquiry saved
            add_action('yatra_enquiry_response_after_saved', array($this, 'enquiry_mail'), 10, 2);

            // Testing Hook - Please delete after testing finished
            //add_action('init', array($this, 'init'), 10);
            //add_action('init', array($this, 'booking_status_change'), 10);
        }

        public function init()
        {
            $this->booking_completed_email(array(

                'tour_ids' => [30, 34],

                'booking_id' => 49,


            ));
        }

        public function booking_completed_email($params = array())
        {
            if (!$this->is_email_enabled()) {
                return;
            }

            $tour_ids = $params['tour_ids'] ?? array();

            $booking_id = $params['booking_id'] ?? 0;

            if ($booking_id < 1 || count($tour_ids) < 1) {

                return;
            }

            $customer_detail = $this->get_customer_details($booking_id);

            $customer_email = $customer_detail['email'] ?? '';

            // end of User Parameters

            $yatra_all_smart_tags = yatra_all_smart_tags($booking_id);

            if (!empty($customer_email) && yatra_is_enable_email_notification("booking", "customer")) {

                $user_message = CustomerEmail::get_booking_completed_message();

                $user_subject = CustomerEmail::get_booking_completed_subject();

                $this->send(array($customer_email), $user_subject, $user_message, $yatra_all_smart_tags, array());
            }

            if (yatra_is_enable_email_notification("booking", "admin")) {

                $admin_message = AdminEmail::get_booking_completed_message();

                $admin_subject = AdminEmail::get_booking_completed_subject();

                $admin_emails = $this->get_admin_emails();

                $this->send($admin_emails, $admin_subject, $admin_message, $yatra_all_smart_tags, array(), true);

            }
        }

        public function booking_status_change($params)
        {
            if (!$this->is_email_enabled()) {
                return;
            }

            $booking_id = isset($params['booking_id']) ? $params['booking_id'] : 0;

            $status = isset($params['status']) ? $params['status'] : '';

            $yatra_booking_statuses = yatra_get_booking_statuses();

            if ($booking_id < 1 || !isset($yatra_booking_statuses[$status])) {

                return false;
            }

            $customer_detail = $this->get_customer_details($booking_id);

            $customer_email = isset($customer_detail['email']) ? $customer_detail['email'] : '';


            $yatra_all_smart_tags = yatra_all_smart_tags($booking_id);

            if (!empty($customer_email) && yatra_is_enable_email_notification("status_change", "customer")) {

                // User Parameters
                $user_message = CustomerEmail::get_booking_status_change_message();

                $user_subject = CustomerEmail::get_booking_status_change_subject();

                $this->send(array($customer_email), $user_subject, $user_message, $yatra_all_smart_tags, array());

            }

            if (yatra_is_enable_email_notification("status_change", "admin")) {

                $admin_message = AdminEmail::get_booking_status_change_message();

                $admin_subject = AdminEmail::get_booking_status_change_subject();

                $admin_emails = $this->get_admin_emails();

                $this->send($admin_emails, $admin_subject, $admin_message, $yatra_all_smart_tags, array(), true);

            }


        }

        public function enquiry_mail($valid_data, $status)
        {
            if (!$this->is_email_enabled() || !$status) {
                return;
            }
            $yatra_all_smart_tags = yatra_enquiry_form_smart_tags($status);

            if (yatra_is_enable_email_notification("enquiry_form", "admin")) {

                $admin_message = AdminEmail::get_enquiry_form_saved_message();

                $admin_subject = AdminEmail::get_enquiry_form_saved_subject();

                $admin_emails = $this->get_admin_emails();

                $this->send($admin_emails, $admin_subject, $admin_message, $yatra_all_smart_tags, array(), true);

            }

        }

        private function get_admin_emails()
        {
            $admin_emails = get_option('yatra_admin_email_recipient_lists', get_option('admin_email'));

            $admin_emails = str_replace(',', PHP_EOL, $admin_emails);

            $admin_emails_array = explode(PHP_EOL, $admin_emails);

            return array_map('trim', $admin_emails_array);
        }


        /**
         * Apply filters to modify sender's details before email is sent.
         */
        public function yatra_send_email_before()
        {
            add_filter('wp_mail_from', array($this, 'yatra_sender_email'));
            add_filter('wp_mail_from_name', array($this, 'yatra_sender_name'));
        }

        /**
         * Remove filters after the email is sent.
         *
         * @since 2.0.2
         */
        public function yatra_send_email_after()
        {
            remove_filter('wp_mail_from', array($this, 'yatra_sender_email'));
            remove_filter('wp_mail_from_name', array($this, 'yatra_sender_name'));
        }


        /**
         * Sender's Email address
         *
         * @return string sender's email
         */
        public function yatra_sender_email()
        {
            $sender_email = get_option('yatra_email_from_address', get_option('admin_email'));
            return $sender_email;
        }

        /**
         * Sender's name.
         *
         * @return string sender's name
         */
        public function yatra_sender_name()
        {
            $sender_name = get_option('yatra_email_from_name', esc_attr(get_bloginfo('name', 'display')));

            return $sender_name;
        }

        /**
         * Emails Headers.
         *
         * @return string email header
         */
        public function yatra_get_header($is_admin = false)
        {
            $header = '';

            if (!$is_admin) {

                $header = 'From: ' . $this->yatra_sender_name() . ' <' . $this->yatra_sender_email() . ">\r\n";
            }

            $header .= 'Reply-To: ' . $this->yatra_sender_email() . "\r\n";
            $header .= "Content-Type: text/html; charset=UTF-8\r\n";

            return $header;
        }


        /**
         * Trigger the user email.
         *
         * @param array $emails List of email
         * @param string $subject Subject
         * @param string $message String.
         * @param array $smart_values Array
         * @return void
         */
        public function send($emails, $subject, $message, $all_smart_tags = array(), $attachment = array(), $is_admin_email = false)
        {

            $message = yatra_maybe_parse_smart_tags($all_smart_tags, $message);

            $subject = yatra_maybe_parse_smart_tags($all_smart_tags, $subject);

            do_action('yatra_email_send_before');

            foreach ($emails as $email) {

                $status = wp_mail($email, $subject, $message, $this->yatra_get_header($is_admin_email));

                $logger = yatra_get_logger();

                $log_message = sprintf(__('Yatra Email successfully sent to %s', 'yatra'), $email);

                if (!$status) {

                    $log_message = sprintf(__('Yatra Email could not sent to %s via WP_Mail function', 'yatra'), $email);

                }

                $logger->info($log_message, array('source' => 'email'));

            }
            do_action('yatra_email_send_after');


        }


        public function get_customer_details($booking_id)
        {
            $booking_meta = $this->get_booking_meta($booking_id);

            $customer_meta = isset($booking_meta['yatra_tour_customer_info']) ? $booking_meta['yatra_tour_customer_info'] : array();

            $email = isset($customer_meta['email']) ? $customer_meta['email'] : '';

            if (!empty($email)) {

                return $customer_meta;
            }

            return array();
        }

        public function get_booking_meta($booking_id)
        {
            $booking_meta = get_post_meta($booking_id, 'yatra_booking_meta_params', true);

            return $booking_meta;
        }


    }

}
return new Yatra_Email();
