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


    public $tour_metabox;

    /**
     * Main Yatra Instance.
     *
     * Ensures only one instance of Yatra is loaded or can be loaded.
     *
     * @since 1.0.0
     * @static
     * @return Yatra - Yatra_Metabox
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
        $this->tour_metabox = new Yatra_Metabox_Booking_CPT();

    }




}

return Yatra_Metabox::instance();
