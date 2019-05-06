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


    public $tour;


    public $booking;


    /**
     * Main Yatra Instance.
     *
     * Ensures only one instance of Yatra is loaded or can be loaded.
     *
     * @since 1.0.0
     * @static
     * @return Yatra - Yatra_Custom_Post_Type
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

        $this->tour = new Yatra_Custom_Post_Type_Tour();
        $this->booking = new Yatra_Custom_Post_Type_Booking();

    }


}

return Yatra_Custom_Post_Type::instance();
