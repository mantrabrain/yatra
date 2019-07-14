<?php
/**
 * Yatra setup
 *
 * @package Yatra
 * @since   1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Main Yatra Class.
 *
 * @class Yatra
 */
final class Yatra
{

    /**
     * Yatra version.
     *
     * @var string
     */
    public $version = YATRA_VERSION;


    /**
     * Cart instance.
     *
     * @var Yatra_Cart
     */
    public $cart = null;
    /**
     * The single instance of the class.
     *
     * @var Yatra
     * @since 1.0.0
     */
    protected static $_instance = null;


    /**
     * Main Yatra Instance.
     *
     * Ensures only one instance of Yatra is loaded or can be loaded.
     *
     * @since 1.0.0
     * @static
     * @see mb_aec_addons()
     * @return Yatra - Main instance.
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
        $this->define_constants();
        $this->includes();
        $this->init_hooks();
        do_action('yatra_loaded');
    }

    /**
     * Hook into actions and filters.
     *
     * @since 1.0.0
     */
    private function init_hooks()
    {

        register_activation_hook(YATRA_FILE, array('Yatra_Install', 'install'));

        add_action('init', array($this, 'init'), 0);
        add_action('init', array('Yatra_Shortcodes', 'init'));


    }

    /**
     * Define Yatra Constants.
     */
    private function define_constants()
    {

        $this->define('YATRA_ABSPATH', dirname(YATRA_FILE) . '/');
        $this->define('YATRA_BASENAME', plugin_basename(YATRA_FILE));
    }

    /**
     * Define constant if not already set.
     *
     * @param string $name Constant name.
     * @param string|bool $value Constant value.
     */
    private function define($name, $value)
    {
        if (!defined($name)) {
            define($name, $value);
        }
    }

    /**
     * What type of request is this?
     *
     * @param  string $type admin, ajax, cron or frontend.
     * @return bool
     */
    private function is_request($type)
    {
        switch ($type) {
            case 'admin':
                return is_admin();
            case 'ajax':
                return defined('DOING_AJAX');
            case 'cron':
                return defined('DOING_CRON');
            case 'frontend':
                return (!is_admin() || defined('DOING_AJAX')) && !defined('DOING_CRON') && !defined('REST_REQUEST');
        }
    }

    /**
     * Include required core files used in admin and on the frontend.
     */
    public function includes()
    {

        /**
         * Class autoloader.
         */
        include_once YATRA_ABSPATH . 'includes/class-yatra-autoloader.php';
        include_once YATRA_ABSPATH . 'includes/functions.php';
        include_once YATRA_ABSPATH . 'includes/yatra-hooks.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-page-templater.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-custom-post-type.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-taxonomy.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-metabox.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-shortcodes.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-ajax.php';


        // Compatibility
        include_once YATRA_ABSPATH . 'includes/class-yatra-compatibility.php';


        if ($this->is_request('admin')) {
            Yatra_Admin::instance();
        }

        if ($this->is_request('frontend')) {
            Yatra_Frontend::instance();
        }

    }


    /**
     * Init Yatra when WordPress Initialises.
     */
    public function init()
    {
        // Before init action.
        do_action('before_yatra_init');

        // Set up localisation.
        $this->load_plugin_textdomain();


        // Classes/actions loaded for the frontend and for ajax requests.
        if ($this->is_request('frontend')) {
            $this->initialize_cart();
        }

        // Init action.
        do_action('yatra_init');
    }

    /**
     * Load Localisation files.
     *
     * Note: the first-loaded translation file overrides any following ones if the same translation is present.
     *
     * Locales found in:
     *      - WP_LANG_DIR/yatra/yatra-LOCALE.mo
     *      - WP_LANG_DIR/plugins/yatra-LOCALE.mo
     */
    public function load_plugin_textdomain()
    {
        $locale = is_admin() && function_exists('get_user_locale') ? get_user_locale() : get_locale();
        $locale = apply_filters('plugin_locale', $locale, 'yatra');
        unload_textdomain('yatra');
        load_textdomain('yatra', WP_LANG_DIR . '/yatra/yatra-' . $locale . '.mo');
        load_plugin_textdomain('yatra', false, plugin_basename(dirname(YATRA_FILE)) . '/i18n/languages');
    }

    /**
     * Ensure theme and server variable compatibility and setup image sizes.
     */
    public function setup_environment()
    {

        $this->define('YATRA_TEMPLATE_PATH', $this->template_path());

    }

    /**
     * Get the plugin url.
     *
     * @return string
     */
    public function plugin_url()
    {
        return untrailingslashit(plugins_url('/', YATRA_FILE));
    }

    /**
     * Get the plugin path.
     *
     * @return string
     */
    public function plugin_path()
    {
        return untrailingslashit(plugin_dir_path(YATRA_FILE));
    }

    /**
     * Get the template path.
     *
     * @return string
     */
    public function template_path()
    {
        return apply_filters('yatra_template_path', 'yatra/');
    }

    /**
     * Get the template path.
     *
     * @return string
     */
    public function plugin_template_path()
    {
        return apply_filters('yatra_plugin_template_path', $this->plugin_path() . '/templates/');
    }

    /**
     * Get Ajax URL.
     *
     * @return string
     */
    public function ajax_url()
    {
        return admin_url('admin-ajax.php', 'relative');
    }

    /**
     * Initialize the customer and cart objects and setup customer saving on shutdown.
     *
     * @since 2.0.0
     * @return void
     */
    public function initialize_cart()
    {

        if (is_null($this->cart) || !$this->cart instanceof Yatra_Cart) {
            $this->cart = new Yatra_Cart();
        }
    }


}
