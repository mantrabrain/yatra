<?php
defined('ABSPATH') || exit;

class Yatra_Change_Password_Form extends Yatra_Form
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
                'title' => __('Old Password', 'yatra'),
                'desc' => __('Date of birth.', 'yatra'),
                'name' => 'yatra_old_password',
                'type' => 'password',
                'validation' => array(
                    'required' => array(
                        'message' => __('Old password field is required.', 'yatra'),
                    ),


                )

            ),
            array(
                'title' => __('New Password', 'yatra'),
                'desc' => __('Date of birth.', 'yatra'),
                'name' => 'yatra_new_password',
                'type' => 'password',
                'validation' => array(
                    'required' => array(
                        'message' => __('New Password field is required.', 'yatra'),
                    ),


                )

            ),
            array(
                'title' => __('Confirm Password', 'yatra'),
                'desc' => __('Date of birth.', 'yatra'),
                'name' => 'yatra_confirm_password',
                'type' => 'password',
                'validation' => array(
                    'required' => array(
                        'message' => __('Confirm Password field is required.', 'yatra'),
                    ),
                    'equal_compare' => array(
                        'message' => __('Confirm password  not matched with old password', 'yatra'),
                        'rule' => 'yatra_new_password|yatra_confirm_password'

                    )

                )

            ),

        );
    }


    public function fields()
    {

        return apply_filters('yatra_change_password_form_fields', $this->default_fields());

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
        return $this->valid_data($data, $this->fields(), 'yatra_user_profile_update_message');
    }
}

