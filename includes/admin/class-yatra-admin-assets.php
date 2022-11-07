<?php
if (!class_exists('Yatra_Admin_Assets')) {
    class Yatra_Admin_Assets
    {
        function __construct()
        {

            add_action('admin_enqueue_scripts', array($this, 'load_admin_scripts'), 10);

            add_action('admin_footer', 'yatra_print_js', 30);

        }

        public function load_admin_scripts($hook)
        {

            wp_enqueue_media();

            wp_enqueue_editor();

            $screen = get_current_screen();

            $screen_id = isset($screen->id) ? $screen->id : '';

            $coupon_dependency = file_exists(YATRA_ABSPATH . 'assets/build/js/coupon.asset.php') ? include_once(YATRA_ABSPATH . 'assets/build/js/coupon.asset.php') : array();

            $coupon_dependency['dependencies'] = isset($coupon_dependency['dependencies']) ? $coupon_dependency['dependencies'] : array();

            $coupon_dependency['version'] = isset($coupon_dependency['version']) ? sanitize_text_field($coupon_dependency['version']) : YATRA_VERSION;

            // Register Only Script
            wp_register_script('yatra-popper', YATRA_PLUGIN_URI . '/assets/lib/popperjs/popper.js', array(), YATRA_VERSION);
            wp_register_script('yatra-tippy', YATRA_PLUGIN_URI . '/assets/lib/tippyjs/tippy.js', array('yatra-popper'), YATRA_VERSION);

            //ICOPick

            wp_register_style('yatra-icopick-css', YATRA_PLUGIN_URI . '/assets/lib/icopick/css/icopick.css', array(), YATRA_VERSION);

            wp_register_script('yatra-icopick-js', YATRA_PLUGIN_URI . '/assets/lib/icopick/js/icopick.js', array(), YATRA_VERSION);

            //ICOPick
            //

            //Full Calendar

            wp_register_style('yatra-fullcalendar-css', YATRA_PLUGIN_URI . '/assets/lib/fullcalendar/lib/main.css', array(), YATRA_VERSION);

            wp_register_script('yatra-fullcalendar-js', YATRA_PLUGIN_URI . '/assets/lib/fullcalendar/lib/main.js', array(), YATRA_VERSION);

            //ICOPick

            wp_register_style('yatra-swal-css', YATRA_PLUGIN_URI . '/assets/lib/sweetalert2/css/sweetalert2.css', array(), YATRA_VERSION);

            wp_register_script('yatra-swal-js', YATRA_PLUGIN_URI . '/assets/lib/sweetalert2/js/sweetalert2.js', array(), YATRA_VERSION);

            wp_register_script('yatra-select2js', YATRA_PLUGIN_URI . '/assets/lib/select2/js/select2.min.js', false, YATRA_VERSION);

            wp_register_script('yatra-moment', YATRA_PLUGIN_URI . '/assets/lib/moment/js/moment.min.js', false, YATRA_VERSION);

            wp_register_script('yatra-datepicker', YATRA_PLUGIN_URI . '/assets/lib/datepicker/js/datepicker.js', array('yatra-moment'), YATRA_VERSION);

            wp_register_script('yatra-daterangepicker', YATRA_PLUGIN_URI . '/assets/lib/daterangepicker/daterangepicker.js', array('yatra-moment'), YATRA_VERSION);


            // Register Only Styles
            wp_register_style('yatra-select2css', YATRA_PLUGIN_URI . '/assets/lib/select2/css/select2.min.css', false, YATRA_VERSION);

            wp_register_style('yatra-datepickercss', YATRA_PLUGIN_URI . '/assets/lib/datepicker/css/datepicker.min.css', false, YATRA_VERSION);
            wp_register_style('yatra-daterangepickercss', YATRA_PLUGIN_URI . '/assets/lib/daterangepicker/daterangepicker.css', false, YATRA_VERSION);

            // Font Awesome
            wp_register_style('yatra-font-awesome', YATRA_PLUGIN_URI . '/assets/lib/font-awesome/css/fontawesome.min.css', false, '6.2.0');

            // Taxonomy Activity JS
            wp_register_script('yatra-taxonomy-activityjs', YATRA_PLUGIN_URI . '/assets/admin/js/activity-taxonomy.js', array('jquery'), YATRA_VERSION);

            // Taxonomy Activity JS
            wp_register_script('yatra-taxonomy-destinationjs', YATRA_PLUGIN_URI . '/assets/admin/js/destination-taxonomy.js', array('jquery'), YATRA_VERSION);

            // Taxonomy Attributes JS
            wp_register_script('yatra-taxonomy-attributesjs', YATRA_PLUGIN_URI . '/assets/admin/js/attributes-taxonomy.js', array('jquery'), YATRA_VERSION);

            $coupon_dependency_array = $coupon_dependency['dependencies'];

            $coupon_dependency_array[] = 'yatra-tippy';

            wp_register_script('yatra-coupon', YATRA_PLUGIN_URI . '/assets/build/js/coupon.js', $coupon_dependency_array, $coupon_dependency['version']);

            wp_register_style('yatra-coupon-css', YATRA_PLUGIN_URI . '/assets/build/style-coupon.css', array('wp-components'), YATRA_VERSION);

            wp_register_style('yatra-booking-meta-css', YATRA_PLUGIN_URI . '/assets/admin/css/booking-meta.css', array(), YATRA_VERSION);


            // Other Register and Enqueue
            //Setting Page Scripts
            wp_register_style('yatra-settings-style', YATRA_PLUGIN_URI . '/assets/admin/css/settings.css', array(
                'yatra-font-awesome', 'yatra-swal-css', 'yatra-icopick-css'
            ), YATRA_VERSION);

            wp_register_script('yatra-settings-script', YATRA_PLUGIN_URI . '/assets/admin/js/settings.js', array(
                'yatra-swal-js', 'yatra-icopick-js',
            ), YATRA_VERSION);
            //End

            //Tour Listing Table Scripts
            wp_register_script('yatra-tour-listing-script', YATRA_PLUGIN_URI . '/assets/admin/js/tour-listing.js', array(), YATRA_VERSION);
            //End

            // Tour Metabox
            wp_register_style('yatra-tour-meta-style', YATRA_PLUGIN_URI . '/assets/admin/css/tour-meta.css', array(
                'yatra-font-awesome', 'yatra-select2css', 'yatra-swal-css', 'yatra-icopick-css', 'yatra-datepickercss', 'yatra-daterangepickercss'
            ), YATRA_VERSION);

            wp_register_script('yatra-tour-meta-script', YATRA_PLUGIN_URI . '/assets/admin/js/tour-meta.js', array(
                'yatra-select2js', 'yatra-swal-js', 'yatra-icopick-js', 'yatra-datepicker', 'yatra-daterangepicker',
            ), YATRA_VERSION);
            //End

            $localization_array = array(
                'ajax_url' => admin_url('admin-ajax.php'),

            );
            $js_dependencies = array();

            $css_dependencies = array();

            $js_dependencies[] = 'jquery';

            switch ($screen_id) {
                case "edit-activity":
                    $js_dependencies[] = 'yatra-taxonomy-activityjs';
                    break;
                case "edit-destination":
                    $js_dependencies[] = 'yatra-taxonomy-destinationjs';
                    break;
                case "yatra-booking":
                    $css_dependencies[] = 'yatra-booking-meta-css';
                    break;
                case "yatra_page_yatra-settings":
                    array_push($js_dependencies, 'wp-color-picker', 'yatra-settings-script', 'yatra-tippy');
                    array_push($css_dependencies, 'wp-color-picker', 'yatra-settings-style');
                    $localization_array['font_awesome_icons'] = array(
                        'font_awesome' => array(
                            'icons' => yatra_fontawesome_icon_lists(),
                            'title' => __('Font Awesome', 'yatra')
                        )
                    );
                    $localization_array['tab_settings_remove_tab_item_confirm_title'] = __('Are you sure want to remove this item?', 'yatra');

                    $localization_array['tab_settings_remove_tab_item_confirm_message'] = sprintf(__('%1sWarning%2s: If you remove this tab, all of your contents associated with this tab will be deleted', 'yatra'), '<strong>', '</strong>');

                    $localization_array['tab_settings_remove_tab_item_yes_button_text'] = __('Yes, Confirm', 'yatra');

                    $localization_array['tab_settings_remove_tab_item_no_button_text'] = __('Cancel this process', 'yatra');
                    break;
                case "edit-tour":
                    array_push($js_dependencies, 'yatra-tour-listing-script', 'yatra-tippy');
                    $localization_array['tour_featured_status_update_action'] = 'yatra_update_tour_featured_status';
                    $css_dependencies[] = 'yatra-font-awesome';
                    break;
                case "tour":
                    array_push($js_dependencies, 'yatra-tour-meta-script', 'yatra-tippy');
                    array_push($css_dependencies, 'yatra-tour-meta-style');
                    $localization_array['attribute_tour_meta_params'] = array(
                        'attribute_meta_nonce' => wp_create_nonce('wp_yatra_add_attribute_meta_nonce'),
                        'attribute_meta_action' => 'yatra_add_attribute_meta',
                    );
                    $localization_array['remove_attribute_confirm_title'] = __('Are you sure want to delete attribute?', 'yatra');
                    $localization_array['remove_attribute_confirm_yes_button_text'] = __('Yes, Confirm', 'yatra');
                    $localization_array['remove_attribute_confirm_no_button_text'] = __('Cancel this process', 'yatra');
                    $visibility_conditions = array();

                    $yatra_tour_metabox_tabs = yatra_tour_metabox_tabs();

                    foreach ($yatra_tour_metabox_tabs as $tab) {

                        $settings = $tab['settings'] ?? array();

                        foreach ($settings as $setting_id => $setting_values) {

                            $setting_visibility_condition = $setting_values['visibility_condition'] ?? array();

                            foreach ($setting_visibility_condition as $single_condition => $condition_value) {

                                $visibility_conditions[$single_condition][] = array(
                                    'value' => $condition_value,
                                    'target' => $setting_id
                                );

                            }

                        }
                    }
                    $localization_array['visibility_conditions'] = $visibility_conditions;
                    break;
                case "edit-attributes":
                    array_push($js_dependencies, 'yatra-taxonomy-attributesjs', 'yatra-icopick-js');
                    array_push($css_dependencies, 'yatra-font-awesome', 'yatra-icopick-css');
                    $localization_array['attribute_params'] = array(
                        'attribute_action' => 'yatra_change_tour_attribute',
                        'attribute_nonce' => wp_create_nonce('wp_yatra_change_tour_attribute_nonce'),

                        'is_edit' => isset($_GET['tag_ID']) && $_GET['tag_ID'] > 0 ? 1 : 0
                    );
                    $localization_array['font_awesome_icons'] = array(
                        'font_awesome' => array(
                            'icons' => yatra_fontawesome_icon_lists(),
                            'title' => __('Font Awesome', 'yatra')
                        )
                    );
                    break;


            }


            wp_enqueue_script('yatra-admin-global-script', YATRA_PLUGIN_URI . '/assets/admin/js/global.js', $js_dependencies, YATRA_VERSION);

            wp_enqueue_style('yatra-admin-global-css', YATRA_PLUGIN_URI . '/assets/admin/css/global.css', $css_dependencies, YATRA_VERSION);

            wp_localize_script('yatra-admin-global-script', 'yatra_admin_params', $localization_array);

        }

    }


}
return new Yatra_Admin_Assets();
