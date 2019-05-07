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

    /**
     * Constructor.
     */
    public function __construct()
    {

        parent::__construct();
        //add_action('admin_notices', array($this, 'bulk_admin_notices'));
    }

    /**
     * Render blank state.
     */
    protected function render_blank_state()
    {
        echo '<div class="yatra-BlankState">';

        echo '<h2 class="yatra-BlankState-message">' . esc_html__('When you receive a new order, it will appear here.', 'yatra') . '</h2>';

        echo '<div class="yatra-BlankState-buttons">';
        echo '<a class="yatra-BlankState-cta button-primary button" target="_blank" href="https://docs.yatra.com/document/managing-orders/?utm_source=blankslate&utm_medium=product&utm_content=ordersdoc&utm_campaign=yatraplugin">' . esc_html__('Learn more about orders', 'yatra') . '</a>';
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

    }

    /**
     * Render columm: order_number.
     */
    protected function render_yatra_tour_name_column()
    {
        $tour_title = isset($this->booking_meta['yatra_tour_name']) ? $this->booking_meta['yatra_tour_name'] : '';
        $tour_id = isset($this->booking_meta['yatra_tour_id']) ? $this->booking_meta['yatra_tour_id'] : '';

        echo '<a target="_blank" href="' . esc_url(admin_url('post.php?post=' . absint($tour_id)) . '&action=edit') . '" class="tour-view"><strong>' . esc_html($tour_title) . '</strong></a>';

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
        $background = "#6b6767";
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
                $background = "#e47703";
                break;
        }

        printf('<mark 
    style="padding: 3px 15px;background: %s;color: #fff;border-radius: 10px;line-height: 1.5em;display: block;text-align: center;text-transform: capitalize;" 
    class="booking-status %s tips" 
    data-tip="%s"><span>%s</span></mark>', esc_attr($background), esc_attr(sanitize_html_class('status-' . $status)), wp_kses_post($status), esc_html($status));

    }

    /**
     * Render columm: order_status.
     */
    protected function render_email_address_column()
    {
        $tour_meta = isset($this->booking_meta['tour_meta']) ? $this->booking_meta['tour_meta'] : array();

        $email = isset($tour_meta['email']) ? $tour_meta['email'] : '';

        printf('<span>%s</span>', esc_html($email));

    }

    /**
     * Render columm: order_status.
     */
    protected function render_full_name_column()
    {
        $tour_meta = isset($this->booking_meta['tour_meta']) ? $this->booking_meta['tour_meta'] : array();

        $fullname = isset($tour_meta['fullname']) ? $tour_meta['fullname'] : '';

        printf('<span>%s</span>', esc_html($fullname));
    }

    /**
     * Render columm: order_status.
     */
    protected function render_booking_total_column()
    {
        $yatra_tour_price = isset($this->booking_meta['yatra_tour_price']) ? $this->booking_meta['yatra_tour_price'] : '';

        $yatra_currency_symbol = isset($this->booking_meta['yatra_currency_symbol']) ? $this->booking_meta['yatra_currency_symbol'] : '';

        printf('<span>%s %s</span>', $yatra_currency_symbol, esc_html($yatra_tour_price));
    }


    /**
     * Handle bulk actions.
     *
     * @param  string $redirect_to URL to redirect to.
     * @param  string $action Action name.
     * @param  array $ids List of ids.
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
                    $booking = new Yatra_Tour_Booking($id);
                    $booking->update_status($id, $new_status);
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
