<?php

class Yatra_User_Form extends Yatra_Form
{
    private function user_custom_meta()
    {
        $meta_config = array(
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
        return apply_filters('yatra_user_custom_meta', $meta_config);
    }

    private function user_system_meta()
    {
        $meta_config = array(
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

        return apply_filters('yatra_user_system_meta', $meta_config);

    }

    public function get_user_profile_form_fields($include_system = true)
    {
        $current_user_id = get_current_user_id();

        $user_data = get_userdata($current_user_id);

        if ($include_system) {

            $system_fields_with_value = array();

            $system_fields = $this->user_system_meta();

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


        }


        $custom_meta_field_value_array = array();

        $custom_meta_fields = $this->user_custom_meta();

        foreach ($custom_meta_fields as $custom_meta_field) {

            $custom_field = array();

            $field_val = get_user_meta($current_user_id, $custom_meta_field['name'], true);


            $custom_field = $custom_meta_field;

            $custom_field['value'] = apply_filters('yatra_user_profile_field_' . $custom_meta_field['name'] . '_value', $field_val);

            array_push($custom_meta_field_value_array, $custom_field);
        }

        if ($include_system) {

            return array_merge($system_fields_with_value, $custom_meta_field_value_array);
        }
        return $custom_meta_field_value_array;

    }

    public function edit_profile_form_fields()
    {
        $all_form_fields = $this->get_user_profile_form_fields();

        foreach ($all_form_fields as $field) {

            $this->form_html($field);
        }

    }

    public function valid_profile_form_data($data = array())
    {
        return $this->valid_data($data, $this->get_user_profile_form_fields());

    }

    public function user_custom_meta_keys()
    {
        return array_keys($this->user_custom_meta());
    }

    private function change_password_fields()
    {

        $all_form_fields = array(
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
        return apply_filters('yatra_change_password_form_fields', $all_form_fields);
    }

    public function change_password_form_fields()
    {
        $all_form_fields = $this->change_password_fields();


        foreach ($all_form_fields as $field) {

            $this->form_html($field);
        }


    }


    public function valid_change_password_form_data($data = array())
    {
        return $this->valid_data($data, $this->change_password_fields());

    }


}