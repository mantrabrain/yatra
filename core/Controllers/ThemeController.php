<?php

namespace Yatra\Core\Controllers;

class ThemeController
{
    protected $theme;

    protected $source;

    protected $current_theme;

    public function __construct($theme, $source = 'wordpress')
    {
        include_once ABSPATH . 'wp-admin/includes/file.php';
        include_once ABSPATH . 'wp-admin/includes/misc.php';
        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

        $this->theme = $theme;

        $this->set_current_theme();

        $this->source = 'wordpress';
    }

    private function set_current_theme()
    {
        $this->current_theme = wp_get_theme($this->theme);

    }

    private function get_source_zip_url()
    {

        return apply_filters('yatra_theme_controller_theme_source', "https://downloads.wordpress.org/theme/{$this->theme}.latest-stable.zip", $this->theme, $this->source);
    }

    public function install()
    {

        if ($this->is_installed()) {

            return true;
        }

        $theme_zip = $this->get_source_zip_url();

        wp_cache_flush();

        $upgrader = new \Theme_Upgrader();

        $upgrader->install($theme_zip);

        $this->set_current_theme();

        if ($this->is_installed()) {

            return true;
        }
        return false;
    }

    public function activate()
    {
        switch_theme($this->theme);

        if ($this->is_activated()) {

            return true;
        }
        return false;
    }

    public function install_and_activate()
    {
        if ($this->is_installed()) {

            return $this->activate();

        } else {

            ob_start();

            $this->install();

            $install = ob_get_clean();

            return $this->activate();

        }
    }

    public function is_installed()
    {
        if ($this->current_theme->exists()) {
            return true;
        }
        return false;
    }

    public function is_activated()
    {
        $active_theme = wp_get_theme();

        if ($active_theme->get_template() == $this->theme) {

            return true;
        }
        return false;
    }
}