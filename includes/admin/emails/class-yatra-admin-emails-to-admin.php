<?php
defined('ABSPATH') || exit;

if (!class_exists('Yatra_Admin_Emails_To_Admin')) {

    class Yatra_Admin_Emails_To_Admin
    {

        public static function get_booking_completed_message()
        {

            return apply_filters(
                'yatra_booking_complete_admin_message',
                sprintf(
                    __(
                        'Hi Admin,
            
            <br/>

			{{customer_name}} ( {{customer_email}} ) has successfully booked your tour package to your site <a href="{{home_url}}">{{blog_info}}</a>.
			
			<br/>
			
		    Booking code: <b>{{booking_code}}</b>
		    
		    <br/>
		    
		    Tour Lists:
		    
		    <br/>
		    
		    {{tour_lists}}
		    
			Please review the booking details at \'<b>Tours</b>\' menu in your WP dashboard.

            <br/>
			Thank You!',
                        'yatra'
                    )
                )
            );


        }

        public static function get_booking_completed_subject()
        {
            return apply_filters(

                'yatra_booking_complete_admin_subject',
                sprintf(
                    __(
                        '{{customer_name}} booked tour package.',
                        'yatra'
                    )
                )
            );
        }

        public static function get_booking_status_change_message()
        {
            return apply_filters(
                'yatra_booking_status_change_admin_message',
                sprintf(
                    __(
                        'Hi Admin,
            
            <br/>

			{{customer_name}} ( {{customer_email}} )\'s tour booking has been {{booking_status}} on your site <a href="{{home_url}}">{{blog_info}}</a>.
			
			<br/>
			
		    Booking code: <b>{{booking_code}}</b>
		    
		    <br/>
		    
		    Tour Lists:
		    
		    <br/>
		    
		    {{tour_lists}}

			Thank You!',
                        'yatra'
                    )
                )
            );
        }

        public static function get_booking_status_change_subject()
        {
            return apply_filters(

                'yatra_booking_status_change_admin_subject',
                sprintf(
                    __(
                        '{{customer_name}}\'s  tour booking({{booking_code}}) has been {{booking_status}}.',
                        'yatra'
                    )
                )
            );
        }

    }
}