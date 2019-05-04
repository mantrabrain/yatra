<?php
/**
 * Yatra_Taxonomy
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
class Yatra_Taxonomy
{


    /**
     * The single instance of the class.
     *
     * @var Yatra
     * @since 1.0.0
     */
    protected static $_instance = null;


    public $destination_taxonomy;

    public $activity_taxonomy;

    /**
     * Main Yatra Instance.
     *
     * Ensures only one instance of Yatra is loaded or can be loaded.
     *
     * @since 1.0.0
     * @static
     * @return Yatra - Yatra_Taxonomy
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

        $this->destination_taxonomy = new Yatra_Taxonomy_Destination();
        $this->activity_taxonomy = new Yatra_Taxonomy_Activity();

    }


}

return Yatra_Taxonomy::instance();
