<?php

class Yatra_Core_DB
{
    private static function get_table($table)
    {
        global $wpdb;

        return $wpdb->prefix . 'yatra_' . $table;
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

        } else if (gettype($select) === "string") {

            $select = trim($select);

            $select_text = "SELECT {$select} FROM " . self::get_table($table);

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

            $select_text = $select_text . " WHERE 1=%d ";

            $prepare_args = array(
                '1'
            );

        } else {
            $where_query = ' WHERE ';

            foreach ($where as $wh => $wh_value) {


                $wh_cond_array = explode('|', $wh);

                $left_field = sanitize_text_field(wp_unslash($wh_cond_array[0]));

                $operator = isset($wh_cond_array[1]) ? $wh_cond_array[1] : "=";

                $operator = in_array($operator, array(">", "<", "=", ">=", "<=")) ? $operator : "=";

                $right_field = isset($wh_cond_array[2]) ? sanitize_text_field(wp_unslash($wh_cond_array[2])) : "%s";

                $where_query .= "{$left_field}{$operator}{$right_field} AND ";

                array_push($prepare_args, $wh_value);
            }

            $where_query = rtrim(trim($where_query), "AND");

            $select_text .= " " . $where_query;


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

    private static function insert($table, $data = array(), $save_ignore = array())
    {
        global $wpdb;

        $insert_query = "INSERT INTO " . self::get_table($table) . " (";

        $values_query = "";

        $filtered_data = array();

        foreach ($data as $column => $column_value) {

            $column_type = gettype($column_value);

            if (!in_array($column, $save_ignore)) {

                $filtered_data[$column] = $column_value;

                $values_query .= $column_type === "integer" ? "%d" : "%s";

                $values_query .= ", ";

                $insert_query .= sanitize_text_field($column) . ", ";
            }

        }
        $values_query = rtrim(trim($values_query), ",");

        $insert_query = rtrim(trim($insert_query), ",");

        $insert_query .= " ) VALUES({$values_query})";

        $insert_values = array_values($filtered_data);

        $sql = $wpdb->prepare(
            $insert_query,
            ...$insert_values


        );
        $sql = str_ireplace("'__NULL__'", "NULL", $sql);

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

                $update_query .= sanitize_text_field($column) . "={$column_value_type}, ";
            }
        }
        $update_query = rtrim(trim($update_query), ',');

        $update_query .= ' WHERE ';

        foreach ($where as $wh => $wh_value) {

            $wh_column_value_type = $wh_value === "integer" ? "%d" : "%s";

            $update_query .= sanitize_text_field($wh) . "={$wh_column_value_type} AND ";

            array_push($prepare_arg_values, $wh_value);
        }
        $update_query = rtrim(trim($update_query), 'AND');

        $sql = $wpdb->prepare(
            $update_query,
            ...$prepare_arg_values


        );

        $sql = str_ireplace("'__NULL__'", "NULL", $sql);

        return $wpdb->query($sql);
    }

    public static function data_exists($table, $where = array())
    {
        $existing_data = self::fetch($table, array(), $where);

        if (count($existing_data) > 0) {
            return true;
        }
        return false;
    }

    public static function update_data($table, $data = array(), $where = array(), $update_ignore = array())
    {
        return self::update($table, $data, $where, $update_ignore);
    }

    public static function save_data($table, $data = array(), $save_ignore = array())
    {
        return self::insert($table, $data, $save_ignore);

    }

    public static function get_data($table, $select = array(), $where = array(), $additional_args = array())
    {
        return self::fetch($table, $select, $where, $additional_args);
    }

    public static function get_count($table, $where = array(), $additional_args = array())
    {
        $data = self::fetch($table, " count(*) as total ", $where, $additional_args);

        if (isset($data[0])) {
            if (isset($data[0]->total)) {

                return absint($data['0']->total);
            }
        }
        return 0;

    }

    public static function get_tour_dates_data($where = array())
    {

        $query = "SELECT
     yd.*,
     yb.booked_travellers
 FROM
     " . self::get_table(Yatra_Tables::TOUR_DATES) . " AS yd
 LEFT JOIN(
         SELECT
         tour_id,
         booked_date,
         SUM(total_number_of_pax) AS booked_travellers
     FROM
         " . self::get_table(Yatra_Tables::TOUR_BOOKING_STATS) . "
     GROUP BY
         tour_id,
         booked_date
 ) AS yb
 ON
     yd.tour_id = yb.tour_id AND date(yd.start_date) = date(yb.booked_date) and date(yd.end_date) = date(yb.booked_date)";

        global $wpdb;

        $where_query = ' WHERE ';

        $prepare_args = array();

        foreach ($where as $wh => $wh_value) {

            $wh_cond_array = explode('|', $wh);

            $left_field = 'yd.' . sanitize_text_field(wp_unslash($wh_cond_array[0]));

            $operator = isset($wh_cond_array[1]) ? $wh_cond_array[1] : "=";

            $operator = in_array($operator, array(">", "<", "=", ">=", "<=")) ? $operator : "=";

            $right_field = isset($wh_cond_array[2]) ? 'yd.' . sanitize_text_field(wp_unslash($wh_cond_array[2])) : "%s";

            $where_query .= "{$left_field}{$operator}{$right_field} AND ";

            array_push($prepare_args, $wh_value);
        }

        $where_query = rtrim(trim($where_query), "AND");

        $select_text = $query . $where_query;

        $query = $wpdb->prepare($select_text, $prepare_args);

        return $wpdb->get_results($query);
    }


    public static function get_booked_pax($tour_id, $start_date, $end_date)
    {

        $start_date = new DateTime($start_date);

        $end_date = new DateTime($end_date);

        $start_date = $start_date->format('Y-m-d');

        $end_date = $end_date->format('Y-m-d');

        $select_text = " SELECT
        date(booked_date) as booked_date,
         SUM(total_number_of_pax) AS booked_travellers
     FROM
         " . self::get_table(Yatra_Tables::TOUR_BOOKING_STATS) . "
     GROUP BY
         tour_id,
         booked_date HAVING tour_id=%d and (date(booked_date) between %s and %s)";

        $prepare_args = array(
            'tour_id' => absint($tour_id),
            'start_date' => trim($start_date),
            'end_date' => trim($end_date)
        );
        global $wpdb;

        $query = $wpdb->prepare($select_text, $prepare_args);

        $results = $wpdb->get_results($query);

        $final_results = array();

        foreach ($results as $result) {

            $final_results[$result->booked_date] = absint($result->booked_travellers);
        }

        return $final_results;

    }

}