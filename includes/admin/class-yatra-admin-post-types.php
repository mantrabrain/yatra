<?php
/**
 * Post Types Admin
 *
 * @package  Yatra/admin
 * @version  3.3.0
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
 * Handles the edit posts views and some functionality on the edit post screen for WC post types.
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


        // Extra post data and screen elements.
        add_action('edit_form_top', array($this, 'edit_form_top'));
        add_filter('enter_title_here', array($this, 'enter_title_here'), 1, 2);
        add_action('edit_form_after_title', array($this, 'edit_form_after_title'));
        add_filter('default_hidden_meta_boxes', array($this, 'hidden_meta_boxes'), 10, 2);


        // Bulk / quick edit.
        add_action('bulk_edit_custom_box', array($this, 'bulk_edit'), 10, 2);
        add_action('quick_edit_custom_box', array($this, 'quick_edit'), 10, 2);
        add_action('save_post', array($this, 'bulk_and_quick_edit_hook'), 10, 2);
        add_action('yatra_product_bulk_and_quick_edit', array($this, 'bulk_and_quick_edit_save_post'), 10, 2);
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

        }

        // Ensure the table handler is only loaded once. Prevents multiple loads if a plugin calls check_ajax_referer many times.
        remove_action('current_screen', array($this, 'setup_screen'));
        remove_action('check_ajax_referer', array($this, 'setup_screen'));
    }

    /**
     * Change messages when a post type is updated.
     *
     * @param  array $messages Array of messages.
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
     * @param  array $bulk_messages Array of messages.
     * @param  array $bulk_counts Array of how many objects were updated.
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
     * Custom bulk edit - form.
     *
     * @param string $column_name Column being shown.
     * @param string $post_type Post type being shown.
     */
    public function bulk_edit($column_name, $post_type)
    {
        if ('price' !== $column_name || 'product' !== $post_type) {
            return;
        }

        $shipping_class = get_terms(
            'product_shipping_class',
            array(
                'hide_empty' => false,
            )
        );

        //include WC()->plugin_path() . '/includes/admin/views/html-bulk-edit-product.php';
    }

    /**
     * Custom quick edit - form.
     *
     * @param string $column_name Column being shown.
     * @param string $post_type Post type being shown.
     */
    public function quick_edit($column_name, $post_type)
    {
        if ('price' !== $column_name || 'product' !== $post_type) {
            return;
        }

        $shipping_class = get_terms(
            'product_shipping_class',
            array(
                'hide_empty' => false,
            )
        );

        //include WC()->plugin_path() . '/includes/admin/views/html-quick-edit-product.php';
    }

    /**
     * Offers a way to hook into save post without causing an infinite loop
     * when quick/bulk saving product info.
     *
     * @since 3.0.0
     * @param int $post_id Post ID being saved.
     * @param object $post Post object being saved.
     */
    public function bulk_and_quick_edit_hook($post_id, $post)
    {
        remove_action('save_post', array($this, 'bulk_and_quick_edit_hook'));
        do_action('yatra_product_bulk_and_quick_edit', $post_id, $post);
        add_action('save_post', array($this, 'bulk_and_quick_edit_hook'), 10, 2);
    }

    /**
     * Quick and bulk edit saving.
     *
     * @param int $post_id Post ID being saved.
     * @param object $post Post object being saved.
     * @return int
     */
    public function bulk_and_quick_edit_save_post($post_id, $post)
    {
        // If this is an autosave, our form has not been submitted, so we don't want to do anything.
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return $post_id;
        }

        // Don't save revisions and autosaves.
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id) || 'product' !== $post->post_type || !current_user_can('edit_post', $post_id)) {
            return $post_id;
        }

        // Check nonce.
        if (!isset($_REQUEST['yatra_quick_edit_nonce']) || !wp_verify_nonce($_REQUEST['yatra_quick_edit_nonce'], 'yatra_quick_edit_nonce')) { // WPCS: input var ok, sanitization ok.
            return $post_id;
        }

        // Get the product and save.
        $product = ($post);

        if (!empty($_REQUEST['yatra_quick_edit'])) { // WPCS: input var ok.
            $this->quick_edit_save($post_id, $product);
        } else {
            $this->bulk_edit_save($post_id, $product);
        }

        return $post_id;
    }


    /**
     * Disable the auto-save functionality for Orders.
     */
    public function disable_autosave()
    {
        global $post;

        if ($post && in_array(get_post_type($post->ID), wc_get_order_types('order-meta-boxes'), true)) {
            wp_dequeue_script('autosave');
        }
    }

    /**
     * Output extra data on post forms.
     *
     * @param WP_Post $post Current post object.
     */
    public function edit_form_top($post)
    {
        echo '<input type="hidden" id="original_post_title" name="original_post_title" value="' . esc_attr($post->post_title) . '" />';
    }

    /**
     * Change title boxes in admin.
     *
     * @param string $text Text to shown.
     * @param WP_Post $post Current post object.
     * @return string
     */
    public function enter_title_here($text, $post)
    {
        switch ($post->post_type) {
            case 'product':
                $text = esc_html__('Product name', 'yatra');
                break;
            case 'shop_coupon':
                $text = esc_html__('Coupon code', 'yatra');
                break;
        }
        return $text;
    }

    /**
     * Print coupon description textarea field.
     *
     * @param WP_Post $post Current post object.
     */
    public function edit_form_after_title($post)
    {
        if ('shop_coupon' === $post->post_type) {
            ?>
            <textarea id="yatra-coupon-description" name="excerpt" cols="5" rows="2"
                      placeholder="<?php esc_attr_e('Description (optional)', 'yatra'); ?>"><?php echo $post->post_excerpt; // WPCS: XSS ok. ?></textarea>
            <?php
        }
    }

    /**
     * Hidden default Meta-Boxes.
     *
     * @param  array $hidden Hidden boxes.
     * @param  object $screen Current screen.
     * @return array
     */
    public function hidden_meta_boxes($hidden, $screen)
    {
        if ('product' === $screen->post_type && 'post' === $screen->base) {
            $hidden = array_merge($hidden, array('postcustom'));
        }

        return $hidden;
    }

    /**
     * Add a post display state for special WC pages in the page list table.
     *
     * @param array $post_states An array of post display states.
     * @param WP_Post $post The current post object.
     */
    public function add_display_post_states($post_states, $post)
    {

        return $post_states;
    }
}

new Yatra_Admin_Post_Types();
