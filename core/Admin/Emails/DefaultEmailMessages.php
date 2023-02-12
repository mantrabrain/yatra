<?php

namespace Yatra\Core\Admin\Emails;

class DefaultEmailMessages
{
    public static function get_booking_email_notification_subject_to_customer()
    {
        return __(
            'Your tour booking has been confirmed',
            'yatra'
        );
    }

    public static function get_booking_email_notification_message_to_customer()
    {
        return EmailTemplates::get_content(
            [
                'greetings' => sprintf(__('Hi %s,', 'yatra'), '{{customer_name}}'),
                'byline_text' => sprintf(__('Your booking  on <a href="{{home_url}}">{{blog_info}}</a> has been confirmed and waiting for admin moderation.<br/><br/>You will get an email after your booking approved or cancelled.<br/><br/> Booking code: <strong>%s</strong>', 'yatra'), ' {{booking_code}}'),
                'heading' => __("Booking Confirmation", 'yatra'),
                'email_to' => 'customer',
            ]
        );
    }

    public static function get_booking_email_notification_subject_to_admin()
    {
        return __(
            '{{customer_name}} booked tour package.',
            'yatra'
        );
    }

    public static function get_booking_email_notification_message_to_admin()
    {
        return EmailTemplates::get_content(
            [
                'greetings' => __('Hi Admin,', 'yatra'),
                'byline_text' => sprintf(__('%s ( %s ) has successfully booked your tour package to your site  <a href="%s">%s</a>.<br/><br/> Booking code: <strong>%s</strong>', 'yatra'),
                    '{{customer_name}}', '{{customer_email}}', '{{home_url}}', '{{blog_info}}', '{{booking_code}}'),
                'heading' => __("New Booking", 'yatra'),
                'email_to' => 'admin',
            ]
        );
    }

    public static function get_booking_status_change_email_notification_subject_to_customer()
    {

        return __(
            'Your tour booking has been {{booking_status}}',
            'yatra'
        );

    }

    public static function get_booking_status_change_email_notification_message_to_customer()
    {

        return EmailTemplates::get_content(
            [
                'greetings' => sprintf(__('Hi %s,', 'yatra'), '{{customer_name}}'),
                'byline_text' => sprintf(__('Your booking  on <a href="%s">%s</a> has been %s.<br/><br/>Booking code: <strong>%s</strong>', 'yatra'), '{{home_url}}', '{{blog_info}}', '{{booking_status}}', '{{booking_code}}'),
                'heading' => sprintf(__("Booking %s", 'yatra'), '{{booking_status}}'),
                'email_to' => 'customer',
            ]
        );
    }

    public static function get_booking_status_change_email_notification_subject_to_admin()
    {
        return __(
            '{{customer_name}}\'s  tour booking({{booking_code}}) has been {{booking_status}}.',
            'yatra'
        );

    }

    public static function get_booking_status_change_email_notification_message_to_admin()
    {

        return EmailTemplates::get_content(
            [
                'greetings' => __('Hi Admin,', 'yatra'),
                'byline_text' => sprintf(__('%s ( %s )\'s tour booking has been %s on your site <a href="%s">%s</a>.<br/><br/> Booking code: <strong>%s</strong>', 'yatra'),
                    '{{customer_name}}', '{{customer_email}}', '{{booking_status}}', '{{home_url}}', '{{blog_info}}', '{{booking_code}}'),
                'heading' => sprintf(__("Booking %s", 'yatra'), '{{booking_status}}'),
                'email_to' => 'admin',
            ]
        );
    }

    public static function get_enquiry_email_notification_subject_to_admin()
    {
        return __(
            '{{enquiry_fullname}} send enquiry about {{enquiry_tour_name}}',
            'yatra'
        );
    }

    public static function get_enquiry_email_notification_message_to_admin()
    {
        return EmailTemplates::get_content(
            [
                'greetings' => __('Hi Admin,', 'yatra'),
                'byline_text' => sprintf(__('%s send you an enquiry about %s on <a href="%s">%s</a> with following details', 'yatra'),
                    '{{enquiry_fullname}}', '{{enquiry_tour_name}}', '{{home_url}}', '{{blog_info}}'),
                'heading' => __('New Enquiry', 'yatra'),
                'email_to' => 'admin',
            ],
            'enquiry'
        );

        return __(
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
        );
    }
}