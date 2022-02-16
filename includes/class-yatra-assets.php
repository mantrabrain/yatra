<?php
if (!class_exists('Yatra_Assets')) {
    class Yatra_Assets
    {
        function __construct()
        {
            add_action('wp_enqueue_scripts', array($this, 'register_scripts'));

            add_action('wp_enqueue_scripts', array($this, 'scripts'));

        }

        public function register_scripts($hooks)
        {
            wp_register_script('yatra-popper', YATRA_PLUGIN_URI . '/assets/lib/popperjs/popper.js', array(), YATRA_VERSION);

            wp_register_script('yatra-tippy', YATRA_PLUGIN_URI . '/assets/lib/tippyjs/tippy.js', array(), YATRA_VERSION);

            wp_register_script('yatra-moment', YATRA_PLUGIN_URI . '/assets/lib/moment/js/moment.min.js', false, YATRA_VERSION);

            //Register Checkout Script
            wp_register_script('yatra-checkout', YATRA_PLUGIN_URI . '/assets/js/yatra-checkout.js', array('jquery'), YATRA_VERSION);


            wp_register_style('yatra-calendarcss', YATRA_PLUGIN_URI . '/assets/lib/yatra-calendar/css/yatra-calendar.css', false, YATRA_VERSION);
            wp_register_script('yatra-calendarjs', YATRA_PLUGIN_URI . '/assets/lib/yatra-calendar/js/yatra-calendar.js', false, YATRA_VERSION);

            // Register Only Script
            wp_register_script('yatra-select2js', YATRA_PLUGIN_URI . '/assets/lib/select2/js/select2.min.js', false, YATRA_VERSION);

            // Register Only Styles
            wp_register_style('yatra-select2css', YATRA_PLUGIN_URI . '/assets/lib/select2/css/select2.min.css', false, YATRA_VERSION);

            //jQuery UI css
            wp_register_style('yatra-jquery-ui', YATRA_PLUGIN_URI . '/assets/lib/jquery-ui/jquery-ui.css', false, '1.12.1');

            // Font Awesome
            wp_register_style('yatra-font-awesome', YATRA_PLUGIN_URI . '/assets/lib/font-awesome/css/fontawesome.min.css', false, '5.9.0');

            wp_register_style('lightbox', YATRA_PLUGIN_URI . '/assets/lib/lightbox2/css/lightbox.css', false, '2.11.0');

            wp_register_script('lightbox-script', YATRA_PLUGIN_URI . '/assets/lib/lightbox2/js/lightbox.js', false, '2.11.0');

            wp_register_script('yatra-filter', YATRA_PLUGIN_URI . '/assets/js/yatra-filter.js', array('jquery', 'jquery-ui-slider'), YATRA_VERSION);

            // Other Register and Enqueue
            wp_register_style('yatra-style', YATRA_PLUGIN_URI . '/assets/css/yatra.css',
                array('yatra-font-awesome', 'lightbox', 'yatra-calendarcss', 'yatra-jquery-ui'), YATRA_VERSION);

            wp_register_script('yatra-script', YATRA_PLUGIN_URI . '/assets/js/yatra.js',
                array('jquery', 'lightbox-script', 'yatra-moment', 'yatra-popper',
                    'yatra-tippy', 'yatra-calendarjs',
                ),
                YATRA_VERSION);
        }

        public function scripts($hook)
        {

            wp_enqueue_script('jquery-ui-datepicker');

            wp_enqueue_style('jquery-ui-datepicker');

            wp_enqueue_style('yatra-style');

            wp_enqueue_script('yatra-select2js');

            wp_enqueue_style('yatra-select2css');

            wp_enqueue_script('yatra-script');

            if (yatra_is_archive_page()) {

                wp_enqueue_script('yatra-filter');
            }

            $enabled_date = array();

            $yatra_available_date_data = array();

            if (is_singular('tour') && get_option('yatra_date_selection_type', 'calendar') === 'calendar') {
                $date_range = yatra_get_current_month_start_and_end_date();

                $yatra_available_date_data = Yatra_Core_Tour_Availability::get_availability(get_the_ID(), $date_range['start'], $date_range['end'], array(
                    'is_expired' => false,
                    'is_full' => false
                ), true);


                $enabled_date = array_keys($yatra_available_date_data);

            } else if (yatra_is_checkout()) {

                wp_enqueue_script('yatra-checkout');
            }
            $yatra_params = apply_filters('yatra_script_localize_params', array(

                'ajax_url' => admin_url('admin-ajax.php'),
                'booking_params' => array(
                    'booking_action' => 'yatra_tour_add_to_cart',
                    'booking_nonce' => wp_create_nonce('wp_yatra_tour_add_to_cart_nonce')
                ),
                'single_tour' => array(
                    'enabled_dates' => $enabled_date,
                    'all_available_date_data' => $yatra_available_date_data,
                    'availability_action' => 'yatra_tour_frontend_availability',
                    'availability_nonce' => wp_create_nonce('wp_yatra_tour_frontend_availability_nonce'),
                    'availability_month_action' => 'yatra_tour_frontend_availability_month',
                    'availability_month_nonce' => wp_create_nonce('wp_yatra_tour_frontend_availability_month_nonce')
                ),
                'currency_symbol' => yatra_get_current_currency_symbol(),

                'decimals' => get_option('yatra_price_number_decimals', 2),

                'decimal_separator' => get_option('yatra_decimal_separator', '.'),

                'thousand_separator' => get_option('yatra_thousand_separator', ','),

                'currency_position' => get_option('yatra_currency_position', 'left'),

                'show_enquiry_form' => get_option('yatra_enquiry_form_show', 'yes')


            ));


            wp_localize_script('yatra-script', 'yatra_params', $yatra_params);
        }

    }

}
return new Yatra_Assets();