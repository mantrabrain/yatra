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

if (class_exists('Yatra_Admin_List_Table_Bookings', false)) {
    return;
}

if (!class_exists('Yatra_Admin_List_Table', false)) {
    include_once 'abstract-class-yatra-admin-list-table.php';
}

/**
 * Yatra_Admin_List_Table_Bookings Class.
 */
class Yatra_Admin_List_Table_Bookings extends Yatra_Admin_List_Table
{

    /**
     * Post type.
     *
     * @var string
     */
    protected $list_table_type = 'yatra-booking';


    private $booking_meta = null;

    private $booking_meta_params = null;

    private $booking_customer_info = null;

    /**
     * Constructor.
     */
    public function __construct()
    {

        parent::__construct();

    }

    /**
     * Render blank state.
     */
    protected function render_blank_state()
    {
        echo '<div class="yatra-BlankState">';

        echo '<h2 class="yatra-BlankState-message">' . esc_html__('When you receive a new booking, it will appear here.', 'yatra') . '</h2>';

        echo '<div class="yatra-BlankState-buttons">';
        echo '</div>';

        echo '</div>';
    }

    /**
     * Define primary column.
     *
     * @return string
     */
    protected function get_primary_column()
    {
        return 'ID';
    }

    /**
     * Get row actions to show in the list table.
     *
     * @param array $actions Array of actions.
     * @param WP_Post $post Current post object.
     * @return array
     */
    /*  protected function get_row_actions($actions, $post)
      {
          return array();
      }*/

    /**
     * Define hidden columns.
     *
     * @return array
     */
    protected function define_hidden_columns()
    {
        return array();
    }

    /**
     * Define which columns are sortable.
     *
     * @param array $columns Existing columns.
     * @return array
     */
    public function define_sortable_columns($columns)
    {
        $custom = array(
            'cb' => 'cb',
            'booking_date' => 'date',
        );
        unset($columns['comments']);

        return wp_parse_args($custom, $columns);
    }

    /**
     * Define which columns to show on this screen.
     *
     * @param array $columns Existing columns.
     * @return array
     */
    public function define_columns($columns)
    {
        $show_columns = array();
        $show_columns['cb'] = $columns['cb'];
        $show_columns['booking_code'] = __('Booking Code', 'yatra');
        $show_columns['yatra_tour_name'] = __('Tour', 'yatra');
        $show_columns['booking_date'] = __('Date', 'yatra');
        $show_columns['booking_status'] = __('Status', 'yatra');
        $show_columns['email_address'] = __('Email', 'yatra');
        $show_columns['full_name'] = __('Full name', 'yatra');
        $show_columns['booking_total'] = __('Total', 'yatra');
        $show_columns['paid_amount'] = __('Paid Amount', 'yatra');


        return $show_columns;
    }

    /**
     * Define bulk actions.
     *
     * @param array $actions Existing actions.
     * @return array
     */
    public function define_bulk_actions($actions)
    {
        if (isset($actions['edit'])) {
            unset($actions['edit']);
        }
        $actions['mark_pending'] = __('Change status to Pending', 'yatra');
        $actions['mark_processing'] = __('Change status to Processing', 'yatra');
        $actions['mark_on-hold'] = __('Change status to On-hold', 'yatra');
        $actions['mark_completed'] = __('Change status to Completed', 'yatra');
        $actions['mark_cancelled'] = __('Change status to Cancelled', 'yatra');

        return $actions;
    }

    /**
     * Pre-fetch any data for the row each column has access to it. the_order global is there for bw compat.
     *
     * @param int $post_id Post ID being shown.
     */
    protected function prepare_row_data($post_id)
    {

        global $the_order;
        $this->object = get_post($post_id);
        $the_order = $this->object;
        $this->booking_meta = get_post_meta($post_id, 'yatra_booking_meta', true);
        $this->booking_meta_params = get_post_meta($post_id, 'yatra_booking_meta_params', true);
        $this->booking_customer_info = isset($this->booking_meta_params['yatra_tour_customer_info']) ? $this->booking_meta_params['yatra_tour_customer_info'] : array();

    }

    /**
     * Render columm: order_number.
     */
    protected function render_yatra_tour_name_column()
    {
        $tour_string = '';

        foreach ($this->booking_meta as $tour_id => $booking_meta) {

            $tour_id = absint($tour_id);

            $tour_title = isset($booking_meta['yatra_tour_name']) ? $booking_meta['yatra_tour_name'] : '';

            $tour_string .= '<a target="_blank" href="' . esc_url(admin_url('post.php?post=' . absint($tour_id)) . '&action=edit') . '" class="tour-view"><strong>' . esc_html($tour_title) . '</strong></a><br/>';
        }
        echo $tour_string;

    }

