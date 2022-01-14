<?php
defined('ABSPATH') || exit;

class Yatra_Checkout_Form extends Yatra_Form
{
    private static $instance;


    public static function get_instance()
    {
        if (empty(self::$instance)) {

            self::$instance = new self();
        }
        return self::$instance;

    }


    public function default_fields()
    {
        $country_list = yatra_get_countries();

        $countries = array_merge(
            array(
                '0' => __('Select Country', 'yatra')
            ),
            $country_list
        );

        return array(

            'fullname' => array(
                'name' => 'fullname',
                'title' => __('Your full name', 'yatra'),
                'type' => 'text',
                'value' => '',
                'extra_attributes' => array(
                    'placeholder' => __('Your full name', 'yatra'),
                    'required' => 'required'
                ),
                'validation' => array(
                    'required' => array(
                        'message' => __('Fullname field is required.', 'yatra'),
                    ),

                ),
                'group_id' => 'yatra_tour_customer_info',
            ),
            'email' => array(
                'name' => 'email',
                'title' => __('Email', 'yatra'),
                'type' => 'email',
                'value' => '',
                'group_id' => 'yatra_tour_customer_info',
                'extra_attributes' => array(
                    'placeholder' => __('Email address', 'yatra'),
                    'required' => 'required'
                ),

                'validation' => array(
                    'required' => array(
                        'message' => __('Email field is required.', 'yatra'),
                    ), 'email' => array(
                        'message' => __('Invalid email address.', 'yatra'),
                    ),

                ),
            ),
            'country' => array(
                'name' => 'country',
                'title' => __('Country', 'yatra'),
                'type' => 'select',
                'group_id' => 'yatra_tour_customer_info',
                'options' => $countries,
                'select2' => true
            ),
            'phone_number' => array(
                'name' => 'phone_number',
                'title' => __('Phone Number', 'yatra'),
                'type' => 'text',
                'group_id' => 'yatra_tour_customer_info',
                'value' => '',
                'extra_attributes' => array(
                    'placeholder' => __('Your contact number', 'yatra'),
                ),
            )
        );
    }


    public function fields()
    {
        return apply_filters('yatra_tour_checkout_form_fields', $this->default_fields());

    }

    public function render()
    {
        $form_fields = $this->fields();

        foreach ($form_fields as $field) {

            $this->form_html($field);
        }
    }

    public function get_data($data = array())
    {
        return $this->valid_data($data, $this->fields(), 'yatra_checkout_error_message');
    }
}

