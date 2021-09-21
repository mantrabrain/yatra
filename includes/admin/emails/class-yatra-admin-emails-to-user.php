<?php
defined('ABSPATH') || exit;

if (!class_exists('Yatra_Admin_Emails_To_User')) {

    class Yatra_Admin_Emails_To_User
    {

        public static function get_booking_completed_message()
        {
            return apply_filters(

                'yatra_booking_complete_message',
                get_option('yatra_booking_notification_email_content_for_customer',
                    sprintf(
                        __(
                            'Hi {{customer_name}},
                
                <br/>

 				Your booking  on <a href="{{home_url}}">{{blog_info}}</a> has been confirmed and waiting for admin moderation.
 				
 				<br/>
 				Booking code: <b>{{booking_code}}</b> and here is the tour lists:
 				
 				<br/>
 				{{tour_lists}}
             
 				You will get an email after your booking approved or cancelled.
 				
 				<br/>

 				Thank You!',
                            'yatra'
                        )
                    ))
            );
        }

        public static function get_booking_completed_subject()
        {
            return apply_filters(

                'yatra_booking_complete_subject',
                get_option('yatra_booking_notification_email_subject_for_customer',
                    sprintf(
                        __(
                            'Your tour booking has been confirmed',
                            'yatra'
                        )
                    ))
            );
        }

        public static function get_booking_status_change_message()
        {
            return apply_filters(

                'yatra_booking_status_change_message',
                sprintf(
                    __(
                        'Hi {{customer_name}},
                
                <br/>

 				Your booking on <a href="{{home_url}}">{{blog_info}}</a> has been <b>{{booking_status}}</b>.
 				
 				<br/>
 				Booking code: <b>{{booking_code}}</b> and here is the tour lists:
 				<br/>
 				{{tour_lists}}
             
 						
 				<br/>

 				Thank You!',
                        'yatra'
                    )
                )
            );
        }

        public static function get_booking_status_change_subject()
        {
            return apply_filters(

                'yatra_booking_status_change_subject',
                sprintf(
                    __(
                        'Your tour booking has been {{booking_status}}',
                        'yatra'
                    )
                )
            );
        }

    }

}
