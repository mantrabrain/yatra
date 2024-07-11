<?php
use const Avifinfo\UNDEFINED;
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

            // Single Tour Scripts

            wp_register_script('yatra-single-tour', YATRA_PLUGIN_URI . '/assets/js/yatra-single-tour.js', array('jquery'), YATRA_VERSION);

            wp_register_style('yatra-calendarcss', YATRA_PLUGIN_URI . '/assets/lib/yatra-calendar/css/yatra-calendar.css', false, YATRA_VERSION);
            wp_register_script('yatra-calendarjs', YATRA_PLUGIN_URI . '/assets/lib/yatra-calendar/js/yatra-calendar.js', false, YATRA_VERSION);

            // Register Only Script
            wp_register_script('yatra-select2js', YATRA_PLUGIN_URI . '/assets/lib/select2/js/select2.min.js', false, YATRA_VERSION);


            // Register Light Slider Script
            wp_register_script('yatra-lightslider', YATRA_PLUGIN_URI . '/assets/lib/lightslider/js/lightslider.min.js', false, '1.1.3');

            // Register Only Styles
            wp_register_style('yatra-select2css', YATRA_PLUGIN_URI . '/assets/lib/select2/css/select2.min.css', false, YATRA_VERSION);


             //Light Slider css
             wp_register_style('yatra-lightslider', YATRA_PLUGIN_URI . '/assets/lib/lightslider/css/lightslider.css', false, '1.1.3');
            //jQuery UI css
            wp_register_style('yatra-jquery-ui', YATRA_PLUGIN_URI . '/assets/lib/jquery-ui/jquery-ui.css', false, '1.12.1');

            // Font Awesome
            wp_register_style('yatra-font-awesome', YATRA_PLUGIN_URI . '/assets/lib/font-awesome/css/fontawesome.min.css', false, '6.2.0');

            wp_register_style('lightbox', YATRA_PLUGIN_URI . '/assets/lib/lightbox2/css/lightbox.css', false, '2.11.0');

            // Mini Cart
            wp_register_style('yatra-mini-cart', YATRA_PLUGIN_URI . '/assets/css/yatra-mini-cart.css', false, YATRA_VERSION);

            wp_register_style('yatra-search-style', YATRA_PLUGIN_URI . '/assets/css/yatra-search.css', false, YATRA_VERSION);

            wp_register_script('yatra-search-script', YATRA_PLUGIN_URI . '/assets/js/yatra-search.js', array('jquery', 'jquery-ui-slider', 'jquery.ui.touch-punch'), YATRA_VERSION);

            wp_register_script('lightbox-script', YATRA_PLUGIN_URI . '/assets/lib/lightbox2/js/lightbox.js', false, '2.11.0');

            wp_register_script('jquery.ui.touch-punch', YATRA_PLUGIN_URI . '/assets/lib/jquery.ui.touch-punch/jquery.ui.touch-punch.min.js', false, '0.2.3');

            wp_register_script('yatra-filter', YATRA_PLUGIN_URI . '/assets/js/yatra-filter.js', array('jquery', 'jquery-ui-slider', 'jquery.ui.touch-punch'), YATRA_VERSION);

            $site_key = get_option('yatra_integration_captcha_site_key', '');

            if ($site_key !== '') {

                $recaptcha_api = apply_filters('yatra_frontend_recaptcha_url', 'https://www.google.com/recaptcha/api.js?render=' . $site_key);

                wp_register_script(
                    'yatra-recaptcha',
                    $recaptcha_api,
                    array(),
                    '3.0.0'
                );
            }

            wp_register_script('yatra-filter', YATRA_PLUGIN_URI . '/assets/js/yatra-filter.js', array('jquery', 'jquery-ui-slider', 'jquery.ui.touch-punch'), YATRA_VERSION);


            $main_css_dependency = array('yatra-font-awesome', 'lightbox', 'yatra-jquery-ui', 'yatra-mini-cart');

            $main_script_dependency = array('jquery', 'lightbox-script', 'yatra-moment', 'yatra-popper', 'yatra-tippy');
            if (is_singular('tour')) {
                $main_script_dependency[] = 'yatra-calendarjs';
                $main_css_dependency[] = 'yatra-calendarcss';
            }
            if (yatra_has_search_shortcode()) {

                $main_css_dependency[] = 'yatra-search-style';
            }

            // Other Register and Enqueue
            wp_register_style('yatra-style', YATRA_PLUGIN_URI . '/assets/css/yatra.css', $main_css_dependency, YATRA_VERSION);

            wp_register_script('yatra-script', YATRA_PLUGIN_URI . '/assets/js/yatra.js',
                $main_script_dependency,
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
            if (yatra_has_search_shortcode()) {
                wp_enqueue_script('yatra-search-script');
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


            $yatra_params = array(

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
                'pagination' => array(
                    'pagination_nonce' => wp_create_nonce('wp_yatra_parts_pagination_nonce'),
                    'pagination_action' => 'yatra_parts_pagination',
                ),
                'currency_symbol' => yatra_get_current_currency_symbol(),

                'decimals' => get_option('yatra_price_number_decimals', 2),

                'decimal_separator' => get_option('yatra_decimal_separator', '.'),

                'thousand_separator' => get_option('yatra_thousand_separator', ','),

                'currency_position' => get_option('yatra_currency_position', 'left'),

                'show_enquiry_form' => get_option('yatra_enquiry_form_show', 'yes'),


            );


            if (is_singular('tour')) {

                $start_of_week = get_option('start_of_week', 0);

                wp_enqueue_script('yatra-single-tour');

                global $wp_locale;

                $yatra_params['week_days'] = $wp_locale->weekday;

                $yatra_params['months'] = array_values($wp_locale->month);

                $yatra_params['fixedStartDay'] = $start_of_week==='' ? "": $start_of_week;

                wp_enqueue_script('yatra-lightslider');
                wp_enqueue_style('yatra-lightslider');
            }

            $yatra_params = apply_filters('yatra_script_localize_params', $yatra_params);

            wp_localize_script('yatra-script', 'yatra_params', $yatra_params);
        }

    }

}

return new Yatra_Assets();