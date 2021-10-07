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
            $settings = apply_filters(
                'yatra_settings_design_layouts',
                array(
                    array(
                        'title' => __('Layout Settings', 'yatra'),
                        'type' => 'title',
                        'desc' => '',
                        'id' => 'yatra_templates_options',
                    ),
                    array(
                        'title' => __('Tab Layout for tour page', 'yatra'),
                        'desc' => __('Tab layout for single tour page', 'yatra'),
                        'id' => 'yatra_setting_layouts_single_tour_tab_layout',
                        'type' => 'select',
                        'options' => array(
                            '' => __('Tab Style Layout', 'yatra'),
                            'heading_and_content' => __('Heading & Content Style Tab')
                        ),
                        'default' => ''
                    ),
                    array(
                        'type' => 'sectionend',
                        'id' => 'yatra_templates_options',
                    ),

                )
            );

        } else {
            $settings = apply_filters(
                'yatra_settings_design_css_classes',
                array(
                    array(
                        'title' => __('CSS Classes Settings', 'yatra'),
                        'type' => 'title',
                        'desc' => '',
                        'id' => 'yatra_css_classes_options',
                    ),
                    array(
                        'title' => __('Page Container Class', 'yatra'),
                        'desc' => __('Container class for all page templates for yatra plugin.', 'yatra'),
                        'id' => 'yatra_page_container_class',
                        'type' => 'text',
                    ),
                    array(
                        'type' => 'sectionend',
                        'id' => 'yatra_css_classes_options',
                    ),

                )

            );
        }

        return apply_filters('yatra_get_settings_' . $this->id, $settings, $current_section);
    }
}

return new Yatra_Settings_Design();
