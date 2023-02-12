<?php

namespace Yatra\Core\Admin\Emails;

class AdminEmail
{

    public static function get_booking_completed_message()
    {
        return EmailTemplates::get_template(apply_filters(
            'yatra_booking_email_notification_message_to_admin',

            get_option('yatra_booking_notification_email_content_for_admin',
                DefaultEmailMessages::get_booking_email_notification_message_to_admin()
            )
        ));
    }

    public static function get_booking_completed_subject()
    {
        return apply_filters(
            'yatra_booking_email_notification_subject_to_admin',

            get_option('yatra_booking_notification_email_subject_for_admin',
                DefaultEmailMessages::get_booking_email_notification_subject_to_admin()
            )
        );
    }

    public static function get_booking_status_change_message()
    {
        return EmailTemplates::get_template(apply_filters(
            'yatra_booking_status_change_email_notification_message_to_admin',

            get_option('yatra_booking_status_change_notification_email_content_for_admin',
                DefaultEmailMessages::get_booking_status_change_email_notification_message_to_admin()
            )
        ));
    }

    public static function get_booking_status_change_subject()
    {
        return apply_filters(

            'yatra_booking_status_change_email_notification_subject_to_admin',

            get_option('yatra_booking_status_change_notification_email_subject_for_admin',

                DefaultEmailMessages::get_booking_status_change_email_notification_subject_to_admin()
            )
        );
    }


    public static function get_enquiry_form_saved_message()
    {

        return EmailTemplates::get_template(apply_filters(

            'yatra_enquiry_email_notification_message_to_admin',

            get_option('yatra_enquiry_notification_email_content_for_admin',

                DefaultEmailMessages::get_enquiry_email_notification_message_to_admin()
            )
        ));

    }

    public static function get_enquiry_form_saved_subject()
    {
        return apply_filters(

            'yatra_enquiry_email_notification_subject_to_admin',

            get_option('yatra_enquiry_notification_email_subject_for_admin',

                DefaultEmailMessages::get_enquiry_email_notification_subject_to_admin()
            )
        );
    }

}