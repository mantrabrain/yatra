<?php
/**
 * Abstract Payment Gateways.
 *
 * Handles different types of form for frontend
 *
 * @class       Yatra_Form
 * @version     2.0.5
 * @package     Yatra/Classes
 */

if (!defined('ABSPATH')) {
    exit;
}


abstract class Yatra_Payment_Gateways
{
    protected $settings = array();

    protected $id;

    abstract function admin_setting_tab();

    public function __construct($configuration)
    {
        $this->settings = isset($configuration['settings']) ? $configuration['settings'] : array();

        add_filter('yatra_payment_gateways', array($this, 'register_setting'), 10, 1);
        add_filter('yatra_get_sections_payment-gateways', array($this, 'subtab'), 10, 1);
        add_filter('yatra_get_settings_payment-gateways', array($this, 'payment_settings'), 10, 2);
        add_action('yatra_payment_checkout_payment_gateway_' . $this->id, array($this, 'process_payment'), 10, 2);
    }

    function register_setting($gateways)
    {
        $settings = isset($this->settings) ? $this->settings : array();

        if (count($settings) > 0) {

            $gateways[] = $settings;
        }

        return $gateways;
    }

    public function subtab($section)
    {

        $gateway_config = isset($this->settings) ? $this->settings : '';

        if (isset($gateway_config['title'])) {

            $section[$this->id] = $gateway_config['title'];
        }
        return $section;

    }

    public function payment_settings($settings = array(), $current_section = '')
    {

        if ($current_section == $this->id) {

            return apply_filters('yatra_settings_payment_gateways_' . $this->id, $this->admin_setting_tab());
        }
        return $settings;
    }

    abstract function process_payment($booking_id, $payment_id);

}
