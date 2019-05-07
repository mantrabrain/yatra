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
     * Get sections.
     *
     * @return array
     */
    public function get_sections()
    {
        $sections = array(
            '' => __('General', 'yatra'),
            'inventory' => __('Inventory', 'yatra'),
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
        if ('inventory' === $current_section) {
            $settings = apply_filters(
                'yatra_inventory_settings',
                array(
                    array(
                        'title' => __('Inventory', 'yatra'),
                        'type' => 'title',
                        'desc' => '',
                        'id' => 'product_inventory_options',
                    ),

                    array(
                        'title' => __('Manage stock', 'yatra'),
                        'desc' => __('Enable stock management', 'yatra'),
                        'id' => 'yatra_manage_stock',
                        'default' => 'yes',
                        'type' => 'checkbox',
                    ),

                    array(
                        'type' => 'sectionend',
                        'id' => 'product_inventory_options',
                    ),

                )
            );

        } else {
            $settings = apply_filters(
                'yatra_product_settings',
                apply_filters(
                    'yatra_products_general_settings',
                    array(
                        array(
                            'title' => __('Shop pages', 'yatra'),
                            'type' => 'title',
                            'desc' => '',
                            'id' => 'catalog_options',
                        ),


                        array(
                            'type' => 'sectionend',
                            'id' => 'catalog_options',
                        ),

                    )
                )
            );
        }

        return apply_filters('yatra_get_settings_' . $this->id, $settings, $current_section);
    }
}

return new Yatra_Settings_Miscellaneous();
