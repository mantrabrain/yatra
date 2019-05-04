<?php
/**
 * Yatra General Settings
 *
 * @package Yatra/Admin
 */

defined('ABSPATH') || exit;

if (class_exists('Yatra_Settings_General', false)) {
    return new Yatra_Settings_General();
}

/**
 * Yatra_Admin_Settings_General.
 */
class Yatra_Settings_General extends Yatra_Admin_Settings_Base
{

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'general';
        $this->label = __('General', 'yatra');

        parent::__construct();
    }

    /**
     * Get settings array.
     *
     * @return array
     */
    public function get_settings()
    {


        $settings = apply_filters(
            'yatra_general_settings',
            array(

                array(
                    'title' => __('Store Address', 'yatra'),
                    'type' => 'title',
                    'desc' => __('This is where your business is located. Tax rates and shipping rates will use this address.', 'yatra'),
                    'id' => 'store_address',
                ),

                array(
                    'title' => __('Address line 1', 'yatra'),
                    'desc' => __('The street address for your business location.', 'yatra'),
                    'id' => 'yatra_store_address',
                    'default' => '',
                    'type' => 'text',
                    'desc_tip' => true,
                ),

                array(
                    'type' => 'sectionend',
                    'id' => 'store_address',
                ),

            )
        );

        return apply_filters('yatra_get_settings_' . $this->id, $settings);
    }

    /**
     * Output a color picker input box.
     *
     * @param mixed $name Name of input.
     * @param string $id ID of input.
     * @param mixed $value Value of input.
     * @param string $desc (default: '') Description for input.
     */
    public function color_picker($name, $id, $value, $desc = '')
    {
        echo '<div class="color_box">' . ($desc) . '
			<input name="' . esc_attr($id) . '" id="' . esc_attr($id) . '" type="text" value="' . esc_attr($value) . '" class="colorpick" /> <div id="colorPickerDiv_' . esc_attr($id) . '" class="colorpickdiv"></div>
		</div>';
    }

    /**
     * Output the settings.
     */
    public function output()
    {
        $settings = $this->get_settings();

        Yatra_Admin_Settings::output_fields($settings);
    }

    /**
     * Save settings.
     */
    public function save()
    {
        $settings = $this->get_settings();

        Yatra_Admin_Settings::save_fields($settings);
    }
}

return new Yatra_Settings_General();
