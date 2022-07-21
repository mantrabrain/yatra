<?php
/**
 * Yatra Autoloader.
 *
 * @package Yatra/Classes
 * @version 1.0.0
 */

defined('ABSPATH') || exit;

/**
 * Autoloader class.
 */
class Yatra_Autoloader
{

    /**
     * Path to the includes directory.
     *
     * @var string
     */
    private $include_path = '';

    /**
     * The Constructor.
     */
    public function __construct()
    {
        if (function_exists('__autoload')) {
            spl_autoload_register('__autoload');
        }

        spl_autoload_register(array($this, 'autoload'));

        $this->include_path = untrailingslashit(plugin_dir_path(YATRA_FILE)) . '/includes/';
    }

    /**
     * Take a class name and turn it into a file name.
     *
     * @param string $class Class name.
     * @return string
     */
    private function get_file_name_from_class($class)
    {
        return 'class-' . str_replace('_', '-', $class) . '.php';
    }

    /**
     * Include a class file.
     *
     * @param string $path File path.
     * @return bool Successful or not.
     */
    private function load_file($path)
    {
        if ($path && is_readable($path)) {
            include_once $path;
            return true;
        }
        return false;
    }

    /**
     * Auto-load Yatra classes on demand to reduce memory consumption.
     *
     * @param string $main_class Class name.
     */
    public function autoload($main_class)
    {

        $class = strtolower($main_class);

        if (0 !== strpos($class, 'yatra_') && 0 !== strpos($class, 'yatra\\core\\')) {
            return;
        }

        $file = $this->get_file_name_from_class($class);


        $path = '';

        if (0 === strpos($class, 'yatra_shortcode')) {
            $path = $this->include_path . 'shortcodes/';
        } elseif (0 === strpos($class, 'yatra_widget')) {
            $path = $this->include_path . 'widgets/';
        } elseif (0 === strpos($class, 'yatra_metabox')) {
            $path = $this->include_path . 'meta-boxes/';
        } elseif (0 === strpos($class, 'yatra_taxonomy')) {
            $path = $this->include_path . 'taxonomy/';
        } elseif (0 === strpos($class, 'yatra_custom_post_type')) {
            $path = $this->include_path . 'custom-post-type/';
        } elseif (0 === strpos($class, 'yatra_admin')) {
            $path = $this->include_path . 'admin/';
        } elseif (0 === strpos($class, 'yatra_customizer_control')) {
            $path = $this->include_path . 'customizer/control/';
        } elseif (0 === strpos($class, 'yatra_helper')) {
            $path = $this->include_path . 'helper/';
        } elseif (0 === strpos($class, 'yatra_interface')) {
            $path = $this->include_path . 'interfaces/';
        } elseif (0 === strpos($class, 'yatra_log_handler')) {
            $path = $this->include_path . 'log-handlers/';
        } elseif (0 === strpos($class, 'yatra\\core\\')) {
            $class_path = str_replace('Yatra\\Core\\', '', $main_class);
            $class_path = str_replace('\\', '/', $class_path);
            $class_path = trim($class_path, "/");
            $path = untrailingslashit(plugin_dir_path(YATRA_FILE)) . '/core/' . $class_path;
            $file = '.php';
        }

        if (empty($path) || !$this->load_file($path . $file)) {

            $this->load_file($this->include_path . $file);
        }
    }
}

new Yatra_Autoloader();
