<?php
/**
 * Yatra install setup
 *
 * @package Yatra
 * @since   1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Main Yatra_Install Class.
 *
 * @class Yatra
 */
final class Yatra_Install
{

    private static $update_callbacks = array(
        '2.1.0' => array(
            'yatra_update_2100_tour_dates_table_create',
        ),
        '2.1.3' => array(
            'yatra_update_2130_logs_update',
        ),
        '2.1.6' => array(
            'yatra_update_2160_tour_minimum_price',
        )
    );

    public static function install()
    {
        if (!is_blog_installed()) {
            return;
        }

        $yatra_version = get_option('yatra_plugin_version');

        if (empty($yatra_version)) {
            self::create_tables();
            self::create_options();
            if (empty($yatra_version) && apply_filters('yatra_enable_setup_wizard', true)) {
                set_transient('_yatra_activation_redirect', 1, 30);
            }
        }
        //save install date
        if (false == get_option('yatra_install_date')) {
            update_option('yatra_install_date', current_time('timestamp'));
        }

        self::setup_environment();
        self::versionwise_update();
        self::update_yatra_version();


        do_action('yatra_flush_rewrite_rules');


    }

    public static function setup_environment()
    {

        $post_type = new Yatra_Custom_Post_Type();
        $post_type->load();
        $post_type->tour->register();

        $taxonomy = new Yatra_Taxonomy();
        $taxonomy->load();
        $taxonomy->destination_taxonomy->register();
        $taxonomy->attribute_taxonomy->register();
    }

    private static function create_options()
    {
        $pages = array(

            array(
                'post_content' => '[yatra_checkout]',
                'post_title' => 'Yatra Checkout',
                'post_status' => 'publish',
                'post_type' => 'page',
                'comment_status' => 'closed'

            ), array(
                'post_content' => '[yatra_cart]',
                'post_title' => 'Yatra Cart',
                'post_status' => 'publish',
                'post_type' => 'page',
                'comment_status' => 'closed'

            ), array(
                'post_content' => '[yatra_my_account]',
                'post_title' => 'Yatra My Account',
                'post_status' => 'publish',
                'post_type' => 'page',
                'comment_status' => 'closed'

            ), array(
                'post_content' => 'Your booking has been confirmed. We will get back to you soon.',
                'post_title' => 'Yatra Thank You',
                'post_status' => 'publish',
                'post_type' => 'page',
                'comment_status' => 'closed'

            ),
            array(
                'post_content' => 'Your transaction failed, please try again or contact site support.',
                'post_title' => 'Yatra Transaction Failed',
                'post_status' => 'publish',
                'post_type' => 'page',
                'comment_status' => 'closed'

            ),
        );

        foreach ($pages as $page) {

            $page_id = wp_insert_post($page);

            if ($page['post_title'] == 'Yatra Checkout') {
                update_option('yatra_checkout_page', $page_id);
            }
            if ($page['post_title'] == 'Yatra Cart') {
                update_option('yatra_cart_page', $page_id);
            }
            if ($page['post_title'] == 'Yatra Thank You') {
                update_option('yatra_thankyou_page', $page_id);
            }
            if ($page['post_title'] == 'Yatra My Account') {
                update_option('yatra_my_account_page', $page_id);
            }
            if ($page['post_title'] == 'Yatra Transaction Failed') {
                update_option('yatra_failed_transaction_page', $page_id);
            }

        }

        $terms = array(
            array(
                'term' => 'Altitude',
                'taxonomy' => 'attributes',
                'slug' => 'altitude',
                'meta' => array(
                    'attribute_field_type' => 'text_field',
                    'yatra_attribute_meta' => array(
                        'content' => ''
                    )
                )
            ), array(
                'term' => 'Height',
                'taxonomy' => 'attributes',
                'slug' => 'height',
                'meta' => array(
                    'attribute_field_type' => 'text_field',
                    'yatra_attribute_meta' => array(
                        'content' => ''
                    )
                )
            ),
        );

        foreach ($terms as $term) {

            $term_id = wp_insert_term(
                $term['term'], // the term
                $term['taxonomy'], // the taxonomy
                array(
                    'slug' => $term['slug'],
                )
            );
            $meta = isset($term['meta']) ? $term['meta'] : array();

            foreach ($meta as $meta_key => $meta_value) {

                add_term_meta($term_id, $meta_key, $meta_value, true);

            }
        }

        $tour_tab_configs = yatra_tour_tab_default_configurations();

        $config_keys = array_keys($tour_tab_configs);

        $options = array(
            'yatra_currency' => 'USD',
            'yatra_booknow_button_text' => 'Book Now',
            'yatra_booknow_loading_text' => 'Loading....',
            'yatra_booking_form_title_text' => 'Booking Form',
            'yatra_enquiry_form_title_text' => 'Enquiry Form',
            'yatra_enquiry_button_text' => 'Send Enquiry',
            'yatra_select_date_title' => 'Please select date',
            'yatra_custom_attributes_title_text' => 'Attributes',
            'yatra_update_cart_text' => 'Update Cart',
            'yatra_proceed_to_checkout_text' => 'Proceed to Checkout',
            'yatra_order_booking_text' => 'Order Booking',
            'yatra_booking_notification_email_subject_for_customer' => Yatra_Admin_Emails_To_User::get_booking_completed_subject(),
            'yatra_booking_notification_email_content_for_customer' => Yatra_Admin_Emails_To_User::get_booking_completed_message(),
            'yatra_enable_booking_notification_email_for_customer' => 'yes',
            'yatra_enable_guest_checkout' => 'yes',
            'yatra_payment_gateways' => array('booking_only' => 'yes')
        );

        foreach ($options as $option_key => $option_value) {

            update_option($option_key, $option_value);
        }

    }

