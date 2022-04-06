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

        public static function get_enquiry_form_saved_message()
        {

            return apply_filters(
                'yatra_enquiry_form_saved_admin_message',
                sprintf(
                    __(
                        'Hi Admin,
            
            <br/>

			{{enquiry_fullname}} send you an enquiry about  {{enquiry_tour_name}} on<a target="_blank" href="{{home_url}}">{{blog_info}}</a> with following details.
			
			<br/>
			
		    Email: <b>{{enquiry_email}}</b>
		    
		    <br/>
				    
			Country: <b>{{enquiry_country}}</b>
		    
		    <br/>
		    			
		    Phone Number: <b>{{enquiry_phone_number}}</b>
		    
		    <br/>
		    		    			
		    Number of adults: <b>{{enquiry_number_of_adults}}</b>
		    
		    <br/>
		    		    		    			
		    Number of childs: <b>{{enquiry_number_of_childs}}</b>
		    
		    <br/>
		     
		    Subject: <b>{{enquiry_subject}}</b>
		    
		    <br/>
		    
		    Date: <b>{{enquiry_date}}</b>
		    
		    <br/>
		    
		    <b>Message</b>
		    <br/>
				    
			{{enquiry_message}}

            <br/>
			',
                        'yatra'
                    )
                )
            );


        }

        public static function get_enquiry_form_saved_subject()
        {
            return apply_filters(

                'yatra_enquiry_form_saved_admin_subject',
                __(
                    '{{enquiry_fullname}} send enquiry about {{enquiry_tour_name}}',
                    'yatra'
                )
            );
        }

    }
}