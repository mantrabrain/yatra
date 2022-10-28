<?php

namespace Yatra\Core;

defined('ABSPATH') || exit;

class Tour
{

    /**
     * The Tour ID
     *
     * @since 2.1.12
     */
    public $ID = 0;

    /**
     * The download price
     *
     * @since 2.1.12
     */
    private $price = 0;

    /**
     * The tour prices, if Variable Prices are enabled
     *
     * @since 2.1.12
     */
    private $prices = [];


    private $type;

    /**
     * Declare the default properties in WP_Post as we can't extend it
     * Anything we've declared above has been removed.
     */
    public $post_author = 0;
    public $post_date = '0000-00-00 00:00:00';
    public $post_date_gmt = '0000-00-00 00:00:00';
    public $post_content = '';
    public $post_title = '';
    public $post_excerpt = '';
    public $post_status = 'publish';
    public $comment_status = 'open';
    public $ping_status = 'open';
    public $post_password = '';
    public $post_name = '';
    public $to_ping = '';
    public $pinged = '';
    public $post_modified = '0000-00-00 00:00:00';
    public $post_modified_gmt = '0000-00-00 00:00:00';
    public $post_content_filtered = '';
    public $post_parent = 0;
    public $guid = '';
    public $menu_order = 0;
    public $post_mime_type = '';
    public $comment_count = 0;
    public $filter;

    /**
     * Get things going
     *
     * @since 2.1.12
     */
    public function __construct($_id = false)
    {
        $tour = \WP_Post::get_instance($_id);

        return $this->setup_tour($tour);
    }

    /**
     * Given the download data, let's set the variables
     *
     * @param \WP_Post $tour The WP_Post object for download.
     * @return bool             If the setup was successful or not
     * @since 2.1.12
     */
    private function setup_tour($tour)
    {

        if (!is_object($tour)) {
            return false;
        }

        if (!$tour instanceof \WP_Post) {
            return false;
        }

        if ('tour' !== $tour->post_type) {
            return false;
        }

        foreach ($tour as $key => $value) {
            $this->{$key} = $value;
        }

        return true;
    }

    /**
     * Magic __get function to dispatch a call to retrieve a private property
     *
     * @since 2.1.12
     */
    public function __get($key = '')
    {
        if (method_exists($this, "get_{$key}")) {
            return call_user_func(array($this, "get_{$key}"));
        } else {
            return new \WP_Error('yatra-tour-invalid-property', sprintf(__('Can\'t get property %s', 'easy-digital-downloads'), $key));
        }
    }

    /**
     * Creates a download
     *
     * @param array $data Array of attributes for a download
     * @return mixed  false if data isn't passed and class not instantiated for creation, or New Download ID
     * @since 2.1.12
     */
    public function create($data = array())
    {

        if ($this->id != 0) {
            return false;
        }

        $defaults = array(
            'post_type' => 'tour',
            'post_status' => 'draft',
            'post_title' => __('New Tour Package', 'easy-digital-downloads')
        );

        $args = wp_parse_args($data, $defaults);

        /**
         * Fired before a download is created
         *
         * @param array $args The post object arguments used for creation.
         */
        do_action('yatra_tour_pre_create', $args);

        $id = wp_insert_post($args, true);

        $tour = \WP_Post::get_instance($id);

        /**
         * Fired after a download is created
         *
         * @param int $id The post ID of the created item.
         * @param array $args The post object arguments used for creation.
         */
        do_action('yatra_tour_post_create', $id, $args);

        return $this->setup_tour($tour);
    }

    /**
     * Retrieve the ID
     *
     * @return int ID of the download
     * @since 2.1.12
     */
    public function get_ID()
    {
        return $this->ID;
    }

    /**
     * Retrieve the download name
     *
     * @return string Name of the download
     * @since 2.1.12
     */
    public function get_name()
    {
        return get_the_title($this->ID);
    }

    /**
     * Retrieve the price
     *
     * @return float Price of the download
     * @since 2.1.12
     */
    public function get_price()
    {

        /**
         * Override the tour price.
         *
         * @param string $price The tour price(s).
         * @param string|int $id The tour ID.
         * @since 2.1.12
         *
         */
        return apply_filters('yatra_get_tour_price', $this->price, $this->ID);
    }

    /**
     * Retrieve the variable prices
     *
     * @return array List of the variable prices
     * @since 2.1.12
     */
    public function get_prices()
    {

        $this->prices = array();


        /**
         * Override variable prices
         *
         * @param array $prices The array of variables prices.
         * @param int|string The ID of the download.
         * @since 2.1.12
         *
         */
        return apply_filters('yatra_get_variable_prices', $this->prices, $this->ID);
    }

    public function get_type()
    {
        if (!isset($this->type)) {
            $this->type = 'default';
        }

        return apply_filters('yatra_get_tour_type', $this->type, $this->ID);
    }

    /**
     * Retrieve the sale count for the download
     *
     * @return int Number of times this has been purchased
     * @since 2.1.12
     */
    public function get_sales()
    {


        return $this->sales;
    }

    /**
     * Retrieve the total earnings for the download
     *
     * @return float Total download earnings
     * @since 2.1.12
     */
    public function get_earnings()
    {

        return $this->earnings;
    }


    /**
     * Updates the gross sales and earnings for a download.
     *
     * @return void
     * @since 2.1.12
     */
    public function recalculate_gross_sales_earnings()
    {

    }

    /**
     * Recalculates the net sales and earnings for a download.
     *
     * @return void
     * @since 2.1.12
     */
    public function recalculate_net_sales_earnings()
    {

    }

    /**
     * Determine if the download is free or if the given price ID is free
     *
     * @param bool $price_id ID of variation if needed
     * @return bool True when the download is free, false otherwise
     * @since 2.1.12
     */
    public function is_free($price_id = false)
    {

        $is_free = false;

        return (bool)apply_filters('yatra_is_free_tour', $is_free, $this->ID, $price_id);
    }

    /**
     * Updates a single meta entry for the tour package
     *
     * @param string $meta_key The meta_key to update
     * @param string|array|object $meta_value The value to put into the meta
     * @return bool             The result of the update query
     * @since 2.1.12
     * @access private
     */
    private function update_meta($meta_key = '', $meta_value = '')
    {
        global $wpdb;

        if (empty($meta_key) || (!is_numeric($meta_value) && empty($meta_value))) {
            return false;
        }

        // Make sure if it needs to be serialized, we do
        $meta_value = maybe_serialize($meta_value);

        if (is_numeric($meta_value)) {
            $value_type = is_float($meta_value) ? '%f' : '%d';
        } else {
            $value_type = "'%s'";
        }

        $sql = $wpdb->prepare("UPDATE $wpdb->postmeta SET meta_value = $value_type WHERE post_id = $this->ID AND meta_key = '%s'", $meta_value, $meta_key);

        if ($wpdb->query($sql)) {

            clean_post_cache($this->ID);

            return true;

        }

        return false;
    }

    /**
     * Checks if the tour can be purchased
     *
     * NOTE: Currently only checks on yatra_get_cart_contents() and yatra_add_to_cart()
     *
     * @return bool If the current user can purchase the Tour ID
     * @since 2.1.12
     */
    public function can_purchase()
    {
        $can_purchase = true;

        if ($this->post_status != 'publish') {
            $can_purchase = false;
        }

        return (bool)apply_filters('yatra_can_purchase_tour', $can_purchase, $this);
    }

}
