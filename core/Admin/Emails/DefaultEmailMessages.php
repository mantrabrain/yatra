<?php

namespace Yatra\Core\Admin\Emails;

class DefaultEmailMessages
{

    protected static function getTemplatePath($template) 
    {
        if (!is_string($template)) {
            throw new \Exception (__('Template name must be a valid string!'));
        }

        $templatePath = ABSPATH . 'wp-content/plugins/yatra/templates/email/' . $template . '.html';

        if(!file_exists($templatePath)) {
            throw new \Exception (__('Email template %s does not exist!', $template));
        }

        return $templatePath;
    }

    protected static function getTemplateData($template) 
    {
        return file_get_content(self::getTemplatePath($template));
    }
    
    public static function get_booking_email_notification_subject_to_customer()
    {
        return __(
            self::getTemplateData('customer/booking-notification-subject'),
            'yatra'
        );
    }

    public static function get_booking_email_notification_message_to_customer()
    {

        return __(
            self::getTemplateData('customer/booking-email-notification'), 
            'yatra'
        );
    }

    public static function get_booking_email_notification_subject_to_admin()
    {
        return __(
            self::getTemplateData('admin/booking-notification-subject')
            'yatra'
        );
    }

    public static function get_booking_email_notification_message_to_admin()
    {
        return __(
            self::getTemplateData('admin/booking-email-notification'),
            'yatra'
        );
    }

    public static function get_booking_status_change_email_notification_subject_to_customer()
    {

        return __(
            self::getTemplateData('customer/booking-status-change-subject'),
            'yatra'
        );

    }

    public static function get_booking_status_change_email_notification_message_to_customer()
    {

        return __(
            self::getTemplateData('customer/booking-status-change-email-notification')
            'yatra'
        );
    }

    public static function get_booking_status_change_email_notification_subject_to_admin()
    {
        return __(
            self::getTemplateData('admin/booking-status-change-subject'),
            'yatra'
        );

    }

    public static function get_booking_status_change_email_notification_message_to_admin()
    {

        return __(
            self::getTemplateData('admin/booking-status-change-email-notification'),
            'yatra'
        );
    }

    public static function get_enquiry_email_notification_subject_to_admin()
    {
        return __(
            self::getTemplateData('admin/enquiry-notification-subject'),
            'yatra'
        );
    }

    public static function get_enquiry_email_notification_message_to_admin()
    {
        return __(
            self::getTemplateData('admin/enquiry-email-notification'),
            'yatra'
        );
    }
}