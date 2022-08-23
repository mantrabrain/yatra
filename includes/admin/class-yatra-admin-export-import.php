<?php

class Yatra_Admin_Export_Import
{

    public function __construct()
    {
        add_filter('yatra_admin_main_submenu', array($this, 'importer_menu'));
        add_action('admin_enqueue_scripts', array($this, 'importer_scripts'), 11);
    }

    public function importer_menu($submenu)
    {
        $submenu[] = array(
            'parent_slug' => YATRA_ADMIN_MENU_SLUG,
            'page_title' => __('Import/Export', 'yatra'),
            'menu_title' => __('Import/Export', 'yatra'),
            'capability' => 'manage_yatra',
            'menu_slug' => 'yatra_import_export',
            'callback' => array($this, 'settings_page'),
            'position' => 26,
        );
        return $submenu;
    }


    /**
     * Init the settings page.
     */
    public function settings_page()
    {

        echo '<div class="wrap">';
        yatra_load_admin_template('import-export.importer');
        $custom_post_type_lists['yatra_export_type_lists'] = array(
            'custom_post_type' => array('tour'),
            'taxonomy' => array('destination', 'activity', 'attributes')

        );
        yatra_load_admin_template('import-export.export', $custom_post_type_lists);
        echo '</div>';
    }

    public function importer_scripts($hook)
    {
        if ('yatra_page_yatra_import_export' != $hook) {
            return;
        }


        wp_enqueue_style('yatra_importer_style', YATRA_PLUGIN_URI . '/assets/admin/css/importer.css', array('yatra-swal-css'), YATRA_VERSION);
        wp_enqueue_script('yatra_importer_script', YATRA_PLUGIN_URI . '/assets/admin/js/importer.js', array('yatra-swal-js'), YATRA_VERSION);
        $data =
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'loading_image' => YATRA_PLUGIN_URI . '/assets/images/loading.gif',
            );
        wp_localize_script('yatra_importer_script', 'yatraImporterData', $data);

    }
}

new Yatra_Admin_Export_Import();
