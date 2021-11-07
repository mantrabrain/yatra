<?php

class Yatra_Admin_License_Manager
{

    private function premium_addons()
    {
        $premium_addons = array(
            'yatra-services' => array(
                'label' => __('Yatra Services', 'yatra'),
                'id' => 444
            )
        );
        return apply_filters('yatra_premium_addons', $premium_addons);
    }

    public function __construct()
    {
        if (count($this->premium_addons()) > 0) {
            add_action('admin_menu', array($this, 'license_menu'), 55);
            add_action('admin_enqueue_scripts', array($this, 'license_scripts'), 11);
        }
    }

    public function license_menu()
    {
        add_submenu_page(
            'edit.php?post_type=tour',
            __('License', 'yatra'),
            __('License', 'yatra'),
            'administrator',
            'yatra-license', array($this, 'license_page'));


    }


    /**
     * Init the settings page.
     */
    public function license_page()
    {
        $premium_addons = $this->premium_addons();

        $message = '';

        if (isset($_POST['yatra_license_save_button'])) {

            $nonce_value = isset($_POST['_wpnonce']) ? sanitize_text_field($_POST['_wpnonce']) : '';

            if (wp_verify_nonce($nonce_value, 'yatra_license_save_nonce')) {

                $message = __('License updated. Please check license status and notice for more details.', 'yatra');

                foreach ($premium_addons as $addon_slug => $addon_config) {

                    $license = isset($_POST[$addon_slug . '_license']) ? sanitize_text_field($_POST[$addon_slug . '_license']) : '';

                    $status = apply_filters($addon_slug . '_update', $license);
                }
            }


        }

        echo '<div class="wrap yatra-license-page-wrap">';

        yatra_load_admin_template('license.license', array('addons' => $premium_addons, 'message' => $message));

        echo '</div>';
    }

    public function license_scripts($hook)
    {
        if ('tour_page_yatra-license' != $hook) {
            return;
        }


        wp_enqueue_style('yatra-license-style', YATRA_PLUGIN_URI . '/assets/admin/css/license.css', array(), YATRA_VERSION);
        /*wp_enqueue_script('yatra-license-script', YATRA_PLUGIN_URI . '/assets/admin/js/license.js', array('jquery'), YATRA_VERSION);
        $data =
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
            );
        wp_localize_script('yatra-license-script', 'yatraLicenseScript', $data);*/

    }
}

new Yatra_Admin_License_Manager();
