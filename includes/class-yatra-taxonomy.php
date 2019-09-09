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


    /**
     * The single instance of the class.
     *
     * @var Yatra_Taxonomy_Destination
     * @since 1.0.0
     */

    public $destination_taxonomy;


    /**
     * The single instance of the class.
     *
     * @var Yatra_Taxonomy_Activity
     * @since 1.0.0
     */
    public $activity_taxonomy;


    /**
     * The single instance of the class.
     *
     * @var Yatra_Taxonomy_Attributes
     * @since 1.0.0
     */
    public $attribute_taxonomy;


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
     * Hook into actions and filters.
     *
     * @since 1.0.0
     */
    public function load()
    {

        $this->destination_taxonomy = new Yatra_Taxonomy_Destination();
        $this->activity_taxonomy = new Yatra_Taxonomy_Activity();
        $this->attribute_taxonomy = new Yatra_Taxonomy_Attributes();

    }

    public function init_taxonomy()
    {
        $this->destination_taxonomy->init();
        $this->activity_taxonomy->init();
        $this->attribute_taxonomy->init();
    }

    public function init()
    {
        $this->load();
        $this->init_taxonomy();

    }


}

Yatra_Taxonomy::instance()->init();
