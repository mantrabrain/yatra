<?php

namespace Yatra\Core\Hooks;

use Yatra\Core\Admin\Emails\AdminEmail;
use Yatra\Core\Admin\Emails\CustomerEmail;

class EmailHooks
{

    public static function init()
    {
        $self = new self;

        add_action('init', array($self, 'preview_email'));

    }

    public function preview_email()
    {
        if (!current_user_can('manage_yatra')) {
            return;
        }

        $preview_action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';

        $type = isset($_GET['email_type']) ? sanitize_text_field($_GET['email_type']) : '';

        $to = isset($_GET['email_to']) ? sanitize_text_field($_GET['email_to']) : '';

        if ($preview_action != 'yatra-email-preview' || $type === '' || $to === '') {
            return;
        }
        $valid_to_array = array('admin', 'customer');

        $valid_type_array = array('booking', 'booking_status_change', 'enquiry');

        if (!in_array($to, $valid_to_array, true) || !in_array($type, $valid_type_array, true)) {
            return;
        }

        if ($type === "booking" && $to === "admin") {

            echo AdminEmail::get_booking_completed_message();

        } else if ($type === "booking" && $to === "customer") {

            echo CustomerEmail::get_booking_completed_message();

        } else if ($type === "booking_status_change" && $to === "admin") {

            echo AdminEmail::get_booking_status_change_message();

        } else if ($type === "booking_status_change" && $to === "customer") {

            echo CustomerEmail::get_booking_status_change_message();

        } else if ($type === 'enquiry' && $to === 'admin') {

            echo AdminEmail::get_enquiry_form_saved_message();
        }

        exit;
    }
}