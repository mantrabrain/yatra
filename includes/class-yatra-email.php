<?php
defined('ABSPATH') || exit;

if (!class_exists('Yatra_Email')) {

    class Yatra_Email
    {
        public function __construct()
        {

            if ('yes' === get_option('yatra_disable_all_email', 'no')) {
                return;
            }

            // Before Email & After Email Hooks
            add_action('yatra_email_send_before', array($this, 'yatra_send_email_before'));
            add_action('yatra_email_send_after', array($this, 'yatra_send_email_after'));

            // End of Before Email & After Email Hooks


            // Booking Complete Email Hook
            if ('yes' === get_option('yatra_enable_booking_notification_email_for_customer', 'yes')) {
                add_action('yatra_after_tour_booking_completed', array($this, 'booking_completed_email'), 10);
            }
            // Booking Status Change Hook
            add_action('yatra_after_booking_status_change', array($this, 'booking_status_change'), 10);

            // Testing Hook - Please delete after testing finished
            //add_action('init', array($this, 'booking_completed_email'), 10);
            //add_action('init', array($this, 'booking_status_change'), 10);
        }


        public function booking_completed_email($params = array())
        {

            $tour_ids = isset($params['tour_ids']) ? $params['tour_ids'] : array();

            $booking_id = isset($params['booking_id']) ? $params['booking_id'] : 0;

            if ($booking_id < 1 || count($tour_ids) < 1) {

                return;
            }

            // User Parameters
            $user_message = Yatra_Admin_Emails_To_User::get_booking_completed_message();

            $user_subject = Yatra_Admin_Emails_To_User::get_booking_completed_subject();

            $customer_detail = $this->get_customer_details($booking_id);

            $customer_email = isset($customer_detail['email']) ? $customer_detail['email'] : '';

            // end of User Parameters

            if (!empty($customer_email)) {

                $yatra_all_smart_tags = yatra_all_smart_tags($booking_id);

                $this->send(array($customer_email), $user_subject, $user_message, $yatra_all_smart_tags, array());

                if ($this->is_enable_admin_email()) {

                    $admin_message = Yatra_Admin_Emails_To_Admin::get_booking_completed_message();

                    $admin_subject = Yatra_Admin_Emails_To_Admin::get_booking_completed_subject();

                    $admin_emails = $this->get_admin_emails();

                    $this->send($admin_emails, $admin_subject, $admin_message, $yatra_all_smart_tags, array(), true);

                }

            }
        }

        public function booking_status_change($params)
        {

            $booking_id = isset($params['booking_id']) ? $params['booking_id'] : 0;

            $status = isset($params['status']) ? $params['status'] : '';

            $yatra_booking_statuses = yatra_get_booking_statuses();

            if ($booking_id < 1 || !isset($yatra_booking_statuses[$status])) {

                return false;
            }

            // User Parameters
            $user_message = Yatra_Admin_Emails_To_User::get_booking_status_change_message();

            $user_subject = Yatra_Admin_Emails_To_User::get_booking_status_change_subject();

            $customer_detail = $this->get_customer_details($booking_id);

            $customer_email = isset($customer_detail['email']) ? $customer_detail['email'] : '';

            // end of User Parameters

            if (!empty($customer_email)) {

                $yatra_all_smart_tags = yatra_all_smart_tags($booking_id);

                $this->send(array($customer_email), $user_subject, $user_message, $yatra_all_smart_tags, array());

                if ($this->is_enable_admin_email()) {

                    // Admin Parameters
                    $admin_message = Yatra_Admin_Emails_To_Admin::get_booking_status_change_message();

                    $admin_subject = Yatra_Admin_Emails_To_Admin::get_booking_status_change_subject();

                    $admin_emails = $this->get_admin_emails();

                    $this->send($admin_emails, $admin_subject, $admin_message, $yatra_all_smart_tags, array(), true);

                }

            }

        }

        private function is_enable_admin_email()
        {
            if ('yes' == get_option(' yatra_enable_admin_email ', 'yes')) {

                return true;
            }
            return false;
        }

        private function get_admin_emails()
        {
            $admin_emails = get_option('yatra_admin_email_receipents', get_option('admin_email'));

            $admin_emails = explode(',', $admin_emails);

            $admin_emails = array_map('trim', $admin_emails);

            return $admin_emails;
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

            foreach ($all_smart_tags as $tag => $tag_value) {

                $smart_tag = "{{" . $tag . "}}";

                $subject = str_replace($smart_tag, $tag_value, $subject);

                $message = str_replace($smart_tag, $tag_value, $message);

            }

            do_action('yatra_email_send_before');

            foreach ($emails as $email) {

                $status = wp_mail($email, $subject, $message, $this->yatra_get_header($is_admin_email));

                $logger = yatra_get_logger();

                $message = sprintf(__('Yatra Email successfully sent to %s', 'yatra'), $email);

                if (!$status) {

                    $message = sprintf(__('Yatra Email could not sent to %s via WP_Mail function', 'yatra'), $email);

                }

                $logger->info($message, array('source' => 'email'));

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
