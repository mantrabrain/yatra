<?php
/**
 * Yatra Payment Gateways Settings
 *
 * @package Yatra/Admin
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (class_exists('Yatra_Settings_Payment_Gateways', false)) {
    return new Yatra_Settings_Payment_Gateways();
}

/**
 * Yatra_Settings_Payment_Gateways.
 */
class Yatra_Settings_Payment_Gateways extends Yatra_Admin_Settings_Base
{

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'payment-gateways';
        $this->label = __('Payment Gateways', 'yatra');

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
        $settings = array();

        $status_page_url = admin_url('admin.php?page=yatra-status&tab=logs');

        if ('' === $current_section) {
            $settings = array(
                array(
                    'title' => __('Payment Gateways General Settings', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_payment_gateways_general_options',
                ),
                array(
                    'title' => __('Log payment gateway information', 'yatra'),
                    'desc' => sprintf(__('When you enable this option all payment gateway response and other payment information will be stored into <a href="%s" target="_blank">Yatra logging system.</a> <strong style="color:red;">Please enable this option only for debugging purpose.</strong>', 'yatra'), $status_page_url),
                    'id' => 'yatra_payment_gateway_enable_logging',
                    'type' => 'checkbox',
                    'default' => 'no',
                ),
                array(
                    'title' => __('Test Mode', 'yatra'),
                    'desc' => __(' While in test mode no live transactions are processed. To fully use test mode, you must have a sandbox (test) account for the payment gateway you are testing.', 'yatra'),
                    'id' => 'yatra_payment_gateway_test_mode',
                    'type' => 'checkbox',
                ),
                array(
                    'title' => __('Payment Gateways', 'yatra'),
                    'id' => 'yatra_payment_gateways',
                    'type' => 'multicheckbox',
                    'options' => yatra_get_payment_gateways()

                ),

                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_payment_gateways_general_options',
                ),

            );

        }

        return apply_filters('yatra_get_settings_' . $this->id, $settings, $current_section);
    }
}

return new Yatra_Settings_Payment_Gateways();
