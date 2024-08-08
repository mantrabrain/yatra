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


    public function prepare_items()
    {
        $this->process_bulk_action(); // Process bulk actions

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

    public function get_columns()
    {
        return array(
            'cb' => '<input type="checkbox" />',
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
    }

    public function column_cb($item)
    {
        return sprintf(
            '<input type="checkbox" name="enquiry_id[]" value="%s" />',
            $item->id
        );
    }

    public function get_bulk_actions()
    {
        $actions = array(
            'delete' => __('Permanently Delete', 'yatra'),
            //'export' => __('Export', 'yatra')
        );

        return $actions;
    }

    public function process_bulk_action()
    {
        if (!current_user_can('manage_options')) {
            return;
        }
        if ('delete' === $this->current_action()) {
            if (isset($_POST['enquiry_id'])) {
                $enquiry_ids = array_map('absint', $_POST['enquiry_id']);
                foreach ($enquiry_ids as $id) {
                    Yatra_Core_DB::delete(Yatra_Tables::TOUR_ENQUIRIES, array('id' => $id));
                }
            }
        }

        if ('export' === $this->current_action()) {
            // Implement export logic here
        }
    }

    public function get_hidden_columns()
    {
        return array();
    }

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
        return Yatra_Core_DB::get_data(Yatra_Tables::TOUR_ENQUIRIES, array(), array(), $additional_args);
    }

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

    private function sort_data()
    {
        $orderby = 'id';
        $order = 'DESC';

        if (!empty($_GET['orderby'])) {
            $orderby = sanitize_text_field($_GET['orderby']);
        }

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
