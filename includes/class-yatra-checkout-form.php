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

    public function chekcout_form_fields()
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
                    'title' => __('Your full name', 'yatra'),
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
                )
            )
        );
        return $form_fields;
    }


    public function tour_checkout_form()
    {

        $form_fields = $this->chekcout_form_fields();

        foreach ($form_fields as $field) {

            $this->form_html($field);
        }
    }

    public function valid_tour_checkout_form($data = array())
    {
        return $this->valid_data($data, $this->chekcout_form_fields());

    }

    private function create_account_checkout_fields()
    {

        $all_form_fields = array(
            array(
                'title' => __('Username', 'yatra'),
                'desc' => __('This is used to login your account.', 'yatra'),
                'name' => 'yatra_username',
                'type' => 'text',
                'extra_attributes' => array(
                    'placeholder' => __('Username - This is can be used to login your account', 'yatra'),
                    'required' => 'required'
                ),
                'validation' => array(
                    'required' => array(
                        'message' => __('Usename is required', 'yatra'),
                    ),


                )

            ), array(
                'title' => __('Email', 'yatra'),
                'desc' => __('Email address.', 'yatra'),
                'name' => 'yatra_email',
                'type' => 'text',
                'extra_attributes' => array(
                    'placeholder' => __('Your email address', 'yatra'),
                    'required' => 'required'
                ),
                'validation' => array(
                    'required' => array(
                        'message' => __('Email is required', 'yatra'),
                    ),
                    'email' => array(
                        'message' => __('Invalid email address', 'yatra'),
                    ),


                )

            ),
            array(
                'title' => __('Password', 'yatra'),
                'desc' => __('Password.', 'yatra'),
                'name' => 'yatra_password',
                'type' => 'password',
                'extra_attributes' => array(
                    'required' => 'required'
                ),
                'validation' => array(
                    'required' => array(
                        'message' => __('Password field is required.', 'yatra'),
                    ),


                )

            ),
            array(
                'title' => __('Confirm Password', 'yatra'),
                'desc' => __('Date of birth.', 'yatra'),
                'name' => 'yatra_confirm_password',
                'type' => 'password',
                'extra_attributes' => array(
                    'required' => 'required'
                ),
                'validation' => array(
                    'required' => array(
                        'message' => __('Confirm Password field is required.', 'yatra'),
                    ),
                    'equal_compare' => array(
                        'message' => __('Confirm password  doesn\'t matched with password', 'yatra'),
                        'rule' => 'yatra_password|yatra_confirm_password'

                    )

                )

            ),

        );
        return apply_filters('yatra_create_account_on_checkout_form_fields', $all_form_fields);
    }

    public function create_account_checkout_form_fields()
    {
        $all_form_fields = $this->create_account_checkout_fields();


        foreach ($all_form_fields as $field) {

            $this->form_html($field);
        }


    }

    public function create_account_valid_form_data($data = array())
    {
        return $this->valid_data($data, $this->create_account_checkout_fields());

    }

}

