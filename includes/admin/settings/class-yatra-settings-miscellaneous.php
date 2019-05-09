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
 * Yatra_Settings_Miscellaneous.
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

        $settings = apply_filters(
            'yatra_miscellaneous_settings',
            array(
                array(
                    'title' => __('Miscellaneous', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'miscellaneous_options',
                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'miscellaneous_options',
                ),

            )
        );


        return apply_filters('yatra_get_settings_' . $this->id, $settings, $current_section);
    }
}

return new Yatra_Settings_Miscellaneous();
