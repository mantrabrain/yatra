<?php
if (!class_exists('Yatra_Assets')) {
    class Yatra_Assets
    {
        function __construct()
        {
            add_action('wp_enqueue_scripts', array($this, 'scripts'));

        }

        public function scripts($hook)
        {

            wp_enqueue_script( 'jquery-ui-datepicker' );
            wp_enqueue_style( 'jquery-ui-datepicker' );

            // Register Only Script
            wp_register_script('yatra-select2js', YATRA_PLUGIN_URI . '/assets/lib/select2/js/select2.min.js', false, YATRA_VERSION);

            // Register Only Styles
            wp_register_style('yatra-select2css', YATRA_PLUGIN_URI . '/assets/lib/select2/css/select2.min.css', false, YATRA_VERSION);

            // Font Awesome
            wp_register_style('yatra-font-awesome', YATRA_PLUGIN_URI . '/assets/lib/font-awesome/css/fontawesome.min.css', false, '5.9.0');

            wp_register_style('lightbox', YATRA_PLUGIN_URI . '/assets/lib/lightbox2/css/lightbox.css', false, '2.11.0');

            // Other Register and Enqueue
            wp_register_style('yatra-style', YATRA_PLUGIN_URI . '/assets/css/yatra.css', array('yatra-font-awesome', 'lightbox'), YATRA_VERSION);
            wp_enqueue_style('yatra-style');

            wp_register_script('lightbox-script', YATRA_PLUGIN_URI . '/assets/lib/lightbox2/js/lightbox.js', false, '2.11.0');

            wp_enqueue_script('yatra-select2js');
            wp_enqueue_style('yatra-select2css');

            wp_register_script('yatra-script', YATRA_PLUGIN_URI . '/assets/js/yatra.js', array('jquery', 'lightbox-script'), YATRA_VERSION);
            wp_enqueue_script('yatra-script');

            $yatra_params = array(

                'ajax_url' => admin_url('admin-ajax.php'),
                'booking_params' => array(
                    'booking_action' => 'yatra_select_tour',
                    'booking_nonce' => wp_create_nonce('wp_yatra_select_tour_nonce')
                )
            );

            wp_localize_script('yatra-script', 'yatra_params', $yatra_params);
        }

    }

}
return new Yatra_Assets();