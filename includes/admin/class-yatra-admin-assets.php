<?php
if (!class_exists('Yatra_Admin_Assets')) {
    class Yatra_Admin_Assets
    {
        function __construct()
        {

            add_action('admin_enqueue_scripts', array($this, 'load_admin_scripts'));

        }

        public function load_admin_scripts($hook)
        {

            wp_enqueue_media();
            wp_enqueue_editor();


            // Register Only Script
            wp_register_script('yatra-select2js', YATRA_PLUGIN_URI . '/assets/lib/select2/js/select2.min.js', false, YATRA_VERSION);

            // Register Only Styles
            wp_register_style('yatra-select2css', YATRA_PLUGIN_URI . '/assets/lib/select2/css/select2.min.css', false, YATRA_VERSION);

            // Font Awesome
            wp_register_style('yatra-font-awesome', YATRA_PLUGIN_URI . '/assets/lib/font-awesome/css/fontawesome.min.css', false, YATRA_VERSION);

            // Other Register and Enqueue
            wp_register_style('yatra-admin-style', YATRA_PLUGIN_URI . '/assets/admin/css/admin-style.css', array('yatra-select2css', 'yatra-font-awesome'), YATRA_VERSION);
            wp_enqueue_style('yatra-admin-style');


            wp_register_script('yatra-admin-script', YATRA_PLUGIN_URI . '/assets/admin/js/admin-script.js', array('yatra-select2js'), YATRA_VERSION);
            wp_enqueue_script('yatra-admin-script');
            $term_id = get_queried_object();


            $yatra_admin_params = array(

                'ajax_url' => admin_url('admin-ajax.php'),
                'attribute_params' => array(
                    'attribute_action' => 'yatra_change_tour_attribute',
                    'attribute_nonce' => wp_create_nonce('wp_yatra_change_tour_attribute_nonce'),

                    'is_edit' => isset($_GET['tag_ID']) && $_GET['tag_ID'] > 0 ? 1 : 0
                ),
                'attribute_tour_meta_params' => array(
                    'attribute_meta_nonce' => wp_create_nonce('wp_yatra_add_attribute_meta_nonce'),
                    'attribute_meta_action' => 'yatra_add_attribute_meta',
                )
            );

            wp_localize_script('yatra-admin-script', 'yatra_admin_params', $yatra_admin_params);

        }

    }

}
return new Yatra_Admin_Assets();