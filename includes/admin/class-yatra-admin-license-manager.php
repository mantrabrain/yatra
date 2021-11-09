<?php

class Yatra_Admin_License_Manager
{

    private function premium_addons()
    {
        return apply_filters('yatra_premium_addons', array());
    }

    public function __construct()
    {
        if (count($this->premium_addons()) > 0) {
            add_action('admin_menu', array($this, 'license_menu'), 55);
            add_action('admin_enqueue_scripts', array($this, 'license_scripts'), 11);
            add_action('wp_ajax_yatra_update_single_license', array($this, 'update_single_license'), 10);
            add_action('wp_ajax_yatra_deactivate_single_license', array($this, 'deactivate_single_license'), 10);
        }
    }

    public function license_menu()
    {
        add_submenu_page(
            'edit.php?post_type=tour',
            __('Licenses', 'yatra'),
            __('Licenses', 'yatra'),
            'administrator',
            'yatra-license', array($this, 'license_page'));


    }


    public function update_single_license()
    {
        $nonce = isset($_POST['nonce']) ? sanitize_text_field($_POST['nonce']) : '';

        if (!wp_verify_nonce($nonce, 'yatra_update_license_nonce')) {

            wp_send_json_error();
            exit;
        }

        $this->update_license();

        wp_send_json_success();

    }

    public function deactivate_single_license()
    {
        $nonce = isset($_POST['nonce']) ? sanitize_text_field($_POST['nonce']) : '';

        if (!wp_verify_nonce($nonce, 'yatra_deactivate_license_nonce')) {

            wp_send_json_error();
            exit;
        }
        $slug = isset($_POST['slug']) ? sanitize_text_field($_POST['slug']) : '';

        $all_license = get_option('yatra_license', array());

        if (isset($all_license[$slug])) {

            $product_license = $all_license[$slug];

            $product_license = apply_filters('yatra_addon_before_license_deactivate', $product_license, $slug);

            $all_license[$slug] = $product_license;

            update_option('yatra_license', $all_license);

        }
        wp_send_json_success();

    }

    public function update_license()
    {
        $all_license = get_option('yatra_license', array());

        $all_valid_license = array();

        $premium_addons = $this->premium_addons();

        foreach ($premium_addons as $addon_slug => $addon_config) {

            if (isset($_POST[$addon_slug . '_license'])) {

                $license = isset($_POST[$addon_slug . '_license']) ? sanitize_text_field($_POST[$addon_slug . '_license']) : '';

                $product_license = is_array($all_license) && isset($all_license[$addon_slug]) ? $all_license[$addon_slug] : array();

                $product_license['license_key'] = $license;

                $product_license['id'] = isset($addon_config['id']) ? sanitize_text_field($addon_config['id']) : '';

                $product_license['label'] = isset($addon_config['label']) ? sanitize_text_field($addon_config['label']) : $addon_slug;

                $product_license = apply_filters('yatra_addon_before_license_update', $product_license, $addon_slug);
            } else {
                $product_license = isset($all_license[$addon_slug]) ? $all_license[$addon_slug] : array();
            }

            $all_valid_license[$addon_slug] = $product_license;
        }

        update_option('yatra_license', $all_valid_license);
    }

    public function license_page()
    {
        $premium_addons = $this->premium_addons();

        $message = '';

        if (isset($_POST['yatra_license_save_button'])) {

            $nonce_value = isset($_POST['_wpnonce']) ? sanitize_text_field($_POST['_wpnonce']) : '';

            if (wp_verify_nonce($nonce_value, 'yatra_license_save_nonce')) {

                $message = __('License updated. Please check license status and notice for more details.', 'yatra');

                $this->update_license();

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
        wp_enqueue_script('yatra-license-script', YATRA_PLUGIN_URI . '/assets/admin/js/license.js', array('jquery'), YATRA_VERSION);
        $data =
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'update_license_nonce' => wp_create_nonce('yatra_update_license_nonce'),
                'update_license_action' => 'yatra_update_single_license',
                'deactivate_license_nonce' => wp_create_nonce('yatra_deactivate_license_nonce'),
                'deactivate_license_action' => 'yatra_deactivate_single_license'
            );
        wp_localize_script('yatra-license-script', 'yatraLicenseScript', $data);

    }
}

new Yatra_Admin_License_Manager();
