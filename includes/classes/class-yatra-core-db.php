<?php

class Yatra_Core_DB
{
    private static function get_table($table)
    {
        global $wpdb;

        return $wpdb->base_prefix . 'yatra_' . $table;
    }

    private static function fetch($table, $select = array(), $where = array(), $additonal_args = array())
    {

        $default_additional_args = array(
            'order_by' => '',
            'order' => 'asc',
            'offset' => '0',
            'limit' => ''
        );
        $additional_parsed_args = wp_parse_args($additonal_args, $default_additional_args);

        global $wpdb;

        if (empty($select)) {

            $select_text = "SELECT * FROM " . self::get_table($table);
        } else {
            $select_text = "SELECT ";

            foreach ($select as $select_field_index => $select_field) {

                $select_field_array = explode('|', $select_field);

                $field_name = sanitize_text_field(wp_unslash($select_field_array[0]));

                $field_alias = isset($select_field_array[1]) ? sanitize_text_field(wp_unslash($select_field_array[1])) : '';

                $select_text .= $field_alias == '' ? $field_name : $field_name . ' AS ' . $field_alias;

                if (count($select) != ($select_field_index + 1)) {

                    $select_text .= ", ";
                }


            }

            $select_text .= " FROM " . self::get_table($table);

        }
        $prepare_args = array();

        if (empty($where)) {

            $select_text = $select_text . " WHERE 1=%d";

            $prepare_args = array(
                '1'
            );

        } else {
            $where_query = ' WHERE ';

            foreach ($where as $wh => $wh_value) {

                $where_query .= sanitize_text_field($wh) . "=%s AND ";

                array_push($prepare_args, $wh_value);
            }

            $where_query = rtrim($where_query, "AND ");

            $select_text .= $where_query;


        }
        if ('' != ($additional_parsed_args['order_by'])) {

            $select_text .= ' ORDER BY ' . sanitize_text_field($additional_parsed_args['order_by']) . ' ';

            if (!in_array(strtolower($additional_parsed_args['order']), array('asc', 'desc'))) {
                $additional_parsed_args['order'] = 'asc';
            }
            $select_text .= sanitize_text_field($additional_parsed_args['order']);

        }

        if ('' != ($additional_parsed_args['limit'])) {

            $additional_parsed_args['offset'] = absint($additional_parsed_args['offset']);

            $select_text .= ' LIMIT ' . $additional_parsed_args['offset'] . ', ' . absint($additional_parsed_args['limit']);

        }
        $query = $wpdb->prepare($select_text, $prepare_args);

        return $wpdb->get_results($query);

    }

    private static function insert($table, $data = array())
    {

        /*
         * $data = array(
         * pricing|string=>''
         * )
         */
        global $wpdb;

        $insert_query = "INSERT INTO " . self::get_table($table) . " (";

        $values_query = "";

        foreach ($data as $column => $column_value) {

            $column_type = gettype($column_value);

            $values_query .= $column_type === "integer" ? "%d" : "%s";

            $values_query .= ", ";

            $insert_query .= sanitize_text_field($column) . ", ";

        }
        $values_query = rtrim(trim($values_query), ",");

        $insert_query = rtrim(trim($insert_query), ",");

        $insert_query .= " ) VALUES({$values_query})";

        $insert_values = array_values($data);

        $sql = $wpdb->prepare(
            $insert_query,
            ...$insert_values


        );
        return $wpdb->query($sql);
    }


    private static function update($table, $data = array(), $where = array(), $update_ignore = array())
    {
        if (count($where) === 0) {
            return false;
        }

        global $wpdb;

        $update_query = "UPDATE " . self::get_table($table) . " SET ";

        $prepare_arg_values = array();

        foreach ($data as $column => $column_value) {

            $column_type = gettype($column_value);

            $column_value_type = $column_type === "integer" ? "%d" : "%s";

            if (!in_array($column, $update_ignore)) {

                array_push($prepare_arg_values, $column_value);

                $update_query .= sanitize_text_field($column) . "={$column_value_type}";
            }
        }

        $update_query .= ' WHERE ';

        foreach ($where as $wh => $wh_value) {

            $wh_column_value_type = $wh_value === "integer" ? "%d" : "%s";

            $update_query .= sanitize_text_field($wh) . "={$wh_column_value_type} AND ";

            array_push($prepare_arg_values, $wh_value);
        }

        $sql = $wpdb->prepare(
            $update_query,
            ...$prepare_arg_values


        );
        return $wpdb->query($sql);
    }


    public static function data_exists($table, $data = array(), $where = array())
    {
        $existing_data = self::fetch('tour_dates', array(), $where);

        if (count($existing_data) > 0) {
            return true;
        }
        return false;
    }

    public static function update_data($table, $data = array(), $where = array(), $update_ignore = array())
    {

    }

    public static function save_data($table, $data = array(), $save_ignore = array())
    {

    }

    public static function save_data($data, $save_ignore = array(), $where = array(), $update_ignore = array())
    {

        $default = array(
            'tour_id' => 27,
            'slot_group_id' => 3,
            'start_date' => date('Y-m-d') . ' 00:00:00',
            'end_date' => date('Y-m-d') . ' 00:00:00',
            'price' => 512.00,
            'pricing' => 'pricing_text',
            'pricing_type' => 'single',
            'max_travellers' => 20,
            'active' => 1,
            'availability' => 'booking',
            'note_to_customer' => 'note',
            'note_to_admin' => 'note to admin',
            'created_by' => 1,
            'updated_by' => 1,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );
        $response = self::insert('tour_dates', $data);
        echo '<pre>';
        print_r($response);
        echo '</pre>';
    }

    public
    static function get_data()
    {
        $data = self::fetch('posts', array(
            'ID|POST_ID',
            'post_author|POST_AUTHOR',
            'post_date|WOW_DATE',
            'post_title|cCHECKING'
        ), array(
            'post_author' => 1
        ), array(
            'order_by' => 'ID',
            'order' => 'asc',
            'limit' => 3,
            'offset' => 2
        ));

        echo '<pre>';
        print_r($data);
        echo '</pre>';
    }

}