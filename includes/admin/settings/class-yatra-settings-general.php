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

if (class_exists('Yatra_Settings_General', false)) {
    return new Yatra_Settings_General();
}

/**
 * Yatra_Settings_General.
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
     * Get sections.
     *
     * @return array
     */
    public function get_sections()
    {
        $sections = array(
            '' => __('General', 'yatra'),
            'pages' => __('Pages', 'yatra'),
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
        if ('pages' === $current_section) {
            $settings = array(
                array(
                    'title' => __('Page Settings', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_pages_options',
                ),

                array(
                    'title' => __('Cart Page', 'yatra'),
                    'desc' => __('Cart page for tour booking', 'yatra'),
                    'id' => 'yatra_cart_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('Checkout Page', 'yatra'),
                    'desc' => __('Checkout page for tour booking', 'yatra'),
                    'id' => 'yatra_checkout_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('My Account Page', 'yatra'),
                    'desc' => __('My Account Page', 'yatra'),
                    'id' => 'yatra_my_account_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('Thank you page', 'yatra'),
                    'desc' => __('Thank you page after tour booking completed.', 'yatra'),
                    'id' => 'yatra_thankyou_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('Transaction failed page', 'yatra'),
                    'desc' => __('This is the page buyers are sent to if their transaction is cancelled or fails', 'yatra'),
                    'id' => 'yatra_failed_transaction_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('Terms and conditions page', 'yatra'),
                    'desc' => __('Page for your terms and condition.', 'yatra'),
                    'id' => 'yatra_termsandconditions_page',
                    'type' => 'single_select_page',
                ),

                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_pages_options',
                ),

            );

        } else {
            $settings = array(
                array(
                    'title' => __('General Settings', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_general_options',
                ),
                array(
                    'title' => __('Currency & symbol', 'yatra'),
                    'desc' => __('Currency for price of tour and other pricing parts.', 'yatra'),
                    'id' => 'yatra_currency',
                    'default' => 'USD',
                    'type' => 'select',
                    'options' => yatra_get_currency_with_symbol()
                ),
                array(
                    'title' => __('Book Now Button Text', 'yatra'),
                    'desc' => __('Text for Book now button.', 'yatra'),
                    'id' => 'yatra_booknow_button_text',
                    'default' => __('Book Now', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Book Now loading text', 'yatra'),
                    'desc' => __('Text for loading book now button.', 'yatra'),
                    'id' => 'yatra_booknow_loading_text',
                    'default' => __('Loading....', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Booking Form Title', 'yatra'),
                    'desc' => __('Title for booking form', 'yatra'),
                    'id' => 'yatra_booking_form_title_text',
                    'default' => __('Booking Form', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Enquiry Form Title', 'yatra'),
                    'desc' => __('Title for enquiry form', 'yatra'),
                    'id' => 'yatra_enquiry_form_title_text',
                    'default' => __('Enquiry Form', 'yatra'),
                    'type' => 'text',
                ),

                array(
                    'title' => __('Enquiry Button Text', 'yatra'),
                    'desc' => __('Enquiry Button Text', 'yatra'),
                    'id' => 'yatra_enquiry_button_text',
                    'default' => __('Send Enquiry', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Select Date Title', 'yatra'),
                    'desc' => __('Select Date Title', 'yatra'),
                    'id' => 'yatra_select_date_title',
                    'default' => __('Please select date', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Attributes Title', 'yatra'),
                    'desc' => __('Title for custom attributes', 'yatra'),
                    'id' => 'yatra_custom_attributes_title_text',
                    'default' => __('Attributes', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Update cart button text', 'yatra'),
                    'desc' => __('Text for update cart button', 'yatra'),
                    'id' => 'yatra_update_cart_text',
                    'default' => __('Update Cart', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Proceed to checkout text', 'yatra'),
                    'desc' => __('Text for proceed to checkout button.', 'yatra'),
                    'id' => 'yatra_proceed_to_checkout_text',
                    'default' => __('Proceed to checkout', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Order booking text', 'yatra'),
                    'desc' => __('Text for order booking text.', 'yatra'),
                    'id' => 'yatra_order_booking_text',
                    'default' => __('Order Booking', 'yatra'),
                    'type' => 'text',
                ),

                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_general_options',
                ),

            );
        }

        return apply_filters('yatra_get_settings_' . $this->id, $settings, $current_section);
    }
}

return new Yatra_Settings_General();
