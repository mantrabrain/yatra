<?php
/**
 * Yatra compatibility setup
 *
 * @package Yatra
 * @since   1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Main Yatra_Compatibility Class.
 *
 * @class Yatra
 */
final class Yatra_Compatibility
{

    /**
     * The single instance of the class.
     *
     * @var Yatra_Compatibility
     * @since 1.0.0
     */
    protected static $_instance = null;


    /**
     * Main Yatra_Compatibility Instance.
     *
     * Ensures only one instance of Yatra_Compatibility is loaded or can be loaded.
     *
     * @return Yatra_Compatibility - Main instance.
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
     * Cloning is forbidden.
     *
     * @since 1.0.0
     */
    public function __clone()
    {
        _doing_it_wrong(__FUNCTION__, __('Cloning is forbidden.', 'yatra'), '1.0.0');
    }

    /**
     * Unserializing instances of this class is forbidden.
     *
     * @since 1.0.0
     */
    public function __wakeup()
    {
        _doing_it_wrong(__FUNCTION__, __('Unserializing instances of this class is forbidden.', 'yatra'), '1.0.0');
    }

    /**
     * Auto-load in-accessible properties on demand.
     *
     * @param mixed $key Key name.
     * @return mixed
     */
    public function __get($key)
    {
        if (in_array($key, array(''), true)) {
            return $this->$key();
        }
    }

    /**
     * Yatra Constructor.
     */
    public function __construct()
    {
        $this->includes();
        $this->init_hooks();
    }

    /**
     * Hook into actions and filters.
     *
     * @since 1.0.0
     */
    private function init_hooks()
    {
        add_action('after_setup_theme', array($this, 'theme_file_includes'));

    }

    public function theme_file_includes()
    {
        $theme = wp_get_theme(get_template());

        $theme_name = $theme->get_template();

        if (file_exists(YATRA_ABSPATH . "includes/compatibility/themes/{$theme_name}/class-yatra-compatibility-themes-{$theme_name}.php")) {
            
            include_once YATRA_ABSPATH . "includes/compatibility/themes/{$theme_name}/class-yatra-compatibility-themes-{$theme_name}.php";

        }
    }

    /**
     * Include required core files used in admin.
     */
    public function includes()
    {


    }


}

Yatra_Compatibility::instance();