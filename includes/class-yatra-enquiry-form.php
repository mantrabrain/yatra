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
                    'wrap_class' => 'yatra-left',
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
                    'row_start' => true,
                ),
                'email' => array(
                    'name' => 'email',
                    'title' => __('Email', 'yatra'),
                    'type' => 'email',
                    'value' => '',
                    'group_id' => 'yatra_tour_customer_info',
                    'wrap_class' => 'yatra-left',
                    'extra_attributes' => array(
                        'placeholder' => __('Email address', 'yatra'),
                        'required' => 'required'
                    ),

                    'row_end' => true,
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
                    'wrap_class' => 'yatra-left',
                    'row_start' => true,
                    'select2' => true
                ),
                'phone_number' => array(
                    'name' => 'phone_number',
                    'title' => __('Phone Number', 'yatra'),
                    'type' => 'text',
                    'group_id' => 'yatra_tour_customer_info',
                    'value' => '',
                    'wrap_class' => 'yatra-left',
                    'extra_attributes' => array(
                        'placeholder' => __('Your contact number', 'yatra'),
                    ),
                    'row_end' => true,
                ),
                'number_of_adults' => array(
                    'name' => 'phone_number',
                    'title' => __('Phone Number', 'yatra'),
                    'type' => 'text',
                    'group_id' => 'yatra_tour_customer_info',
                    'value' => '',
                    'wrap_class' => 'yatra-left',
                    'extra_attributes' => array(
                        'placeholder' => __('Your contact number', 'yatra'),
                    ),
                    'row_end' => true,
                ),
                'number_of_children' => array(
                    'name' => 'number_of_children',
                    'title' => __('Phone Number', 'yatra'),
                    'type' => 'text',
                    'group_id' => 'yatra_tour_customer_info',
                    'value' => '',
                    'wrap_class' => 'yatra-left',
                    'extra_attributes' => array(
                        'placeholder' => __('Your contact number', 'yatra'),
                    ),
                    'row_end' => true,
                ),
                'message' => array(
                    'name' => 'message',
                    'title' => __('Phone Number', 'yatra'),
                    'type' => 'text',
                    'group_id' => 'yatra_tour_customer_info',
                    'value' => '',
                    'wrap_class' => 'yatra-left',
                    'extra_attributes' => array(
                        'placeholder' => __('Your contact number', 'yatra'),
                    ),
                    'row_end' => true,
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

