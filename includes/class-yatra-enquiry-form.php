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


    public function save_enquiry($post_data = array())
    {
        $tour_id = $post_data['tour_id'] ? absint($post_data['tour_id']) : '';

        $valid_data = $this->get_data($post_data);

        $valid_data['tour_id'] = $tour_id;

        $valid_data['created_at'] = current_time('mysql');

        $valid_data['subject'] = 'Tour Booking Enquiry';

        $valid_data['ip_address'] = sanitize_text_field(yatra_get_visitor_ip_address());

        if (yatra()->yatra_error->has_errors()) {
            return false;
        }
        do_action('yatra_enquiry_response_before_saved', $valid_data);

        $status = Yatra_Core_DB::save_data(Yatra_Tables::TOUR_ENQUIRIES, $valid_data);

        do_action('yatra_enquiry_response_after_saved', $valid_data, $status);

        return $status;

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
                'name' => 'number_of_adults',
                'title' => __('Number of Adults', 'yatra'),
                'type' => 'number',
                'value' => '',
                'extra_attributes' => array(
                    'placeholder' => __('Number of Adults', 'yatra'),
                ),
            ),
            'number_of_childs' => array(
                'name' => 'number_of_childs',
                'title' => __('Number of Children', 'yatra'),
                'type' => 'number',
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
                'allowed_tags' => array()
            )
        );
    }

    public function render()
    {
        $form_fields = $this->fields();

        foreach ($form_fields as $field) {

            $this->form_html($field);
        }
    }

    public function fields()
    {
        return apply_filters('yatra_tour_enquiry_form_fields', $this->default_fields());
    }

    public function get_data($data = array())
    {
        return $this->valid_data($data, $this->fields());
    }
}

