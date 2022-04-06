<?php
if (!function_exists('yatra_enable_email_notification')) {
    function yatra_is_enable_email_notification($mail_type, $context)
    {
        $option_id = null;

        if ($mail_type === "booking" && $context === "admin") {

            $option_id = "yatra_enable_booking_notification_email_for_admin";

        } else if ($mail_type === "booking" && $context === "customer") {

            $option_id = "yatra_enable_booking_notification_email_for_customer";

        } else if ($mail_type === "status_change" && $context === "admin") {

            $option_id = "yatra_enable_booking_status_change_notification_email_for_admin";

        } else if ($mail_type === "status_change" && $context === "customer") {

            $option_id = "yatra_enable_booking_status_change_notification_email_for_customer";

        } else if ($mail_type === "enquiry_form" && $context === "admin") {

            $option_id = "yatra_enable_enquiry_notification_email_for_admin";

        }
        if (is_null($option_id)) {

            return false;
        }

        return 'yes' === get_option($option_id, 'yes');

    }
}