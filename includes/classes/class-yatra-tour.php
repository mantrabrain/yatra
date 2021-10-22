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
                        'type' => "multi",
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
                return $final_pricing_details;
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
            'type' => "single",
            'pricing_label' => $meta_price_per === 'group' ? 'Group' : 'Person',
            'pricing_description' => '',
            'minimum_pax' => $meta_minimum_pax,
            'maximum_pax' => $meta_maximum_pax,
            'pricing_per' => $meta_price_per,
            'group_size' => $meta_group_size,
            'number_of_person' => $number_of_person,
            'regular_price' => $regular_price * $person_count,
            'sales_price' => $sales_price,
            'final_price' => $final_price * $person_count
        );
        return $final_pricing_details;
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
        $start_date = sanitize_text_field($start_date) . ' 00:00:00';

        $end_date = sanitize_text_field($end_date) . ' 00:00:00';

        $begin = new DateTime($start_date);

        $end = new DateTime($end_date);

        $user_id = get_current_user_id();

        for ($date = $begin; $date <= $end; $date->modify('+1 day')) {

            $start_date_value = $date->format("Y-m-d H:i:s");

            $end_date_value = $date->format("Y-m-d H:i:s");

            $where = array(
                'start_date',
                'end_date',
                'tour_id'
            );

            $update_ignore = array('start_date', 'end_date', 'tour_id', 'created_at');

            $save_ignore = array('updated_by', 'created_at');

            $data = array(
                'tour_id' => $this->ID,
                'slot_group_id' => 3,
                'start_date' => $start_date_value,
                'end_date' => $end_date_value,
                'price' => 512.00,
                'pricing' => 'pricing_text',
                'pricing_type' => 'single',
                'max_travellers' => 20,
                'active' => 1,
                'availability' => 'booking',
                'note_to_customer' => 'note',
                'note_to_admin' => 'note to admin',
                'created_by' => $user_id,
                'updated_by' => $user_id,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            );
            if (Yatra_Core_DB::data_exists('tour_dates', $data, $where)) {
                // Upudate
            } else {

                Yatra_Core_DB::save_data($data);
            }
        }


        exit;
        $yatra_availability_defaults = array(
            'tour_id' => null,
            'slot_group_id' => null,
            'start_date' => $start_date . ' 00:00:00',
            'end_date' => $end_date . ' 00:00:00',
            'price' => null,
            'pricing' => null,
            'pricing_type' => null,
            'max_travellers' => null,
            'active' => 1,
            'availability' => null,
            'note_to_customer' => null,
            'note_to_admin' => null,
            'created_by' => get_current_user_id(),
            'updated_by' => get_current_user_id(),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );

    }

    public function get_availability()
    {

    }

}