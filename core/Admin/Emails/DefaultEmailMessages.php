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

        return __(
            'Hi {{customer_name}},
                
                <br/>

 				Your booking  on <a href="{{home_url}}">{{blog_info}}</a> has been confirmed and waiting for admin moderation.
 				
 				<br/>
 				Booking code: <b>{{booking_code}}</b> and here is the tour lists:
 				
 				<br/>
 				<strong>Tour Name</strong>                       <strong>Tour Date</strong>                       <strong>Number of Person</strong>
 				<br/>
 				{{tour_lists_loop_start}}
 				{{tour_name}}                                    {{tour_date}}                                    {{number_of_person}}
 				{{tour_lists_loop_start}}
              	<br/>
              	You will get an email after your booking approved or cancelled.
 				
 				<br/>

 				Thank You!',
            'yatra'
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
        return __(
            'Hi Admin,
            
            <br/>

			{{customer_name}} ( {{customer_email}} ) has successfully booked your tour package to your site <a href="{{home_url}}">{{blog_info}}</a>.
			
			<br/>
			
		    Booking code: <b>{{booking_code}}</b>
		    
		    <br/>
		    
		    Tour Lists:
		    
		    <br/>
            <strong>Tour Name</strong>                       <strong>Tour Date</strong>                       <strong>Number of Person</strong>
            <br/>
            {{tour_lists_loop_start}}
            {{tour_name}}                                    {{tour_date}}                                    {{number_of_person}}
            {{tour_lists_loop_start}}
            <br/>
		    
			Please review the booking details at \'<b>Yatra</b>\' menu in your dashboard.

            <br/>
			Thank You!',
            'yatra'
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

        return __(
            'Hi {{customer_name}},
                
                <br/>

 				Your booking on <a href="{{home_url}}">{{blog_info}}</a> has been <b>{{booking_status}}</b>.
 				
 				<br/>
 				Booking code: <b>{{booking_code}}</b> and here is the tour lists:
 				<br/>
 				<strong>Tour Name</strong>                       <strong>Tour Date</strong>                       <strong>Number of Person</strong>
 				<br/>
 				{{tour_lists_loop_start}}
 				{{tour_name}}                                    {{tour_date}}                                    {{number_of_person}}
 				{{tour_lists_loop_start}}
 				<br/>

 				Thank You!',
            'yatra'
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

        return __(
            'Hi Admin,
            
            <br/>

			{{customer_name}} ( {{customer_email}} )\'s tour booking has been {{booking_status}} on your site <a href="{{home_url}}">{{blog_info}}</a>.
			
			<br/>
			
		    Booking code: <b>{{booking_code}}</b>
		    
		    <br/>
		    
		    Tour Lists:
		    
		    <br/>
            <strong>Tour Name</strong>                       <strong>Tour Date</strong>                       <strong>Number of Person</strong>
            <br/>
            {{tour_lists_loop_start}}
            {{tour_name}}                                    {{tour_date}}                                    {{number_of_person}}
            {{tour_lists_loop_start}}
            <br/>
			Thank You!',
            'yatra'
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