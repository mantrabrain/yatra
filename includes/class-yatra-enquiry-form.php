<?php
defined('ABSPATH') || exit;

class Yatra_Enquiry_Form extends Yatra_Form
{
    private static $instance;


    public static function get_instance()
    {
        if (empty(self::$instance)) {

            self::$instance = new self();
        }
        return self::$instance;

    }

    public function get_form_fields()
    {
        $country_list = yatra_get_countries();

        $countries = array_merge(
            array(
                '0' => __('Select Country', 'yatra')
            ),
            $country_list
        );


        $form_fields = apply_filters('tour_checkout_form_fields', array(

                'fullname' => array(
                    'name' => 'fullname',
                    'title' => __('Full Name', 'yatra'),
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
                ),
                'email' => array(
                    'name' => 'email',
                    'title' => __('Email', 'yatra'),
                    'type' => 'email',
                    'value' => '',
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
                    'options' => $countries,
                    'select2' => true
                ),
                'phone_number' => array(
                    'name' => 'phone_number',
                    'title' => __('Phone Number', 'yatra'),
                    'type' => 'text',
                    'value' => '',
                    'extra_attributes' => array(
                        'placeholder' => __('Your contact number', 'yatra'),
                    ),
                ),
                'number_of_adults' => array(
                    'name' => 'phone_number',
                    'title' => __('Number of Adults', 'yatra'),
                    'type' => 'text',
                    'value' => '',
                    'extra_attributes' => array(
                        'placeholder' => __('Number of Adults', 'yatra'),
                    ),
                ),
                'number_of_children' => array(
                    'name' => 'number_of_children',
                    'title' => __('Number of Children', 'yatra'),
                    'type' => 'text',
                    'value' => '',
                    'extra_attributes' => array(
                        'placeholder' => __('Number of Children', 'yatra'),
                    ),
                ),
                'message' => array(
                    'name' => 'message',
                    'title' => __('Message', 'yatra'),
                    'type' => 'textarea',
                    'value' => '',
                    'extra_attributes' => array(
                        'placeholder' => __('Message', 'yatra'),
                        'cols' => 8,
                        'rows' => 8
                    ),
                )
            )
        );
        return $form_fields;
    }


    public function get_form()
    {

        $form_fields = $this->get_form_fields();

        foreach ($form_fields as $field) {

            $this->form_html($field);
        }
    }

    public function validate($data = array())
    {
        return $this->valid_data($data, $this->get_form_fields());

    }

}