    private static function versionwise_update()
    {
        $yatra_version = get_option('yatra_plugin_version', null);

        if ($yatra_version == '' || $yatra_version == null || empty($yatra_version)) {
            return;
        }
        if (version_compare($yatra_version, YATRA_VERSION, '<')) { // 2.0.15 < 2.0.16

            foreach (self::$update_callbacks as $version => $callbacks) {

                if (version_compare($yatra_version, $version, '<')) { // 2.0.15 < 2.0.16

                    self::exe_update_callback($callbacks);
                }
            }
        }
    }

    private static function exe_update_callback($callbacks)
    {
        include_once YATRA_ABSPATH . 'includes/yatra-update-functions.php';

        foreach ($callbacks as $callback) {

            call_user_func($callback);

        }
    }

    /**
     * Update Yatra version to current.
     */
    private static function update_yatra_version()
    {
        delete_option('yatra_plugin_version');
        delete_option('yatra_plugin_db_version');
        add_option('yatra_plugin_version', YATRA_VERSION);
        add_option('yatra_plugin_db_version', YATRA_VERSION);
    }

    public static function init()
    {

        add_action('init', array(__CLASS__, 'check_version'), 5);


    }

    public static function check_version()
    {
        if (!defined('IFRAME_REQUEST') && version_compare(get_option('yatra_plugin_version'), YATRA_VERSION, '<')) {
            self::install();
            do_action('yatra_updated');
        }
    }

    private static function create_tables()
    {
        global $wpdb;

        $wpdb->hide_errors();

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';


        $all_schemes = self::get_schema();

        foreach ($all_schemes as $scheme) {
            dbDelta($scheme);
        }


    }

