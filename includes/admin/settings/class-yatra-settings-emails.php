<?php
/**
 * Yatra Miscellaneous Settings
 *
 * @package Yatra/Admin
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (class_exists('Yatra_Settings_Emails', false)) {
    return new Yatra_Settings_Emails();
}

/**
 * Yatra_Settings_Emails.
 */
class Yatra_Settings_Emails extends Yatra_Admin_Settings_Base
{

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'emails';
        $this->label = __('Emails', 'yatra');

        parent::__construct();
    }

    /**
     * Get sections.
     *
     * @return array
     */
    public function get_sections()
    {
        $sections = array(
            '' => __('General', 'yatra'),
            'booking_notification' => __('Booking Notification', 'yatra'),
            'status_change' => __('Booking Status Change Notification', 'yatra'),
            'enquiry_form' => __('Enquiry Notification', 'yatra'),
        );

        return apply_filters('yatra_get_sections_' . $this->id, $sections);
    }

    /**
     * Output the settings.
     */
    public function output()
    {
        global $current_section;

        $settings = $this->get_settings($current_section);

        Yatra_Admin_Settings::output_fields($settings);
    }

    /**
     * Save settings.
     */
    public function save()
    {
        global $current_section;

        $settings = $this->get_settings($current_section);
        Yatra_Admin_Settings::save_fields($settings);

        if ($current_section) {
            do_action('yatra_update_options_' . $this->id . '_' . $current_section);
        }
    }

    /**
     * Get settings array.
     *
     * @param string $current_section Current section name.
     * @return array
     */
    public function get_settings($current_section = '')
    {
        if ('booking_notification' === $current_section) {
            $settings = array(
                array(
                    'title' => __('Booking notification email: To Customer', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_email_booking_notification_to_customer_options',
                ),
                array(
                    'title' => __('Enable/Disable Customer Email', 'yatra'),
                    'desc' => __('This option allows you to enable/disable booking notification email for customer.', 'yatra'),
                    'id' => 'yatra_enable_booking_notification_email_for_customer',
                    'type' => 'checkbox',
                    'default' => 'yes',
                ),
                array(
                    'title' => __('Email Subject for customer', 'yatra'),
                    'desc' => __('This option allows you to change booking notification email subject for customer.', 'yatra'),
                    'id' => 'yatra_booking_notification_email_subject_for_customer',
                    'type' => 'text',
                    'custom_attributes' => array(
                        'size' => 70
                    ),
                    'default' => Yatra_Admin_Emails_To_User::get_booking_completed_subject()

                ),
                array(
                    'title' => __('Email Content for customer', 'yatra'),
                    'desc' => sprintf(__('This option allows you to change booking notification email content for customer. View all available %sBooking Smart Tags%s', 'yatra'), '<a href="https://wpyatra.com/docs/yatra/yatra-settings/emails/" target="_blank">', '</a>'),
                    'id' => 'yatra_booking_notification_email_content_for_customer',
                    'type' => 'textarea',
                    'editor' => true,
                    'allow-html' => true,
                    'custom_attributes' => array(
                        'size' => 70
                    ),
                    'default' => Yatra_Admin_Emails_To_User::get_booking_completed_message()

                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_email_booking_notification_to_customer_options',
                ),
                array(
                    'title' => __('Booking notification email: To Admin', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_email_booking_notification_to_admin_options',
                ),
                array(
                    'title' => __('Enable/Disable Admin Email', 'yatra'),
                    'desc' => __('This option allows you to enable/disable booking notification email for admin.', 'yatra'),
                    'id' => 'yatra_enable_booking_notification_email_for_admin',
                    'type' => 'checkbox',
                    'default' => 'yes',
                ),
                array(
                    'title' => __('Email Subject for admin', 'yatra'),
                    'desc' => __('This option allows you to change booking notification email subject for admin.', 'yatra'),
                    'id' => 'yatra_booking_notification_email_subject_for_admin',
                    'type' => 'text',
                    'custom_attributes' => array(
                        'size' => 70
                    ),
                    'default' => Yatra_Admin_Emails_To_Admin::get_booking_completed_subject()

                ),
                array(
                    'title' => __('Email Content for admin', 'yatra'),
                    'desc' => sprintf(__('This option allows you to change booking notification email content for admin. View all available %sBooking Smart Tags%s', 'yatra'), '<a href="https://wpyatra.com/docs/yatra/yatra-settings/emails/" target="_blank">', '</a>'),
                    'id' => 'yatra_booking_notification_email_content_for_admin',
                    'type' => 'textarea',
                    'editor' => true,
                    'allow-html' => true,
                    'custom_attributes' => array(
                        'size' => 70
                    ),
                    'default' => Yatra_Admin_Emails_To_Admin::get_booking_completed_message()

                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_email_booking_notification_to_admin_options',
                ),

            );

        } else if ('status_change' === $current_section) {
            $settings = array(
                array(
                    'title' => __('Booking status change notification email: To Customer', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_email_booking_status_change_notification_to_customer_options',
                ),
                array(
                    'title' => __('Enable/Disable Customer Email', 'yatra'),
                    'desc' => __('This option allows you to enable/disable booking status changed notification email for customer.', 'yatra'),
                    'id' => 'yatra_enable_booking_status_change_notification_email_for_customer',
                    'type' => 'checkbox',
                    'default' => 'yes',
                ),
                array(
                    'title' => __('Email Subject for customer', 'yatra'),
                    'desc' => __('This option allows you to change booking status change notification email subject for customer.', 'yatra'),
                    'id' => 'yatra_booking_status_change_notification_email_subject_for_customer',
                    'type' => 'text',
                    'custom_attributes' => array(
                        'size' => 50
                    ),
                    'default' => Yatra_Admin_Emails_To_User::get_booking_status_change_subject()

                ),
                array(
                    'title' => __('Email Content for customer', 'yatra'),

                    'desc' => sprintf(__('This option allows you to change booking status change notification email content for customer. View all available %sBooking Smart Tags%s', 'yatra'), '<a href="https://wpyatra.com/docs/yatra/yatra-settings/emails/" target="_blank">', '</a>'),
                    'id' => 'yatra_booking_status_change_notification_email_content_for_customer',
                    'type' => 'textarea',
                    'editor' => true,
                    'allow-html' => true,
                    'custom_attributes' => array(
                        'size' => 50
                    ),
                    'default' => Yatra_Admin_Emails_To_User::get_booking_status_change_message()

                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_email_booking_status_change_notification_to_customer_options',
                ),
                array(
                    'title' => __('Booking status change notification email: To Admin', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_email_booking_status_change_notification_to_admin_options',
                ),
                array(
                    'title' => __('Enable/Disable Admin Email', 'yatra'),
                    'desc' => __('This option allows you to enable/disable booking status change notification email for admin.', 'yatra'),
                    'id' => 'yatra_enable_booking_status_change_notification_email_for_admin',
                    'type' => 'checkbox',
                    'default' => 'yes',
                ),
                array(
                    'title' => __('Email Subject for admin', 'yatra'),
                    'desc' => __('This option allows you to change booking status change notification email subject for admin.', 'yatra'),
                    'id' => 'yatra_booking_status_change_notification_email_subject_for_admin',
                    'type' => 'text',
                    'custom_attributes' => array(
                        'size' => 50
                    ),
                    'default' => Yatra_Admin_Emails_To_Admin::get_booking_status_change_subject()

                ),
                array(
                    'title' => __('Email Content for admin', 'yatra'),
                    'desc' => sprintf(__('This option allows you to change booking status change notification email content for admin. View all available %sBooking Smart Tags%s', 'yatra'), '<a href="https://wpyatra.com/docs/yatra/yatra-settings/emails/" target="_blank">', '</a>'),
                    'id' => 'yatra_booking_status_change_notification_email_content_for_admin',
                    'type' => 'textarea',
                    'editor' => true,
                    'allow-html' => true,
                    'custom_attributes' => array(
                        'size' => 50
                    ),
                    'default' => Yatra_Admin_Emails_To_Admin::get_booking_status_change_message()

                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_email_booking_status_change_notification_to_admin_options',
                ),

            );
        } else if ('enquiry_form' === $current_section) {
            $settings = array(
                array(
                    'title' => __('Enquiry notification email: To Admin', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_email_enquiry_notification_to_admin_options',
                ),
                array(
                    'title' => __('Enable/Disable Admin Email', 'yatra'),
                    'desc' => __('This option allows you to enable/disable enquiry form notification email for admin.', 'yatra'),
                    'id' => 'yatra_enable_enquiry_notification_email_for_admin',
                    'type' => 'checkbox',
                    'default' => 'yes',
                ),
                array(
                    'title' => __('Email Subject for admin', 'yatra'),
                    'desc' => __('This option allows you to change enquiry notification email subject for admin.', 'yatra'),
                    'id' => 'yatra_enquiry_notification_email_subject_for_admin',
                    'type' => 'text',
                    'custom_attributes' => array(
                        'size' => 70
                    ),
                    'default' => Yatra_Admin_Emails_To_Admin::get_enquiry_form_saved_subject()

                ),
                array(
                    'title' => __('Email Content for admin', 'yatra'),
                    'desc' => sprintf(__('This option allows you to change enquiry notification email content for admin. View all available %sEnquiry Form Smart Tags%s', 'yatra'), '<a href="https://wpyatra.com/docs/yatra/yatra-settings/emails/" target="_blank">', '</a>'),
                    'id' => 'yatra_enquiry_notification_email_content_for_admin',
                    'type' => 'textarea',
                    'editor' => true,
                    'allow-html' => true,
                    'custom_attributes' => array(
                        'size' => 70
                    ),
                    'default' => Yatra_Admin_Emails_To_Admin::get_enquiry_form_saved_message()

                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_email_enquiry_notification_to_admin_options',
                ),

            );
        } else {
            $settings = array(
                array(
                    'title' => __('General Email Settings', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_emails_general_options',
                ),
                array(
                    'title' => __('Disable all  emails', 'yatra'),
                    'desc' => __('This option disable all email ( admin and user email )  related to yatra plugin.', 'yatra'),

                    'id' => 'yatra_disable_all_email',
                    'type' => 'checkbox',
                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_emails_general_options',
                ),

                array(
                    'title' => __('Email Sender Options', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_emails_general_sender_options',
                ),
                array(
                    'title' => __('"From" name', 'yatra'),
                    'desc' => __('From name for outgoing email address from yatra plugin.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_email_from_name',
                    'type' => 'text',
                    'default' => get_bloginfo('name', 'display'),
                    'custom_attributes' => array(
                        'size' => 50
                    )
                ),
                array(
                    'title' => __('"From" email address', 'yatra'),
                    'desc' => __('From email address for outgoing email address from yatra plugin.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_email_from_address',
                    'type' => 'email',
                    'default' => get_option('admin_email'),
                    'custom_attributes' => array(
                        'size' => 50
                    )
                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_emails_general_sender_options',
                ),

            );
        }

        return apply_filters('yatra_get_settings_' . $this->id, $settings, $current_section);
    }
}

return new Yatra_Settings_Emails();
