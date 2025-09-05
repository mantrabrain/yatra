<?php
/**
 * Yatra Checkout Settings
 *
 * @package Yatra/Admin
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (class_exists('Yatra_Settings_Frontend_Tabs', false)) {
    return new Yatra_Settings_Frontend_Tabs();
}

/**
 * Yatra_Settings_Frontend_Tabs.
 */
class Yatra_Settings_Frontend_Tabs extends Yatra_Admin_Settings_Base
{

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'frontend-tabs';
        $this->label = __('Tab Setting', 'yatra');
        $this->description = __('Manage frontend tab display, available tabs, and tab configurations', 'yatra');
        $this->icon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zM3 10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6zM14 9a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-2z"/></svg>';

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
            '' => __('Frontend Tab Setings', 'yatra'),
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

        $tour_tab_configs = yatra_tour_tab_default_configurations();

        return apply_filters('yatra_get_settings_' . $this->id, array(
            array(
                'title' => __('Tab Settings', 'yatra'),
                'type' => 'title',
                'desc' => '',
                'id' => 'yatra_frontend_tabs_general_options',
            ),
            array(
                'title' => __('Available Tabs', 'yatra'),
                'desc' => __('This option allows you to checkout without login. User will not created if you tick this option..', 'yatra'),
                'id' => 'yatra_frontend_tabs_available_options',
                'type' => 'tab_repeator',
                'default' => $tour_tab_configs,
                'value_callback' => 'yatra_frontend_tabs_available_options'
            ),
            array(
                'type' => 'sectionend',
                'id' => 'yatra_frontend_tabs_general_options',
            ),

        ), $current_section);
    }
}

return new Yatra_Settings_Frontend_Tabs();