    private static function get_schema()
    {
        global $wpdb;

        $table_prefix = $wpdb->prefix . 'yatra_';

        $collate = '';

        if ($wpdb->has_cap('collation')) {
            $collate = $wpdb->get_charset_collate();
        }
        // User Item Meta Table
        $tables[] = "CREATE TABLE IF NOT EXISTS {$table_prefix}" . Yatra_Tables::TOUR_DATES . " (
		  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
		  tour_id BIGINT(20) UNSIGNED NOT NULL,
		  slot_group_id BIGINT(20) UNSIGNED NOT NULL,
    	  user_id BIGINT(20) UNSIGNED NOT NULL,
		  start_date timestamp NULL DEFAULT NULL,
		  end_date timestamp NULL DEFAULT NULL,
		  pricing LONGTEXT DEFAULT NULL,
		  pricing_type VARCHAR(50) DEFAULT NULL,
		  max_travellers INT DEFAULT NULL,
		  active tinyint DEFAULT '0',
		  availability VARCHAR(50) DEFAULT NULL,
		  note_to_customer TEXT DEFAULT NULL,
		  note_to_admin TEXT DEFAULT NULL,
		  created_by BIGINT(20) UNSIGNED NOT NULL,
		  updated_by BIGINT(20) UNSIGNED NOT NULL,
		  created_at timestamp NULL DEFAULT NULL,
		  updated_at timestamp NULL DEFAULT NULL,
		  PRIMARY KEY  (id)
		  ) $collate;
		  ";


        $tables[] = "CREATE TABLE IF NOT EXISTS {$table_prefix}" . Yatra_Tables::TOUR_ENQUIRIES . " (
		  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
		  tour_id BIGINT(20) NULL DEFAULT NULL,
		  fullname VARCHAR(255)  NOT NULL,
		  email VARCHAR(100)  NOT NULL,
		  country VARCHAR(20) NULL DEFAULT NULL,
		  phone_number VARCHAR(20) DEFAULT NULL,
		  number_of_adults INT DEFAULT NULL,
		  number_of_childs INT DEFAULT NULL,
		  message TEXT NOT NULL,
          subject TEXT NOT NULL,
          additional_fields TEXT DEFAULT NULL,
          ip_address varchar(255) DEFAULT NULL,
		  created_at timestamp NULL DEFAULT NULL,
		  PRIMARY KEY  (id)
		  ) $collate;
		  ";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$table_prefix}" . Yatra_Tables::TOUR_BOOKING_STATS . " (
		  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    	  booking_id BIGINT(20) UNSIGNED NOT NULL,
    	  tour_id BIGINT(20) UNSIGNED NOT NULL,
    	  customer_id BIGINT(20) UNSIGNED NOT NULL,
    	  booked_date TIMESTAMP NOT NULL DEFAULT '0000-00-00 00:00:00',
		  currency VARCHAR(50)  NOT NULL,
 		  total_number_of_pax INT NOT NULL DEFAULT 0,
		  gross_total_price DOUBLE NOT NULL DEFAULT 0,
		  net_total_price DOUBLE NOT NULL DEFAULT 0,
          ip_address varchar(255) DEFAULT NULL,
		  created_at timestamp NULL DEFAULT NULL,
		  PRIMARY KEY  (id)
		  ) $collate;
		  ";

        $tables[] = "CREATE TABLE IF NOT EXISTS {$table_prefix}" . Yatra_Tables::LOGS . " (
          log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          timestamp datetime NOT NULL,
          level smallint(4) NOT NULL,
          source varchar(200) NOT NULL,
          message longtext NOT NULL,
          context longtext NULL,
          PRIMARY KEY (log_id),
          KEY level (level)
        ) $collate;
		  ";

        return $tables;
    }

    public static function get_tables()
    {
        global $wpdb;

        $table_prefix = $wpdb->prefix . 'yatra_';

        $tables = array(
            "{$table_prefix}" . Yatra_Tables::TOUR_DATES,
            "{$table_prefix}" . Yatra_Tables::TOUR_ENQUIRIES,
            "{$table_prefix}" . Yatra_Tables::TOUR_BOOKING_STATS,
            "{$table_prefix}" . Yatra_Tables::LOGS,
        );

        /**
         * Filter the list of known yatra tables.
         *
         * If yatra plugins need to add new tables, they can inject them here.
         *
         * @param array $tables An array of yatra-specific database table names.
         */
        $tables = apply_filters('yatra_install_get_tables', $tables);

        return $tables;
    }

    public static function verify_base_tables($execute = false)
    {
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        if ($execute) {
            self::create_tables();
        }
    }

    public static function drop_tables()
    {
        global $wpdb;

        $tables = self::get_tables();

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS {$table}"); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        }
    }


}

Yatra_Install::init();
