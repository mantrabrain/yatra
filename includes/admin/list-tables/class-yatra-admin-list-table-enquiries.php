<?php
/**
 * List tables: orders.
 *
 * @package Yatra\admin
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (class_exists('Yatra_Admin_List_Table_Enquiries', false)) {
    return;
}

if (!class_exists('Yatra_Admin_List_Table', false)) {
    include_once 'abstract-class-yatra-admin-list-table.php';
}


class Yatra_Admin_List_Table_Enquiries extends WP_List_Table
{
    /**
     * Prepare the items for the table to process
     *
     * @return Void
     */
    public function prepare_items()
    {
        $columns = $this->get_columns();

        $hidden = $this->get_hidden_columns();

        $sortable = $this->get_sortable_columns();


        $user = get_current_user_id();

        $screen = get_current_screen();

        $screen_option = $screen->get_option('per_page', 'option');

        $perPage = get_user_meta($user, $screen_option, true);


        if (is_array($perPage) || empty($perPage)) {

            $perPage = $screen->get_option('per_page', 'default');
        }

        $totalItems = $this->getTotalCount();

        $this->set_pagination_args(array(
            'total_items' => $totalItems,
            'per_page' => $perPage
        ));

        $this->_column_headers = array($columns, $hidden, $sortable);

        $this->items = $this->table_data($perPage);
    }

    /**
     * Override the parent columns method. Defines the columns to use in your listing table
     *
     * @return Array
     */
    public function get_columns()
    {
        $columns = array(
            'id' => __('ID', 'yatra'),
            'tour' => __('Tour', 'yatra'),
            'fullname' => __('Full Name', 'yatra'),
            'email' => __('Email', 'yatra'),
            'country' => __('Country', 'yatra'),
            'phone_number' => __('Phone Number', 'yatra'),
            'adults' => __('Adults', 'yatra'),
            'childs' => __('Childs', 'yatra'),
            'subject' => __('Subject', 'yatra'),
            'message' => __('Message', 'yatra'),
            'created_at' => __('Created At', 'yatra')
        );

        return $columns;
    }

    /**
     * Define which columns are hidden
     *
     * @return Array
     */
    public function get_hidden_columns()
    {
        return array();
    }

    /**
     * Define the sortable columns
     *
     * @return Array
     */
    public function get_sortable_columns()
    {
        return array(
            'id' => array('id', true)
        );
    }


    private function getTotalCount()
    {
        return Yatra_Core_DB::get_count(Yatra_Tables::TOUR_ENQUIRIES);

    }

    private function table_data($perPage)
    {
        $currentPage = $this->get_pagenum();

        $offset = (($currentPage - 1) * $perPage);

        $sort_data = $this->sort_data();

        $additional_args = array(
            'order_by' => $sort_data['order_by'],
            'order' => $sort_data['order'],
            'offset' => absint($offset),
            'limit' => absint($perPage)
        );
        $data = Yatra_Core_DB::get_data(Yatra_Tables::TOUR_ENQUIRIES, array(), array(), $additional_args);


        return $data;
    }

    /**
     * Define what data to show on each column of the table
     *
     * @param Array $item Data
     * @param String $column_name - Current column name
     *
     * @return Mixed
     */
    public function column_default($item, $column_name)
    {

        $value = '';
        switch ($column_name) {
            case "id":
            case "fullname":
            case "email":
            case "phone_number":
            case "message":
            case "subject":
            case "created_at":
                $value = $item->$column_name;
                break;
            case "tour":
                $value = $item->id == null ? "NULL" : get_the_title($item->tour_id);
                break;
            case "childs":
                $value = $item->number_of_childs;
                break;
            case "adults":
                $value = $item->number_of_adults;
                break;
            case "country":
                $value = yatra_get_countries($item->country);
                $value = is_array($value) ? $item->country : $value;
                break;
        }
        return sanitize_text_field($value);
    }

    /**
     * Allows you to sort the data by the variables set in the $_GET
     *
     * @return Mixed
     */
    private function sort_data()
    {
        // Set defaults
        $orderby = 'id';
        $order = 'DESC';

        // If orderby is set, use this as the sort column
        if (!empty($_GET['orderby'])) {
            $orderby = sanitize_text_field($_GET['orderby']);
        }

        // If order is set use this as the order
        if (!empty($_GET['order'])) {
            $order = sanitize_text_field($_GET['order']);
        }
        $sortable_columns = $this->get_sortable_columns();

        if (!isset($sortable_columns[$orderby])) {
            $orderby = 'id';
        }
        if (!in_array(strtoupper($order), array('ASC', 'DESC'))) {
            $order = 'DESC';
        }
        return [
            'order' => $order,
            'order_by' => $orderby
        ];


    }
}
