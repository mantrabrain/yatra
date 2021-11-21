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


        return apply_filters('yatra_get_settings_' . $this->id, array(
            array(
                'title' => __('Miscellaneous Settings', 'yatra'),
                'type' => 'title',
                'id' => 'yatra_miscellaneous_options',
            ),
            array(
                'title' => __('Log Options', 'yatra'),
                'desc' => __('This option allows you to setup log option for yatra plugin. Log option might be on file or on db or no log.', 'yatra'),
                'desc_tip' => true,
                'id' => 'yatra_log_options',
                'type' => 'select',
                'default' => 'db',
                'options' => array(
                    'file' => __('File', 'yatra'),
                    'db' => __('Database', 'yatra'),
                    'none' => __('None', 'yatra')
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
