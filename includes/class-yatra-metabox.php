<?php
/**
 * Yatra_Metabox
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
class Yatra_Metabox
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
     * @var Yatra_Metabox_Tour_CPT
     * @since 2.1.4
     */
    public $tour_metabox;

    /**
     * The single instance of the class.
     *
     * @var Yatra_Metabox_Booking_CPT
     * @since 2.1.4
     */
    public $booking_metabox;

    /**
     * The single instance of the class.
     *
     * @var Yatra_Metabox_Coupons_CPT
     * @since 2.1.4
     */
    public $coupons_metabox;

    /**
     * Main Yatra Instance.
     *
     * Ensures only one instance of Yatra is loaded or can be loaded.
     *
     * @return Yatra - Yatra_Metabox
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


    /**
     * Yatra Constructor.
     */
    public function __construct()
    {
        $this->init();
    }


    /**
     * Hook into actions and filters.
     *
     * @since 1.0.0
     */
    private function init()
    {

        $this->tour_metabox = new Yatra_Metabox_Tour_CPT();
        $this->booking_metabox = new Yatra_Metabox_Booking_CPT();
        $this->coupons_metabox = new Yatra_Metabox_Coupons_CPT();

    }


}

return Yatra_Metabox::instance();
