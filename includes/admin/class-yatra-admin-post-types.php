<?php
/**
 * Post Types Admin
 *
 * @package  Yatra/admin
 * @version  1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

if (class_exists('Yatra_Admin_Post_Types', false)) {
    new Yatra_Admin_Post_Types();
    return;
}

/**
 * Yatra_Admin_Post_Types Class.
 *
 * Handles the edit posts views and some functionality on the edit post screen for yatra post types.
 */
class Yatra_Admin_Post_Types
{

    /**
     * Constructor.
     */
    public function __construct()
    {


        // Load correct list table classes for current screen.
        add_action('current_screen', array($this, 'setup_screen'));
        add_action('check_ajax_referer', array($this, 'setup_screen'));

        // Admin notices.
        add_filter('post_updated_messages', array($this, 'post_updated_messages'));
        add_filter('bulk_post_updated_messages', array($this, 'bulk_post_updated_messages'), 10, 2);

        add_action( 'admin_print_scripts', array( $this, 'disable_autosave' ) );

        add_filter('display_post_states', array($this, 'add_display_post_states'), 10, 2);

    }

    /**
     * Looks at the current screen and loads the correct list table handler.
     *
     * @since 3.3.0
     */
    public function setup_screen()
    {
        global $yatra_list_table;

        $screen_id = false;

        if (function_exists('get_current_screen')) {
            $screen = get_current_screen();
            $screen_id = isset($screen, $screen->id) ? $screen->id : '';
        }

        if (!empty($_REQUEST['screen'])) { // WPCS: input var ok.
            $screen_id = sanitize_text_field($_REQUEST['screen']);
        }


        switch ($screen_id) {
            case 'edit-yatra-booking':
                include_once 'list-tables/class-yatra-admin-list-table-bookings.php';
                $yatra_list_table = new Yatra_Admin_List_Table_Bookings();
                break;
            case 'edit-yatra-customers':
                include_once 'list-tables/class-yatra-admin-list-table-customers.php';
                $yatra_list_table = new Yatra_Admin_List_Table_Customers();
                break;

        }

        // Ensure the table handler is only loaded once. Prevents multiple loads if a plugin calls check_ajax_referer many times.
        remove_action('current_screen', array($this, 'setup_screen'));
        remove_action('check_ajax_referer', array($this, 'setup_screen'));
    }

    /**
     * Change messages when a post type is updated.
     *
     * @param array $messages Array of messages.
     * @return array
     */
    public function post_updated_messages($messages)
    {
        global $post;


        $messages['tour_booking'] = array(
            0 => '', // Unused. Messages start at index 1.
            1 => __('updated.', 'yatra'),
            2 => __('Custom field updated.', 'yatra'),
            3 => __('Custom field deleted.', 'yatra'),
            4 => __('Order updated.', 'yatra'),
            5 => __('Revision restored.', 'yatra'),
            6 => __('Order updated.', 'yatra'),
            7 => __('Order saved.', 'yatra'),
            8 => __('Order submitted.', 'yatra'),
            9 => sprintf(
            /* translators: %s: date */
                __('Order scheduled for: %s.', 'yatra'),
                '<strong>' . date_i18n(__('M j, Y @ G:i', 'yatra'), strtotime($post->post_date)) . '</strong>'
            ),
            10 => __('Order draft updated.', 'yatra'),
            11 => __('Order updated and sent.', 'yatra'),
        );


        return $messages;
    }

    /**
     * Specify custom bulk actions messages for different post types.
     *
     * @param array $bulk_messages Array of messages.
     * @param array $bulk_counts Array of how many objects were updated.
     * @return array
     */
    public function bulk_post_updated_messages($bulk_messages, $bulk_counts)
    {
        $bulk_messages['tour_booking'] = array(
            /* translators: %s: order count */
            'updated' => _n('%s order updated.', '%s orders updated.', $bulk_counts['updated'], 'yatra'),
            /* translators: %s: order count */
            'locked' => _n('%s order not updated, somebody is editing it.', '%s orders not updated, somebody is editing them.', $bulk_counts['locked'], 'yatra'),
            /* translators: %s: order count */
            'deleted' => _n('%s order permanently deleted.', '%s orders permanently deleted.', $bulk_counts['deleted'], 'yatra'),
            /* translators: %s: order count */
            'trashed' => _n('%s order moved to the Trash.', '%s orders moved to the Trash.', $bulk_counts['trashed'], 'yatra'),
            /* translators: %s: order count */
            'untrashed' => _n('%s order restored from the Trash.', '%s orders restored from the Trash.', $bulk_counts['untrashed'], 'yatra'),
        );

        return $bulk_messages;
    }


    /**
     * Disable the auto-save functionality for Orders.
     */
    public function disable_autosave()
    {
        global $post;

        if ($post && in_array(get_post_type($post->ID), array('yatra-booking'), true)) {
            wp_dequeue_script('autosave');
        }
    }


    /**
     * Add a post display state for special Yatra pages in the page list table.
     *
     * @param array $post_states An array of post display states.
     * @param WP_Post $post The current post object.
     */
    public function add_display_post_states($post_states, $post)
    {
        $cart_page_id = get_option('yatra_cart_page');

        $yatra_checkout_page = get_option('yatra_checkout_page');

        $yatra_thankyou_page = get_option('yatra_thankyou_page');

        $yatra_my_account_page = get_option('yatra_my_account_page');

        if ($cart_page_id == $post->ID) {
            $post_states['yatra_page_for_cart'] = __('Yatra Cart Page', 'yatra');
        }

        if ($yatra_checkout_page == $post->ID) {
            $post_states['yatra_page_for_checkout'] = __('Yatra Checkout Page', 'yatra');
        }

        if ($yatra_thankyou_page == $post->ID) {
            $post_states['yatra_page_for_thankyou'] = __('Yatra Thank You Page', 'yatra');
        }
        if ($yatra_my_account_page == $post->ID) {
            $post_states['yatra_page_for_my_account'] = __('Yatra My Account Page', 'yatra');
        }
        return $post_states;
    }
}

new Yatra_Admin_Post_Types();
