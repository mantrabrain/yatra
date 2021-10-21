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
        $user_id = $user_id < 1 ? get_current_user_id() : $user_id;

        if ($user_id < 1 || $order_item_id < 1 || $course_id < 1) {

            return false;
        }
        global $wpdb;

        $sql = $wpdb->prepare(
            "INSERT INTO " . self::get_table($table) . "
            (user_id, item_id, start_time, start_time_gmt, end_time,end_time_gmt, item_type, status,reference_id,reference_type,parent_id)
            values
            (%d, %d, %s, %s, %s, %s, %s, %s, %d, %s, %d)",
            $user_id,
            $course_id,
            current_time('mysql'),
            current_time('mysql', true),
            current_time('mysql'),
            current_time('mysql', true),
            SIKSHYA_COURSES_CUSTOM_POST_TYPE,
            'enrolled',
            $order_item_id,
            SIKSHYA_ORDERS_CUSTOM_POST_TYPE,
            0


        );

        return $wpdb->query($sql);
    }


    private static function update($yatra_table_name)
    {

    }

    public static function get_data()
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