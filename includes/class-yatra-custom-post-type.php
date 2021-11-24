<?php
/**
 * Yatra_Custom_Post_Type
 *
 * @package Yatra
 * @since   1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Yatra Metabox Class.
 *
 * @class Yatra
 */
class Yatra_Custom_Post_Type
{


    /**
     * The single instance of the class.
     *
     * @var Yatra
     * @since 1.0.0
     */
    protected static $_instance = null;

    /**
     * The single instance of the class.
     *
     * @var Yatra_Custom_Post_Type_Tour
     * @since 1.0.0
     */
    public $tour;

    /**
     * The single instance of the class.
     *
     * @var Yatra_Custom_Post_Type_Booking
     * @since 1.0.0
     */
    public $booking;

    /**
     * The single instance of the class.
     *
     * @var Yatra_Custom_Post_Type_Customers
     * @since 1.0.0
     */
    public $customers;
    /**
     * The single instance of the class.
     *
     * @var Yatra_Custom_Post_Type_Coupons
     * @since 1.0.0
     */
    public $coupons;


    /**
     * Main Yatra Instance.
     *
     * Ensures only one instance of Yatra is loaded or can be loaded.
     *
     * @return Yatra_Custom_Post_Type - Yatra_Custom_Post_Type
     * @since 1.0.0
     * @static
     */
    public static function instance()
    {
        if (is_null(self::$_instance)) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }


    public function maybe_flush_rewrite_rules()
    {
        if ('yes' === get_option('yatra_queue_flush_rewrite_rules')) {
            update_option('yatra_queue_flush_rewrite_rules', 'no');
            $this->flush_rewrite_rules();
        }
    }

    /**
     * Hook into actions and filters.
     *
     * @since 1.0.0
     */
    public function load()
    {

        $this->tour = new Yatra_Custom_Post_Type_Tour();
        $this->booking = new Yatra_Custom_Post_Type_Booking();
        $this->customers = new Yatra_Custom_Post_Type_Customers();
        $this->coupons = new Yatra_Custom_Post_Type_Coupons();

    }

    /**
     * Flush rewrite rules.
     */
    public function flush_rewrite_rules()
    {
        flush_rewrite_rules();
    }

    public function hooks()
    {
        add_action('yatra_flush_rewrite_rules', array($this, 'flush_rewrite_rules'));
        add_action('yatra_after_register_post_type', array($this, 'maybe_flush_rewrite_rules'));


    }

    public function init_cpt()
    {
        $this->tour->init();
        $this->booking->init();
        $this->customers->init();
        $this->coupons->init();


    }

    public function init()
    {
        $this->hooks();
        $this->load();
        $this->init_cpt();

    }

}

Yatra_Custom_Post_Type::instance()->init();