    /**
     * Render columm: order_number.
     */
    protected function render_booking_code_column()
    {

        $booking_code = $this->object->post_title;

        if ($this->object->post_status === 'trash') {
            echo '<strong>#' . esc_attr($this->object->ID) . ' ' . esc_html($booking_code) . '</strong>';
        } else {
            echo '<a href="' . esc_url(admin_url('post.php?post=' . absint($this->object->ID)) . '&action=edit') . '" class="order-view"><strong>' . esc_html($booking_code) . '</strong></a>';
        }
    }

    /**
     * Render columm: order_number.
     */
    protected function render_booking_date_column()
    {

        echo '<a href="' . esc_url(admin_url('post.php?post=' . absint($this->object->ID)) . '&action=edit') . '" class="order-view"><strong>' . esc_attr($this->object->post_date) . '</strong></a>';

    }

    /**
     * Render columm: order_status.
     */
    protected function render_booking_status_column()
    {
        $yatra_booking_statuses = yatra_get_booking_statuses();

        $status = isset($yatra_booking_statuses[$this->object->post_status]) ? $yatra_booking_statuses[$this->object->post_status] : 'Unknown';
        $background = "#e47703";
        switch (substr($this->object->post_status, 6)) {
            case "processing":
                $background = "#033503";
                break;
            case "on-hold":
                $background = "#7d1010";
                break;
            case "completed":
                $background = "#0e880e";
                break;
            case "cancelled":
                $background = "#6b6767";
                break;
            case "failed":
                $background = "#ff0000";
                break;
        }

        printf('<mark 
    style="padding: 3px 10px 5px 10px;background: %s;color: #fff;border-radius: 4px;display: inline-block;text-align: center;text-transform: capitalize;" 
    class="booking-status %s tips" 
    data-tip="%s"><span>%s</span></mark>', esc_attr($background), esc_attr(sanitize_html_class('status-' . $status)), wp_kses_post($status), esc_html($status));

    }

    /**
     * Render columm: order_status.
     */
    protected function render_email_address_column()
    {

        $email = isset($this->booking_customer_info['email']) ? $this->booking_customer_info['email'] : '';

        printf('<span>%s</span>', esc_html($email));

    }

    /**
     * Render columm: order_status.
     */
    protected function render_full_name_column()
    {

        $fullname = isset($this->booking_customer_info['fullname']) ? $this->booking_customer_info['fullname'] : '';

        printf('<span>%s</span>', esc_html($fullname));
    }

    /**
     * Render columm: order_status.
     */
    protected function render_booking_total_column()
    {

        $total_booking_price = isset($this->booking_meta_params['total_booking_net_price']) ? $this->booking_meta_params['total_booking_net_price'] : '';

        $currency = $this->booking_meta_params['currency'] ?? '';

        $currency = $this->booking_meta_params['yatra_currency'] ?? $currency;

        $yatra_currency_symbol = yatra_get_current_currency_symbol($currency);

        $price = yatra_get_price($yatra_currency_symbol, $total_booking_price);

        printf('<span>%s</span>', $price);
    }

    /**
     * Render columm: paid_amount.
     */
    protected function render_paid_amount_column()
    {

        $payment = new Yatra_Payment();

        $total_paid_amount = floatval($payment->get_total_paid_amount($this->object->ID));

        $currency = $this->booking_meta_params['currency'] ?? '';

        $currency = $this->booking_meta_params['yatra_currency'] ?? $currency;

        $yatra_currency_symbol = yatra_get_current_currency_symbol($currency);

        $price = yatra_get_price($yatra_currency_symbol, $total_paid_amount);

        printf('<span>%s</span>', $price);
    }


    /**
     * Handle bulk actions.
     *
     * @param string $redirect_to URL to redirect to.
     * @param string $action Action name.
     * @param array $ids List of ids.
     * @return string
     */
    public function handle_bulk_actions($redirect_to, $action, $ids)
    {
        $ids = apply_filters('yatra_bulk_action_ids', array_reverse(array_map('absint', $ids)), $action, 'order');
        $changed = 0;

        if (false !== strpos($action, 'mark_')) {
            $booking_statuses = yatra_get_booking_statuses();
            $new_status = substr($action, 5); // Get the status name from action.
            $report_action = 'marked_' . $new_status;
            $new_status = 'yatra-' . $new_status;
            // Sanity check: bail out if this is actually not a status, or is not a registered status.
            if (isset($booking_statuses[$new_status])) {

                foreach ($ids as $id) {
                    yatra_update_booking_status($id, $new_status);
                    do_action('yatra_booking_edit_status', $id, $new_status);
                    $changed++;
                }
            }
        }

        if ($changed) {
            $redirect_to = add_query_arg(
                array(
                    'post_type' => $this->list_table_type,
                    'bulk_action' => $report_action,
                    'changed' => $changed,
                    'ids' => join(',', $ids),
                ),
                $redirect_to
            );
        }

        return esc_url_raw($redirect_to);
    }

}



