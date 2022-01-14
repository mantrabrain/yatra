<?php
defined('ABSPATH') || exit;

class Yatra_Create_Account_Form extends Yatra_Form
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
        return array(
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
    }


    public function fields()
    {
        return apply_filters('yatra_create_account_on_checkout_form_fields', $this->default_fields());

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
        return $this->valid_data($data, $this->fields(), 'yatra_registration_error_message');
    }
}

