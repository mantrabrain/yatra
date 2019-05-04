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

            // Other Register and Enqueue
            wp_register_style('yatra-style', YATRA_PLUGIN_URI . '/assets/css/yatra.css', false, YATRA_VERSION);
            wp_enqueue_style('yatra-style');


            wp_register_script('yatra-script', YATRA_PLUGIN_URI . '/assets/js/yatra.js', false, YATRA_VERSION);
            wp_enqueue_script('yatra-script');

            $yatra_params = array(

                'ajax_url' => admin_url('admin-ajax.php'),
                'booking_params' => array(
                    'booking_action' => 'yatra_book_tour',
                    'booking_nonce' => wp_create_nonce('wp_yatra_book_tour_nonce')
                )
            );

            wp_localize_script('yatra-script', 'yatra_params', $yatra_params);
        }

    }

}
return new Yatra_Assets();