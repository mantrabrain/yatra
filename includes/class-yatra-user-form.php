<?php

class Yatra_User_Form extends Yatra_Form
{
    private static $instance;


    public static function get_instance()
    {
        if (empty(self::$instance)) {

            self::$instance = new self();
        }
        return self::$instance;

    }

    public function default_field_keys()
    {
        return array_keys($this->default_fields());
    }

    public function system_fields()
    {
        return array(
            array(
                'title' => __('First Name', 'yatra'),
                'desc' => __('First name .', 'yatra'),
                'name' => 'first_name',
                'type' => 'text',

            ),
            array(
                'title' => __('Last Name', 'yatra'),
                'desc' => __('Last Name', 'yatra'),
                'name' => 'last_name',
                'type' => 'text',


            ), array(
                'title' => __('Email', 'yatra'),
                'desc' => __('Email', 'yatra'),
                'name' => 'email',
                'type' => 'email',
                'validation' => array(
                    // Rules => Messages
                    'required' => array(
                        'message' => __('Email field is required.', 'yatra'),
                    ),
                    'email' => array(
                        'message' => __('Invalid email field', 'yatra')
                    )

                )

            )
        );

    }

    public function default_fields()
    {
        return array(
            array(
                'title' => __('Date of birth', 'yatra'),
                'desc' => __('Date of birth.', 'yatra'),
                'name' => 'yatra_user_date_of_birth',
                'type' => 'text',
                'class' => 'yatra-date'

            ),
            array(
                'title' => __('Gender', 'yatra'),
                'desc' => __('Your gender', 'yatra'),
                'name' => 'yatra_user_gender',
                'type' => 'select',
                'class' => 'yatra-select2',
                'options' => array(
                    '-' => __('Select Gender', 'yatra'),
                    'Male' => __('Male', 'yatra'),
                    'Female' => __('Female', 'yatra')
                )

            ), array(
                'title' => __('Country', 'yatra'),
                'desc' => __('Country', 'yatra'),
                'name' => 'yatra_user_country',
                'type' => 'select',
                'class' => 'yatra-select2',
                'options' => yatra_get_countries()

            ), array(
                'title' => __('Phone Number', 'yatra'),
                'desc' => __('Country', 'yatra'),
                'name' => 'yatra_user_phone_number',
                'type' => 'text',

            ), array(
                'title' => __('Contact Address', 'yatra'),
                'desc' => __('Country', 'yatra'),
                'name' => 'yatra_user_contact_address',
                'type' => 'textarea',

            )
        );
    }

    public function fields()
    {
        $current_user_id = get_current_user_id();

        $user_data = get_userdata($current_user_id);

        $system_fields_with_value = array();

        $system_fields = $this->system_fields();

        foreach ($system_fields as $system_field) {

            $field = array();

            switch ($system_field['name']) {

                case "email":

                    $value = $user_data->user_email;

                    break;

                default:
                    $value = get_user_meta($current_user_id, $system_field['name'], true);
                    break;
            }

            $field = $system_field;

            $field['value'] = apply_filters('yatra_user_profile_field_' . $system_field['name'] . '_value', $value);

            array_push($system_fields_with_value, $field);
        }


        $custom_meta_field_value_array = array();

        $custom_meta_fields = $this->default_fields();

        foreach ($custom_meta_fields as $custom_meta_field) {

            $custom_field = array();

            $field_val = get_user_meta($current_user_id, $custom_meta_field['name'], true);

            $custom_field = $custom_meta_field;

            $custom_field['value'] = apply_filters('yatra_user_profile_field_' . $custom_meta_field['name'] . '_value', $field_val);

            array_push($custom_meta_field_value_array, $custom_field);
        }


        return apply_filters('yatra_user_profile_form_fields', array_merge($system_fields_with_value, $custom_meta_field_value_array));


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