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

if (class_exists('Yatra_Settings_Design', false)) {
    return new Yatra_Settings_Design();
}

/**
 * Yatra_Settings_Design.
 */
class Yatra_Settings_Design extends Yatra_Admin_Settings_Base
{

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'design';
        $this->label = __('Design', 'yatra');

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
            '' => __('CSS Classes', 'yatra'),
            'layouts' => __('Layouts', 'yatra'),
            'colors' => __('Colors', 'yatra'),
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
        if ('layouts' === $current_section) {
            $settings = array(
                array(
                    'title' => __('Layout Settings', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_templates_options',
                ),
                array(
                    'title' => __('Tab Layout for tour page', 'yatra'),
                    'desc' => __('Tab layout for single tour page', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_setting_layouts_single_tour_tab_layout',
                    'type' => 'select',
                    'options' => array(
                        '' => __('Tab Style Layout', 'yatra'),
                        'heading_and_content' => __('Heading & Content Style Tab', 'yatra')
                    ),
                    'default' => ''
                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_templates_options',
                ),

            );

        } else if ('colors' === $current_section) {
            $settings = array(
                array(
                    'title' => __('Color Settings', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_design_color_options',
                ),
                array(
                    'title' => __('Primary Color', 'yatra'),
                    'desc' => __('Primary Color of Yatra Plugin', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_design_primary_color',
                    'type' => 'color',
                    'default' => ''
                ),
                array(
                    'title' => __('Available For Booking Color', 'yatra'),
                    'desc' => __('Background Color for Available for Booking', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_available_for_booking_color',
                    'type' => 'color',
                    'default' => '#2f582b'
                ),
                array(
                    'title' => __('Available For Enquiry Color', 'yatra'),
                    'desc' => __('Background Color for Available for Enquiry Only', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_available_for_enquiry_only_color',
                    'type' => 'color',
                    'default' => '#008bb5'
                ),
                array(
                    'title' => __('Not Available Color', 'yatra'),
                    'desc' => __('Background Color for Not available for booking & enquiry', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_not_available_for_booking_enquiry_color',
                    'type' => 'color',
                    'default' => '#aaa'
                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_design_color_options',
                ),

            );

        } else {
            $settings = array(
                array(
                    'title' => __('CSS Classes Settings', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_css_classes_options',
                ),
                array(
                    'title' => __('Page Container Class', 'yatra'),
                    'desc' => __('Container class for all page templates for yatra plugin.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_page_container_class',
                    'type' => 'text',
                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_css_classes_options',
                ),

            );
        }

        return apply_filters('yatra_get_settings_' . $this->id, $settings, $current_section);
    }
}

return new Yatra_Settings_Design();
