<?php
/**
 * Yatra frontend setup
 *
 * @package Yatra
 * @since   1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Main Yatra_Frontend Class.
 *
 * @class Yatra
 */
final class Yatra_Frontend
{

    /**
     * The single instance of the class.
     *
     * @var Yatra_Frontend
     * @since 1.0.0
     */
    protected static $_instance = null;


    /**
     * Main Yatra_Frontend Instance.
     *
     * Ensures only one instance of Yatra_Frontend is loaded or can be loaded.
     *
     * @return Yatra_Frontend - Main instance.
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
        $this->includes();
        $this->init_hooks();
        do_action('yatra_frontend_loaded');
    }

    /**
     * Hook into actions and filters.
     *
     * @since 1.0.0
     */
    private function init_hooks()
    {


    }


    /**
     * Include required core files used in frontend.
     */
    public function includes()
    {
        include_once YATRA_ABSPATH . 'includes/class-yatra-form-handler.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-assets.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-frontend-tour-tabs.php';
        include_once YATRA_ABSPATH . 'includes/hooks/yatra-design-hooks.php';


    }


}
