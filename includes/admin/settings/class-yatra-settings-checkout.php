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

if (class_exists('Yatra_Settings_Checkout', false)) {
    return new Yatra_Settings_Checkout();
}

/**
 * Yatra_Settings_Checkout.
 */
class Yatra_Settings_Checkout extends Yatra_Admin_Settings_Base
{

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->id = 'checkout';
        $this->label = __('Checkout', 'yatra');

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
            '' => __('Checkout Settings', 'yatra'),
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
                'title' => __('Checkout Settings', 'yatra'),
                'type' => 'title',
                'desc' => '',
                'id' => 'yatra_checkout_general_options',
            ),
            array(
                'title' => __('Enable Guest Checkout', 'yatra'),
                'desc' => __('This option allows you to checkout without login. User will not created if you tick this option..', 'yatra'),
                'id' => 'yatra_enable_guest_checkout',
                'type' => 'checkbox',
                'default' => 'yes',
            ),
            array(
                'title' => __('Show Terms on checkout', 'yatra'),
                'desc' => sprintf(__('Show terms and condition agree checkbox on checkout page. You can setup terms and conditions page from %s here %s', 'yatra'), "<a target='_blank' href='{$terms_setup_link}'>", '</a>'),
                'id' => 'yatra_checkout_show_agree_to_terms_policy',
                'type' => 'checkbox',
                'default' => 'no',
            ),
            array(
                'title' => __('Show Privacy Policy', 'yatra'),
                'desc' => sprintf(__('Show privacy policy agree checkbox on checkout page. You can setup privacy policy page from %s here %s', 'yatra'), "<a target='_blank' href='{$privacy_setup_link}'>", '</a>'),
                'id' => 'yatra_checkout_show_agree_to_privacy_policy',
                'type' => 'checkbox',
                'default' => 'no',
            ),
            array(
                'type' => 'sectionend',
                'id' => 'yatra_checkout_general_options',
            ),

        ), $current_section);
    }
}

return new Yatra_Settings_Checkout();
