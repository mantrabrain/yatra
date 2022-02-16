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

if (class_exists('Yatra_Settings_Miscellaneous', false)) {
    return new Yatra_Settings_Miscellaneous();
}

/**
 * Yatra_Settings_Checkout.
 */
class Yatra_Settings_Miscellaneous extends Yatra_Admin_Settings_Base
{

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'miscellaneous';
        $this->label = __('Miscellaneous', 'yatra');

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
            '' => __('Miscellaneous Settings', 'yatra'),
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
        $terms_setup_link = admin_url('admin.php?page=yatra-settings&tab=general&section=pages');
        $privacy_setup_link = admin_url('options-privacy.php');

        return apply_filters('yatra_get_settings_' . $this->id, array(
            array(
                'title' => __('Miscellaneous Settings', 'yatra'),
                'type' => 'title',
                'id' => 'yatra_miscellaneous_options',
            ),
            array(
                'title' => __('Log Options', 'yatra'),
                'desc' => __('This option allows you to setup log option for yatra plugin. Log option might be on file or on db.', 'yatra'),
                'desc_tip' => true,
                'id' => 'yatra_log_options',
                'type' => 'select',
                'default' => 'db',
                'options' => array(
                    'file' => __('File', 'yatra'),
                    'db' => __('Database', 'yatra'),
                )
            ),
            array(
                'title' => __('Show Enquiry Form', 'yatra'),
                'desc' => __('Show/hide enquiry form. You can override this option by enabling enquiry only option from availability menu for specific date or date ranges..', 'yatra'),
                'id' => 'yatra_enquiry_form_show',
                'type' => 'checkbox',
                'default' => 'yes',
            ),
            array(
                'title' => __('Show Terms on enquiry form', 'yatra'),
                'desc' => sprintf(__('Show terms and condition agree checkbox on enquiry form. You can setup terms and conditions page from %s here %s', 'yatra'), "<a target='_blank' href='{$terms_setup_link}'>", '</a>'),
                'id' => 'yatra_enquiry_form_show_agree_to_terms_policy',
                'type' => 'checkbox',
                'default' => 'no',
            ),
            array(
                'title' => __('Show Privacy on enquiry form', 'yatra'),
                'desc' => sprintf(__('Show privacy policy agree checkbox on enquiry form. You can setup privacy policy page from %s here %s', 'yatra'), "<a target='_blank' href='{$privacy_setup_link}'>", '</a>'),
                'id' => 'yatra_enquiry_form_show_agree_to_privacy_policy',
                'type' => 'checkbox',
                'default' => 'no',
            ),
            array(
                'title' => __('Show Availability Indicator', 'yatra'),
                'desc' => __('Show Availability indicator on tour single page', 'yatra'),
                'id' => 'yatra_show_booking_availability_indicator',
                'type' => 'checkbox',
                'default' => 'yes',
            ),
            array(
                'title' => __('Date Selection Type', 'yatra'),
                'desc' => __('This option allows you to choose date selection type. You can choose either calendar type or date listing type.', 'yatra'),
                'desc_tip' => true,
                'id' => 'yatra_date_selection_type',
                'type' => 'select',
                'default' => 'calendar',
                'options' => array(
                    'calendar' => __('Calendar', 'yatra'),
                    'date_listing' => __('Date Listing', 'yatra'),
                )
            ),
            array(
                'type' => 'sectionend',
                'id' => 'yatra_miscellaneous_options',
            ),

        ), $current_section);
    }
}

return new Yatra_Settings_Checkout();
