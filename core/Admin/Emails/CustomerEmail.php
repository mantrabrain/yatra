<?php

namespace Yatra\Core\Admin\Emails;

class CustomerEmail
{

    public static function get_booking_completed_message()
    {
        return EmailTemplates::get_template(apply_filters(
            'yatra_booking_email_notification_message_to_customer',

            get_option('yatra_booking_notification_email_content_for_customer',
                DefaultEmailMessages::get_booking_email_notification_message_to_customer()
            )
        ));

    }

    public static function get_booking_completed_subject()
    {
        return apply_filters(
            'yatra_booking_email_notification_subject_to_customer',

            get_option('yatra_booking_notification_email_subject_for_customer',
                DefaultEmailMessages::get_booking_email_notification_subject_to_customer()
            )
        );
    }

    public static function get_booking_status_change_message()
    {
        return EmailTemplates::get_template(apply_filters(
            'yatra_booking_status_change_email_notification_message_to_customer',

            get_option('yatra_booking_status_change_notification_email_content_for_customer',
                DefaultEmailMessages::get_booking_status_change_email_notification_message_to_customer()
            )
        ));
    }

    public static function get_booking_status_change_subject()
    {
        return apply_filters(

            'yatra_booking_status_change_email_notification_subject_to_customer',

            get_option('yatra_booking_status_change_notification_email_subject_for_customer',

                DefaultEmailMessages::get_booking_status_change_email_notification_subject_to_customer()
            )
        );
    }

}
