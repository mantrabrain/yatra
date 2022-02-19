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
                    'desc_tip' => true,
                    'id' => 'yatra_cart_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('Checkout Page', 'yatra'),
                    'desc' => __('Checkout page for tour booking', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_checkout_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('My Account Page', 'yatra'),
                    'desc' => __('My Account Page', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_my_account_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('Thank you page', 'yatra'),
                    'desc' => __('Thank you page after tour booking completed.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_thankyou_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('Transaction failed page', 'yatra'),
                    'desc' => __('This is the page buyers are sent to if their transaction is cancelled or fails', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_failed_transaction_page',
                    'type' => 'single_select_page',
                ),
                array(
                    'title' => __('Terms and conditions', 'yatra'),
                    'desc' => __('Page for your terms and condition.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_terms_and_conditions_page',
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
                    'title' => __('Book Now Button Text', 'yatra'),
                    'desc' => __('Text for Book now button.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_booknow_button_text',
                    'default' => __('Book Now', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Book Now loading text', 'yatra'),
                    'desc' => __('Text for loading book now button.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_booknow_loading_text',
                    'default' => __('Loading....', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Booking Form Title', 'yatra'),
                    'desc' => __('Title for booking form', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_booking_form_title_text',
                    'default' => __('Booking Form', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Enquiry Form Title', 'yatra'),
                    'desc' => __('Title for enquiry form', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_enquiry_form_title_text',
                    'default' => __('Enquiry Form', 'yatra'),
                    'type' => 'text',
                ),

                array(
                    'title' => __('Enquiry Button Text', 'yatra'),
                    'desc' => __('Enquiry Button Text', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_enquiry_button_text',
                    'default' => __('Send Enquiry', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Select Date Title', 'yatra'),
                    'desc' => __('Select Date Title', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_select_date_title',
                    'default' => __('Please select date', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Available Travellers Text', 'yatra'),
                    'desc' => __('Available Travellers Text on calendar', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_available_travellers_text',
                    'default' => __('Available Travellers :', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Available For Booking Text', 'yatra'),
                    'desc' => __('Available for Booking Text', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_available_for_booking_text',
                    'default' => __('Available For Booking', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Available For Enquiry Text', 'yatra'),
                    'desc' => __('Available for Enquiry Text', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_available_for_enquiry_text',
                    'default' => __('Available For Enquiry Only', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Not Available Text', 'yatra'),
                    'desc' => __('Not Available for booking & enquiry text', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_not_available_for_booking_enquiry_text',
                    'default' => __('Not Available For Booking & Enquiry', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Attributes Title', 'yatra'),
                    'desc' => __('Title for custom attributes', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_custom_attributes_title_text',
                    'default' => __('Attributes', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Update cart button text', 'yatra'),
                    'desc' => __('Text for update cart button', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_update_cart_text',
                    'default' => __('Update Cart', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Proceed to checkout text', 'yatra'),
                    'desc' => __('Text for proceed to checkout button.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_proceed_to_checkout_text',
                    'default' => __('Proceed to checkout', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Order booking text', 'yatra'),
                    'desc' => __('Text for order booking text.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_order_booking_text',
                    'default' => __('Order Booking', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Terms and condition label', 'yatra'),
                    'desc' => __('This text will show on terms and conditions agreement label.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_terms_and_conditions_agree_label',
                    'default' => __('Agree to Terms and conditions?', 'yatra'),
                    'type' => 'text',
                ),
                array(
                    'title' => __('Privacy policy label', 'yatra'),
                    'desc' => __('This text will show on privacy policy agreement label.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_privacy_policy_agree_label',
                    'default' => __('Agree to Privacy Policy?', 'yatra'),
                    'type' => 'text',
                ),

                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_general_options',
                ),
                array(
                    'title' => __('Currency Options', 'yatra'),
                    'type' => 'title',
                    'desc' => '',
                    'id' => 'yatra_general_currency_options',
                ),


                array(
                    'title' => __('Currency', 'yatra'),
                    'desc' => __('Currency for price of tour and other pricing parts.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_currency',
                    'default' => 'USD',
                    'type' => 'select',
                    'options' => yatra_get_currency_with_symbol()
                ),
                array(
                    'title' => __('Currency Symbol Type', 'yatra'),
                    'desc' => __('Currency Symbol type', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_currency_symbol_type',
                    'default' => 'symbol',
                    'type' => 'select',
                    'options' => array(
                        'code' => __('Currency Code', 'yatra'),
                        'symbol' => __('Currency Symbol', 'yatra')
                    ),
                ),
                array(
                    'title' => __('Currency symbol/code position', 'yatra'),
                    'desc' => __('Currency symbol position.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_currency_position',
                    'default' => 'left',
                    'type' => 'select',
                    'options' => yatra_get_currency_positions()
                ),
                array(
                    'title' => __('Thousand Separator', 'yatra'),
                    'desc' => __('Thousand separator for price.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_thousand_separator',
                    'default' => ',',
                    'type' => 'text',
                ),
                array(
                    'title' => __('Number of Decimals', 'yatra'),
                    'desc' => __('Number of decimals shown in price.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_price_number_decimals',
                    'default' => 2,
                    'type' => 'number',
                ),
                array(
                    'title' => __('Decimal Separator', 'yatra'),
                    'desc' => __('Decimal separator for price.', 'yatra'),
                    'desc_tip' => true,
                    'id' => 'yatra_decimal_separator',
                    'default' => '.',
                    'type' => 'text',
                ),
                array(
                    'type' => 'sectionend',
                    'id' => 'yatra_general_currency_options',
                ),

            );
        }

        return apply_filters('yatra_get_settings_' . $this->id, $settings, $current_section);
    }
}

return new Yatra_Settings_General();
