<?php

class Yatra_Tour
{
    private static $instance;

    private $ID;

    public static function get_instance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self;
        }
        self::$instance->maybe_initialize();

        return self::$instance;
    }

    public function maybe_initialize($tourID = null)
    {
        if (!is_null($tourID)) {

            $this->ID = $tourID;

            return;
        }

        if (is_null($this->ID) || $this->ID === 0) {

            global $post;


            $this->ID = isset($post->ID) ? $post->ID : 0;

        }

    }

    public function maybe_flush()
    {
        $this->ID = null;
    }

    public function get_id()
    {
        return $this->ID;
    }

    public function get_the_title()
    {
        return get_the_title($this->ID);
    }

    public function get_the_content()
    {
        return get_the_content($this->ID);
    }

    public function get_pricing($number_of_people = null)
    {
        $meta_regular_price = get_post_meta($this->ID, 'yatra_tour_meta_regular_price', true);
        $meta_sales_price = get_post_meta($this->ID, 'yatra_tour_meta_sales_price', true);
        $meta_pricing_label = sanitize_text_field(get_post_meta($this->ID, 'yatra_tour_meta_pricing_label', true));
        $meta_pricing_description = sanitize_text_field(get_post_meta($this->ID, 'yatra_tour_meta_pricing_description', true));
        $multiple_pricing = get_post_meta($this->ID, 'yatra_multiple_pricing', true);
        $meta_price_per = get_post_meta($this->ID, 'yatra_tour_meta_price_per', true);
        $meta_group_size = get_post_meta($this->ID, 'yatra_tour_meta_group_size', true);
        $meta_minimum_pax = get_post_meta($this->ID, 'yatra_tour_minimum_pax', true);
        $meta_maximum_pax = get_post_meta($this->ID, 'yatra_tour_maximum_pax', true);

        $final_pricing_details = array();
        if (is_array($multiple_pricing)) {
            if (count($multiple_pricing) > 0) {
                foreach ($multiple_pricing as $pricing_id => $pricing) {
                    $variable_group_size = $pricing['price_per'] === '' ? $meta_group_size : $pricing['group_size'];
                    $variable_pricing_per = $pricing['price_per'] === '' ? $meta_price_per : $pricing['price_per'];
                    $variable_minimum_pax = $pricing['minimum_pax'] == '' ? $meta_minimum_pax : $pricing['minimum_pax'];
                    $variable_maximum_pax = $pricing['maximum_pax'] == '' ? $meta_maximum_pax : $pricing['maximum_pax'];
                    $regular_price = $pricing['regular_price'];
                    $sales_price = $pricing['sales_price'];
                    $final_price = '' != $sales_price ? $sales_price : $regular_price;
                    $person_count = '' != $variable_minimum_pax ? absint($variable_minimum_pax) : 1;
                    $person_count = is_array($number_of_people) && isset($number_of_people[$pricing_id]) ? absint($number_of_people[$pricing_id]) : $person_count;
                    //$person_count = $person_count == 0 ? 0 : $person_count;
                    $number_of_person = $person_count;
                    $person_count = $variable_pricing_per == 'person' ? $person_count : ceil($person_count / $variable_group_size);


                    $final_pricing_details[$pricing_id] = array(
                        'pricing_type' => "multi",
                        'pricing_label' => $pricing['pricing_label'],
                        'pricing_description' => $pricing['pricing_description'],
                        'minimum_pax' => $variable_minimum_pax,
                        'maximum_pax' => $variable_maximum_pax,
                        'pricing_per' => $variable_pricing_per,
                        'group_size' => $variable_group_size,
                        'number_of_person' => $number_of_person,
                        'regular_price' => $regular_price * $person_count,
                        'sales_price' => $sales_price,
                        'final_price' => $final_price * $person_count

                    );
                }
                return apply_filters('yatra_tour_final_pricing_details', $final_pricing_details);
            }
        }
        $regular_price = $meta_regular_price;
        $sales_price = $meta_sales_price;
        $final_price = '' != $sales_price ? $sales_price : $regular_price;
        $person_count = '' != $meta_minimum_pax ? absint($meta_minimum_pax) : 1;
        $person_count = !is_array($number_of_people) && !is_null($number_of_people) ? absint($number_of_people) : $person_count;
        //$person_count = $person_count == 0 ? 1 : $person_count;
        $number_of_person = $person_count;
        $person_count = $meta_price_per == 'person' ? $person_count : ceil($person_count / $meta_group_size);
        $final_pricing_details[] = array(
            'pricing_type' => "single",
            'pricing_label' => $meta_pricing_label,
            'pricing_description' => $meta_pricing_description,
            'minimum_pax' => $meta_minimum_pax,
            'maximum_pax' => $meta_maximum_pax,
            'pricing_per' => $meta_price_per,
            'group_size' => $meta_group_size,
            'number_of_person' => $number_of_person,
            'regular_price' => $regular_price * $person_count,
            'sales_price' => $sales_price,
            'final_price' => $final_price * $person_count
        );
        return apply_filters('yatra_tour_final_pricing_details', $final_pricing_details);
    }

    public function get_final_price($tour_id = null, $number_of_people = null)
    {
        $this->maybe_initialize($tour_id);

        $pricings = $this->get_pricing($number_of_people);

        $final_price_amount = 0;

        foreach ($pricings as $pricing) {

            $final_price = $pricing['final_price'];

            $final_price_amount += $final_price;
        }
        if (is_null($tour_id)) {
            $this->maybe_flush();
        }

        return $final_price_amount;


    }

    public function get_pricing_type()
    {
        $multiple_pricing = get_post_meta($this->ID, 'yatra_multiple_pricing', true);

        if (is_array($multiple_pricing)) {

            if (count($multiple_pricing) > 0) {

                return 'multi';
            }
        }
        return 'single';

    }

    public function update_availability($start_date, $end_date, $yatra_availability, $yatra_pricing)
    {

        $start_date = sanitize_text_field($start_date);

        $end_date = sanitize_text_field($end_date);

        $begin = new DateTime($start_date);

        $end = new DateTime($end_date);

        $user_id = get_current_user_id();

        $activate = isset($yatra_availability['activate']) ? (boolean)$yatra_availability['activate'] : false;

        $pricing_type = isset($yatra_availability['pricing_type']) ? sanitize_text_field($yatra_availability['pricing_type']) : 'single';

        $max_traveller = isset($yatra_availability['max_travellers']) ? yatra_maybeintempty($yatra_availability['max_travellers']) : '';

        $availability_for = isset($yatra_availability['availability_for']) ? sanitize_text_field($yatra_availability['availability_for']) : '';

        $yatra_final_pricing = array();

        $status = false;

        foreach ($yatra_pricing as $pricing_index => $pricing) {

            $yatra_final_pricing_single = array(
                'pricing_label' => isset($pricing['pricing_label']) ? sanitize_text_field($pricing['pricing_label']) : '',
                'pricing_description' => isset($pricing['pricing_description']) ? sanitize_text_field($pricing['pricing_description']) : '',
                'pricing_per' => isset($pricing['pricing_per']) ? sanitize_text_field($pricing['pricing_per']) : 'single',
                'group_size' => isset($pricing['group_size']) ? yatra_maybeintempty($pricing['group_size']) : '',
                'regular_price' => isset($pricing['regular_price']) ? yatra_maybeintempty($pricing['regular_price']) : '',
                'sales_price' => isset($pricing['sales_price']) ? yatra_maybeintempty($pricing['sales_price']) : '',
                'minimum_pax' => isset($pricing['minimum_pax']) ? yatra_maybeintempty($pricing['minimum_pax']) : '',
                'maximum_pax' => isset($pricing['maximum_pax']) ? yatra_maybeintempty($pricing['maximum_pax']) : '',

            );
            if ($pricing_type === "single" || $pricing_index === "0") {

                $yatra_final_pricing = $yatra_final_pricing_single;

            } else {

                $yatra_final_pricing[$pricing_index] = $yatra_final_pricing_single;

            }
        }

        $slot_group_data = Yatra_Core_DB::get_data('tour_dates', array(
            'slot_group_id'
        ), array(), array(
            'order_by' => 'slot_group_id',
            'order' => 'DESC',
            'offset' => '0',
            'limit' => '1'
        ));


        $slot_group_id = isset($slot_group_data[0]) ? absint($slot_group_data[0]->slot_group_id) : 1;

        $slot_group_id = $slot_group_id + 1;

        for ($date_i = $begin; $date_i <= $end; $date_i->modify('+1 day')) {

            $start_date_value = $date_i->format("Y-m-d H:i:s");

            $end_date_value = $date_i->format("Y-m-d 23:59:59");

            $where = array(
                'start_date' => $start_date_value,
                'end_date' => $end_date_value,
                'tour_id' => $this->ID
            );

            $update_ignore = array('start_date', 'end_date', 'tour_id', 'created_at', 'created_by', 'booked_travellers');

            $save_ignore = array('booked_travellers');

            $data = array(
                'tour_id' => $this->ID,
                'slot_group_id' => $slot_group_id,
                'start_date' => $start_date_value,
                'end_date' => $end_date_value,
                'pricing' => json_encode($yatra_final_pricing),
                'pricing_type' => $pricing_type,
                'max_travellers' => $max_traveller,
                'booked_travellers' => '',
                'active' => $activate,
                'availability' => $availability_for,
                'note_to_customer' => '',
                'note_to_admin' => '',
                'created_by' => $user_id,
                'updated_by' => $user_id,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            );

            if (Yatra_Core_DB::data_exists('tour_dates', $where)) {

                $action_status = Yatra_Core_DB::update_data('tour_dates', $data, $where, $update_ignore);


            } else {

                $action_status = Yatra_Core_DB::save_data('tour_dates', $data, $save_ignore);


            }

            $status = !$status ? $action_status : $status;

        }
        return $status;

    }

    private function get_pricing_item($single_pricing, $pricing_key, $number_of_people)
    {
        $regular_price = isset($single_pricing['regular_price']) ? $single_pricing['regular_price'] : '';
        $sales_price = isset($single_pricing['sales_price']) ? $single_pricing['sales_price'] : '';
        $minimum_pax = isset($single_pricing['minimum_pax']) ? $single_pricing['minimum_pax'] : '';
        $pricing_per = isset($single_pricing['pricing_per']) ? $single_pricing['pricing_per'] : 'person';
        $group_size = isset($single_pricing['group_size']) ? $single_pricing['group_size'] : '';
        $group_size = absint($group_size) < 1 ? 1 : absint($group_size);
        $final_price = '' != $sales_price ? $sales_price : $regular_price;
        $person_count = '' != $minimum_pax ? absint($minimum_pax) : 1;
        if (!is_array($number_of_people) && !is_null($number_of_people)) {
            $person_count = absint($number_of_people);
        } else if (is_array($number_of_people) && '' != $pricing_key && isset($number_of_people[$pricing_key])) {
            $person_count = absint($number_of_people[$pricing_key]);
        }
        $number_of_person = $person_count;
        $person_count = $pricing_per == 'person' ? $person_count : ceil($person_count / $group_size);
        $single_pricing['number_of_person'] = $number_of_person;
        $single_pricing['regular_price'] = $regular_price * $person_count;
        $single_pricing['sales_price'] = $sales_price;
        $single_pricing['final_price'] = $final_price * $person_count;

        return $single_pricing;
    }

    public function get_availability_pricing($number_of_people, $start_date, $end_date, $return_fields = array(), $tour_id = null)
    {
        if (!is_null($tour_id)) {
            $this->ID = $tour_id;
        }

        if (is_null($this->ID)) {
            return array();
        }
        $start_date = $start_date . ' 00:00:00';

        $end_date = $end_date . ' 23:59:59';

        $availability_data = Yatra_Core_DB::get_data('tour_dates', array(
            'start_date',
            'end_date',
            'pricing',
            'pricing_type',
            'max_travellers',
            'booked_travellers',
            'active',
            'availability',
            'note_to_customer',
            'note_to_admin'

        ), array(
            'start_date |>=' => $start_date,
            'end_date |<=' => $end_date,
            'tour_id' => $this->ID
        ));

        $final_availability_data = array();

        foreach ($availability_data as $single_availability_data) {

            $all_pricing_data_array = yatra_maybe_json_decode($single_availability_data->pricing, true);

            if ($single_availability_data->pricing_type == "single") {

                $single_availability_data->pricing = array($this->get_pricing_item($all_pricing_data_array, '', $number_of_people));

            } else {
                $pricing_array = array();

                foreach ($all_pricing_data_array as $pricing_id => $pricing_item) {

                    $pricing_array[$pricing_id] = $this->get_pricing_item($pricing_item, $pricing_id, $number_of_people);

                }

                $single_availability_data->pricing = $pricing_array;
            }


            $final_availability_data[str_replace(' ', '', $single_availability_data->start_date . '_' . $single_availability_data->end_date)] = (array)$single_availability_data;
        }

        return $final_availability_data;
    }

}