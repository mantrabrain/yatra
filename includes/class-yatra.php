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
     * Yatra_Error instance.
     *
     * @var WP_Error
     */
    public $yatra_error = null;

    /**
     * Yatra_Error instance.
     *
     * @var Yatra_Messages
     */
    public $yatra_messages = null;


    /**
     * Yatra_Core_Exporter instance.
     *
     * @var Yatra_Core_Exporter
     */
    public $exporter = null;

    /**
     * Yatra_Core_Importer instance.
     *
     * @var Yatra_Core_Importer
     */
    public $importer = null;
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
     * @return Yatra - Main instance.
     * @see mb_aec_addons()
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
        register_shutdown_function(array($this, 'log_errors'));
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
        $this->define('YATRA_ROUNDING_PRECISION', 6);
        $this->define('YATRA_REST_WEBHOOKS_NAMESPACE', 'yatra/v1/webhooks');
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
     * @param string $type admin, ajax, cron or frontend.
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


        // Autoloader

        include_once YATRA_ABSPATH . 'includes/class-yatra-autoloader.php';

        /*
         * Abstract Class
         */

        include_once YATRA_ABSPATH . 'includes/static/class-yatra-tables.php';
        include_once YATRA_ABSPATH . 'includes/abstracts/abstract-yatra-form.php';
        include_once YATRA_ABSPATH . 'includes/abstracts/abstract-yatra-payment-gateways.php';
        include_once YATRA_ABSPATH . 'includes/abstracts/abstract-yatra-log-levels.php';
        include_once YATRA_ABSPATH . 'includes/abstracts/abstract-yatra-log-handler.php';


        /**
         * Classes.
         */
        include_once YATRA_ABSPATH . 'includes/class-yatra-modules.php';

        include_once YATRA_ABSPATH . 'includes/class-yatra-install.php';
        include_once YATRA_ABSPATH . 'includes/classes/class-yatra-core-db.php';
        include_once YATRA_ABSPATH . 'includes/classes/class-yatra-core-coupon.php';

        include_once YATRA_ABSPATH . 'includes/class-yatra-tour-availability-validation.php';
        include_once YATRA_ABSPATH . 'includes/settings/class-yatra-tour-settings.php';
        include_once YATRA_ABSPATH . 'includes/payment-gateways/class-yatra-gateways-core.php';
        include_once YATRA_ABSPATH . 'includes/functions.php';
        include_once YATRA_ABSPATH . 'includes/yatra-hooks.php';
        include_once YATRA_ABSPATH . 'includes/yatra-template-functions.php';
        include_once YATRA_ABSPATH . 'includes/yatra-template-hooks.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-page-templater.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-email.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-custom-post-type.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-taxonomy.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-metabox.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-widgets.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-shortcodes.php';
        include_once YATRA_ABSPATH . 'includes/class-yatra-ajax.php';
        include_once YATRA_ABSPATH . 'includes/classes/class-yatra-core-tour-availability.php';


        // Compatibility
        include_once YATRA_ABSPATH . 'includes/class-yatra-compatibility.php';


        if ($this->is_request('admin')) {
            Yatra_Admin::instance();
        }

        if ($this->is_request('frontend')) {
            Yatra_Frontend::instance();
        }

        $this->yatra_error = new WP_Error;
        $this->yatra_messages = new Yatra_Messages;


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

        if ($this->is_request('admin')) {
            $this->exporter = new Yatra_Core_Exporter();
            $this->importer = new Yatra_Core_Importer();

        }

        // Classes/actions loaded for the frontend and for ajax requests.
        //if ($this->is_request('frontend')) {
        if (is_null($this->cart) || !$this->cart instanceof Yatra_Cart) {

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

    public function log_errors()
    {
        $error = error_get_last();
        if ($error && in_array($error['type'], array(E_ERROR, E_PARSE, E_COMPILE_ERROR, E_USER_ERROR, E_RECOVERABLE_ERROR), true)) {
            $logger = yatra_get_logger();
            $logger->critical(
            /* translators: 1: error message 2: file name and path 3: line number */
                sprintf(__('%1$s in %2$s on line %3$s', 'yatra'), $error['message'], $error['file'], $error['line']) . PHP_EOL,
                array(
                    'source' => 'fatal-errors',
                )
            );
            do_action('yatra_shutdown_error', $error);
        }
    }

    /**
     * Initialize the customer and cart objects and setup customer saving on shutdown.
     *
     * @return void
     * @since 2.0.0
     */
    public function initialize_cart()
    {

        if (is_null($this->cart) || !$this->cart instanceof Yatra_Cart) {
            $this->cart = new Yatra_Cart();
        }
    }

    public function get_log_dir($create_if_not_exists = true)
    {
        $wp_upload_dir = wp_upload_dir();

        $log_dir = $wp_upload_dir['basedir'] . '/yatra-logs/';

        if (!file_exists(trailingslashit($log_dir) . 'index.html') && $create_if_not_exists) {

            $files = array(
                array(
                    'base' => $log_dir,
                    'file' => 'index.html',
                    'content' => '',
                ),
                array(
                    'base' => $log_dir,
                    'file' => '.htaccess',
                    'content' => 'deny from all',
                )
            );

            $this->create_files($files, $log_dir);


        }
        return $log_dir;
    }

    public function get_upload_dir($create_if_not_exists = true)
    {
        $wp_upload_dir = wp_upload_dir();

        $upload_dir = $wp_upload_dir['basedir'] . '/yatra/';

        if (!file_exists(trailingslashit($upload_dir) . 'index.html') && $create_if_not_exists) {

            $files = array(
                array(
                    'base' => $upload_dir,
                    'file' => 'index.html',
                    'content' => '',
                ),
                array(
                    'base' => $upload_dir,
                    'file' => '.htaccess',
                    'content' => 'deny from all',
                )
            );

            $this->create_files($files, $upload_dir);


        }
        return $upload_dir;
    }

    private function create_files($files, $base_dir)
    {
        // Bypass if filesystem is read-only and/or non-standard upload system is used.
        if (apply_filters('yatra_install_skip_create_files', false)) {
            return;
        }

        if (file_exists(trailingslashit($base_dir) . 'index.html')) {
            return true;
        }
        $has_created_dir = false;

        foreach ($files as $file) {
            if (wp_mkdir_p($file['base']) && !file_exists(trailingslashit($file['base']) . $file['file'])) {
                $file_handle = @fopen(trailingslashit($file['base']) . $file['file'], 'w'); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_system_read_fopen
                if ($file_handle) {
                    fwrite($file_handle, $file['content']); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fwrite
                    fclose($file_handle); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose
                    if (!$has_created_dir) {
                        $has_created_dir = true;
                    }
                }
            }
        }
        if ($has_created_dir) {
            return true;
        }


    }

}
