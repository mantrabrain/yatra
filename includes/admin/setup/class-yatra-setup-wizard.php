<?php

class Yatra_Setup_Wizard
{

    /** @var string Currenct Step */
    private $step = '';

    /** @var array Steps for the setup wizard */
    private $steps = array();

    /**
     * Hook in tabs.
     */
    public function __construct()
    {

        // if we are here, we assume we don't need to run the wizard again
        // and the user doesn't need to be redirected here
        update_option('yatra_setup_wizard_ran', '1');

        if (apply_filters('yatra_enable_setup_wizard', true) && current_user_can('manage_options')) {

            add_action('admin_menu', array($this, 'admin_menus'));
            add_action('admin_init', array($this, 'setup_wizard'));

        }
    }

    /**
     * Add admin menus/screens.
     */
    public function admin_menus()
    {
        add_dashboard_page('', '', 'manage_options', 'yatra-setup', '');
    }

    /**
     * Show the setup wizard
     */
    public function setup_wizard()
    {

        if (empty($_GET['page']) || 'yatra-setup' !== $_GET['page']) {
            return;
        }


        $this->steps = array(
            'introduction' => array(
                'name' => __('Introduction', 'yatra'),
                'view' => array($this, 'setup_step_introduction'),
                'handler' => ''
            ),
            'general' => array(
                'name' => __('General', 'yatra'),
                'view' => array($this, 'setup_step_general'),
                'handler' => array($this, 'setup_step_general_save')
            ),
            'pages' => array(
                'name' => __('Pages', 'yatra'),
                'view' => array($this, 'setup_step_pages'),
                'handler' => array($this, 'setup_step_pages_save')
            ),
            'design' => array(
                'name' => __('Design', 'yatra'),
                'view' => array($this, 'setup_step_design'),
                'handler' => array($this, 'setup_step_design_save')
            ),
            'miscellaneous' => array(
                'name' => __('Miscellaneous', 'yatra'),
                'view' => array($this, 'setup_step_miscellaneous'),
                'handler' => array($this, 'setup_step_miscellaneous_save'),
            ),
            'themes' => array(
                'name' => __('Themes', 'yatra'),
                'view' => array($this, 'setup_step_themes'),
                'handler' => array($this, 'setup_step_themes_save'),
            ),
            'final' => array(
                'name' => __('Final!', 'yatra'),
                'view' => array($this, 'setup_final_ready'),
                'handler' => ''
            )
        );

        $this->step = isset($_GET['step']) ? sanitize_key($_GET['step']) : current(array_keys($this->steps));

        if (!isset($this->steps[$this->step])) {
            $all_steps_key = array_keys($this->steps);
            $this->step = $all_steps_key[0];
        }

        wp_register_style('yatra-swal-css', YATRA_PLUGIN_URI . '/assets/lib/sweetalert2/css/sweetalert2.css', array(), YATRA_VERSION);

        wp_register_script('yatra-swal-js', YATRA_PLUGIN_URI . '/assets/lib/sweetalert2/js/sweetalert2.js', array(), YATRA_VERSION);

        wp_enqueue_style('yatra-setup', YATRA_PLUGIN_URI . '/assets/admin/css/setup.css', array('dashicons', 'install', 'yatra-swal-css'));
        wp_enqueue_script('yatra-setup', YATRA_PLUGIN_URI . '/assets/admin/js/setup.js', array('jquery', 'yatra-swal-js'), YATRA_VERSION);
        wp_localize_script('yatra-setup', 'yatraSetup',
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'import_action' => 'yatra_import_sample_data_on_setup',
                'import_nonce' => wp_create_nonce('wp_yatra_import_sample_data_on_setup_nonce'),
                'loading_image' => YATRA_PLUGIN_URI . '/assets/images/loading.gif',

            )
        );

        wp_register_script('yatra-select2', YATRA_PLUGIN_URI . '/assets/lib/select2/js/select2.min.js', false, false, true);

        if (!empty($_POST['save_step']) && isset($this->steps[$this->step]['handler'])) {
            call_user_func($this->steps[$this->step]['handler']);
        }

        ob_start();
        $this->setup_wizard_header();
        $this->setup_wizard_steps();
        $this->setup_wizard_content();
        $this->setup_wizard_footer();
        exit;
    }

    public function get_next_step_link()
    {
        $keys = array_keys($this->steps);
        return add_query_arg('step', $keys[array_search($this->step, array_keys($this->steps)) + 1], remove_query_arg('translation_updated'));
    }

    /**
     * Setup Wizard Header
     */
    public function setup_wizard_header()
    {
        ?>
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>
        <head>
            <meta name="viewport" content="width=device-width"/>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <title><?php _e('Yatra &rsaquo; Setup Wizard', 'yatra'); ?></title>
            <?php wp_print_scripts('yatra-setup'); ?>
            <?php do_action('admin_print_styles'); ?>
            <?php //do_action('admin_head'); ?>
        </head>
        <body class="yatra-setup wp-core-ui">
        <h1 class="yatra-logo"><a
                    href="https://mantrabrain.com/downloads/yatra-wordpress-travel-booking-system/?utm_source=setup_wizard&utm_medium=logo&utm_campaign=plugin">Complete
                Travel & Tour Booking System – Yatra</a></h1>
        <?php
    }

    /**
     * Setup Wizard Footer
     */
    public function setup_wizard_footer()
    {
        ?>
        <?php if ('next_steps' === $this->step) : ?>
        <a class="yatra-return-to-dashboard"
           href="<?php echo esc_url(admin_url()); ?>"><?php _e('Return to the WordPress Dashboard', 'yatra'); ?></a>
    <?php endif; ?>
        </body>
        </html>
        <?php
    }

    /**
     * Output the steps
     */
    public function setup_wizard_steps()
    {
        $output_steps = $this->steps;

        ?>
        <ol class="yatra-setup-steps">
            <?php foreach ($output_steps as $step_key => $step) : ?>
                <li class="<?php
                if ($step_key === $this->step) {
                    echo 'active';
                } elseif (array_search($this->step, array_keys($this->steps)) > array_search($step_key, array_keys($this->steps))) {
                    echo 'done';
                }
                ?>">
                    <a href="<?php echo admin_url('index.php?page=yatra-setup&step=' . $step_key); ?>"><?php echo esc_html($step['name']); ?></a>
                </li>
            <?php endforeach; ?>
        </ol>
        <?php
    }

    /**
     * Output the content for the current step
     */
    public function setup_wizard_content()
    {
        echo '<div class="yatra-setup-content">';
        if (isset($this->steps[$this->step])) {
            call_user_func($this->steps[$this->step]['view']);
        }
        echo '</div>';
    }

    public function next_step_buttons()
    {
        ?>
        <p class="yatra-setup-actions step">
            <input type="submit" class="button-primary button button-large button-next"
                   value="<?php esc_attr_e('Continue', 'yatra'); ?>" name="save_step"/>
            <a href="<?php echo esc_url($this->get_next_step_link()); ?>"
               class="button button-large button-next"><?php _e('Skip this step', 'yatra'); ?></a>
            <?php wp_nonce_field('yatra-setup'); ?>
        </p>
        <?php
    }

    /**
     * Introduction step
     */
    public function setup_step_introduction()
    {
        ?>
        <h1><?php _e('Welcome to Complete Travel & Tour Booking System – Yatra!', 'yatra'); ?></h1>
        <p><?php _e('Thank you for choosing Yatra plugin for your travel & tour booking site. This setup wizard will help you configure the basic settings of the plugin. <strong>It’s completely optional and shouldn’t take longer than one minutes.</strong>', 'yatra'); ?></p>
        <p><?php _e('No time right now? If you don’t want to go through the wizard, you can skip and return to the WordPress dashboard.', 'yatra'); ?></p>
        <p class="yatra-setup-actions step">
            <a href="<?php echo esc_url($this->get_next_step_link()); ?>"
               class="button-primary button button-large button-next"><?php _e('Let\'s Go!', 'yatra'); ?></a>
            <a href="<?php echo esc_url(admin_url('edit.php?post_type=tour&page=yatra-dashboard')); ?>"
               class="button button-large"><?php _e('Not right now', 'yatra'); ?></a>
        </p>
        <?php
    }

    public function setup_step_general()
    {
        ?>
        <h1><?php _e('General Settings', 'yatra'); ?></h1>

        <form method="post">

            <table class="form-table">
                <tr>
                    <th scope="row"><label for="yatra_currency"><?php _e('Currency', 'yatra'); ?></label></th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_currency',
                            'type' => 'select',
                            'value' => get_option('yatra_currency', 'USD'),
                            'options' => yatra_get_currencies(),
                            'help' => __('Currency symbol for yatra plugin.', 'yatra'),
                        ]); ?>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><label
                                for="yatra_currency_position"><?php _e('Currency Position', 'yatra'); ?></label></th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_currency_position',
                            'type' => 'select',
                            'value' => get_option('yatra_currency_position', 'left'),
                            'options' => yatra_get_currency_positions(),
                            'help' => __('Currency symbol position.', 'yatra'),
                        ]); ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label
                                for="yatra_thousand_separator"><?php _e('Thousand Separator', 'yatra'); ?></label></th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_thousand_separator',
                            'type' => 'text',
                            'value' => get_option('yatra_thousand_separator', ','),
                            'help' => __('Thousand separator for price.', 'yatra'),
                        ]); ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label
                                for="yatra_price_number_decimals"><?php _e('Number of decimals', 'yatra'); ?></label>
                    </th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_price_number_decimals',
                            'type' => 'number',
                            'value' => get_option('yatra_price_number_decimals', 2),
                            'help' => __('Number of decimals shown in price.', 'yatra'),
                        ]); ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label
                                for="yatra_decimal_separator"><?php _e('Decimal Separator', 'yatra'); ?></label>
                    </th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_decimal_separator',
                            'type' => 'text',
                            'value' => get_option('yatra_decimal_separator', '.'),
                            'help' => __('Decimal separator for price..', 'yatra'),
                        ]); ?>
                    </td>
                </tr>
            </table>

            <?php $this->next_step_buttons(); ?>
        </form>
        <?php
    }

    public function setup_step_general_save()
    {
        check_admin_referer('yatra-setup');

        $yatra_currency = sanitize_text_field($_POST['yatra_currency']);
        $currency_position = sanitize_text_field($_POST['yatra_currency_position']);
        $all_currency_positions = yatra_get_currency_positions();
        $currency_position = isset($all_currency_positions[$currency_position]) ? $currency_position : 'left';
        $thousand_separator = sanitize_text_field($_POST['yatra_thousand_separator']);
        $decimals = absint($_POST['yatra_price_number_decimals']);
        $decimal_separator = sanitize_text_field($_POST['yatra_decimal_separator']);

        $all_currencies = array_keys(yatra_get_currencies());

        if (in_array($yatra_currency, $all_currencies)) {

            update_option('yatra_currency', $yatra_currency);
        }
        update_option('yatra_currency', $yatra_currency);
        update_option('yatra_currency_position', $currency_position);
        update_option('yatra_thousand_separator', $thousand_separator);
        update_option('yatra_price_number_decimals', $decimals);
        update_option('yatra_decimal_separator', $decimal_separator);


        wp_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }


    public function setup_step_pages()
    {
        ?>

        <h1><?php _e('Pages Options', 'yatra'); ?></h1>

        <form method="post">

            <table class="form-table">
                <tr>
                    <th scope="row"><label for="yatra_cart_page"><?php _e('Cart Page', 'yatra'); ?></label></th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_cart_page',
                            'type' => 'single_select_page',
                            'value' => get_option('yatra_cart_page', ''),
                            'help' => __('Cart page for yatra plugin.', 'yatra'),
                        ]); ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="yatra_checkout_page"><?php _e('Checkout Page', 'yatra'); ?></label></th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_checkout_page',
                            'type' => 'single_select_page',
                            'value' => get_option('yatra_checkout_page', ''),
                            'help' => __('Checkout page for yatra plugin.', 'yatra'),
                        ]); ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="yatra_my_account_page"><?php _e('My Account Page', 'yatra'); ?></label>
                    </th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_my_account_page',
                            'type' => 'single_select_page',
                            'value' => get_option('yatra_my_account_page', ''),
                            'help' => __('My Account page for yatra plugin.', 'yatra'),
                        ]); ?>
                    </td>
                </tr>
            </table>

            <?php $this->next_step_buttons(); ?>
        </form>
        <?php
    }

    /**
     * Module setup step save
     * @since 1.3.4
     *
     * Add project manager plugin
     * @since 1.4.2
     */
    public function setup_step_pages_save()
    {
        check_admin_referer('yatra-setup');

        $yatra_cart_page = absint($_POST['yatra_cart_page']);

        $yatra_checkout_page = absint($_POST['yatra_checkout_page']);

        $yatra_my_account_page = absint($_POST['yatra_my_account_page']);


        if ((int)($yatra_cart_page) > 0) {

            update_option('yatra_cart_page', $yatra_cart_page);
        }
        if ((int)($yatra_checkout_page) > 0) {

            update_option('yatra_checkout_page', $yatra_checkout_page);
        }
        if ((int)($yatra_my_account_page) > 0) {

            update_option('yatra_my_account_page', $yatra_my_account_page);
        }

        wp_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }

    public function setup_step_design()
    {
        ?>
        <h1><?php _e('Design Setup', 'yatra'); ?></h1>
        <form method="post">

            <table class="form-table">
                <tr>
                    <th scope="row"><label
                                for="yatra_page_container_class"><?php _e('Container Class', 'yatra'); ?></label></th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_page_container_class',
                            'type' => 'text',
                            'value' => get_option('yatra_page_container_class', ''),
                            'help' => __('Container class for all page templates for yatra plugin.', 'yatra'),
                        ]); ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label
                                for="yatra_setting_layouts_single_tour_tab_layout"><?php _e('Tab Layout for tour page	', 'yatra'); ?></label>
                    </th>

                    <td>
                        <?php yatra_html_form_input([
                            'name' => 'yatra_setting_layouts_single_tour_tab_layout',
                            'type' => 'select',
                            'value' => get_option('yatra_setting_layouts_single_tour_tab_layout', ''),
                            'help' => __('Tab layout for single tour page.', 'yatra'),
                            'options' => array(
                                '' => __('Tab Style Layout', 'yatra'),
                                'heading_and_content' => __('Heading & Content Style Tab', 'yatra'),
                            )
                        ]); ?>
                    </td>
                </tr>
            </table>

            <?php $this->next_step_buttons(); ?>
        </form>
        <?php

    }

    public function setup_step_design_save()
    {
        check_admin_referer('yatra-setup');

        $yatra_page_container_class = sanitize_text_field($_POST['yatra_page_container_class']);

        $yatra_setting_layouts_single_tour_tab_layout = sanitize_text_field($_POST['yatra_setting_layouts_single_tour_tab_layout']);

        update_option('yatra_page_container_class', $yatra_page_container_class);
        update_option('yatra_setting_layouts_single_tour_tab_layout', $yatra_setting_layouts_single_tour_tab_layout);

        wp_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }

    public function setup_step_miscellaneous()
    {
        ?>
        <h1><?php _e('Miscellaneous Setup', 'yatra'); ?></h1>
        <form method="post">
            <?php
            $guest_checkout = get_option('yatra_enable_guest_checkout', 'yes');
            ?>

            <table class="form-table">

                <tr>
                    <th scope="row"><label
                                for="yatra_enable_guest_checkout"><?php _e('Enable Guest Checkout', 'yatra'); ?></label>
                    </th>

                    <td class="updated">
                        <input type="checkbox" name="yatra_enable_guest_checkout" id="yatra_enable_guest_checkout"
                               class="switch-input"
                            <?php echo 'yes' == $guest_checkout ? 'checked' : ''; ?> value="1">
                        <label for="share_essentials" class="switch-label">
                            <span class="toggle--on">On</span>
                            <span class="toggle--off">Off</span>
                        </label>
                        <span class="description">
                            This option allows you to checkout without login. User will not created if you tick this option. <a
                                    href="https://docs.mantrabrain.com/yatra-wordpress-plugin/yatra-settings/"
                                    target="_blank">Read Documentation</a>
                        </span>

                    </td>


                </tr>

            </table>

            <?php $this->next_step_buttons(); ?>
        </form>
        <?php

    }


    public function setup_step_miscellaneous_save()
    {
        check_admin_referer('yatra-setup');

        $yatra_enable_guest_checkout = isset($_POST['yatra_enable_guest_checkout']) ? absint($_POST['yatra_enable_guest_checkout']) : 0;

        $checkout_val = $yatra_enable_guest_checkout == 1 ? 'yes' : 'no';

        update_option('yatra_enable_guest_checkout', $checkout_val);

        wp_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }

    public function setup_step_themes()
    {
        ?>
        <h1 style="text-align: center;font-weight: bold;text-transform: uppercase;color: #18d0ab;"><?php _e('Compatible Themes for Yatra Plugin', 'yatra'); ?></h1>
        <form method="post">
            <?php
            //$compatible_themes = apply_filters('yatra_must_compatible_themes', array());

            $compatible_themes = array(
                array(
                    'slug' => 'yatri',
                    'title' => __('Yatri', 'yatra'),
                    'demo_url' => 'https://wpyatri.com',
                    'is_free' => true,
                    'screenshot' => 'https://raw.githubusercontent.com/mantrabrain/yatri/master/screenshot.png',
                    'landing_page' => 'https://wpyatri.com/?ref=yatrasetup',
                    'is_installable' => false,
                    'download_link' => 'https://downloads.wordpress.org/theme/yatri.zip'
                )
            )
            ?>
            <div class="theme-browser content-filterable rendered wpclearfix">
                <div class="themes wpclearfix">
                    <?php foreach ($compatible_themes as $theme) {
                        $theme_slug = isset($theme['slug']) ? $theme['slug'] : '';
                        $screenshot = isset($theme['screenshot']) ? $theme['screenshot'] : '';
                        $title = isset($theme['title']) ? $theme['title'] : '';
                        $demo_url = isset($theme['demo_url']) ? $theme['demo_url'] : '';
                        $is_installable = isset($theme['is_installable']) ? $theme['is_installable'] : false;
                        $landing_page = isset($theme['landing_page']) ? $theme['landing_page'] : '';
                        $download_link = isset($theme['download_link']) ? $theme['download_link'] : '';
                        ?>
                        <div class="theme" tabindex="0"
                             aria-describedby="<?php echo esc_attr($theme_slug) ?>-action <?php echo esc_attr($theme_slug) ?>-name"
                             data-slug="<?php echo esc_attr($theme_slug) ?>">

                            <div class="theme-screenshot">
                                <img src="<?php echo esc_attr($screenshot); ?>" alt="<?php echo esc_attr($title); ?>">
                            </div>

                            <span class="more-details"
                                  onclick="window.open('<?php echo esc_url($landing_page); ?>','_blank');"
                                  data-details-link="<?php echo esc_url($landing_page); ?>"><?php echo __('Details &amp; Preview', 'yatra'); ?></span>


                            <div class="theme-id-container">
                                <h3 class="theme-name"><?php echo esc_html($title) ?></h3>
                                <div class="theme-actions">
                                    <a href="<?php echo esc_attr($download_link); ?>"
                                       class="button button-primary theme-install"
                                       data-name="<?php echo esc_attr($title) ?>"
                                       data-slug="<?php echo esc_attr($theme_slug) ?>"
                                       data-installable="<?php echo absint($is_installable) ?>"
                                       aria-label="Install <?php echo esc_html($title) ?>"><?php echo __('Download', 'yatra'); ?></a>
                                    <a href="<?php echo esc_attr($demo_url); ?>" target="_blank"
                                       class="button preview install-theme-preview"><?php echo __('Preview', 'yatra'); ?></a>

                                </div>
                            </div>
                        </div>
                    <?php } ?>
                </div>
            </div>
            <div class="wpclearfix"></div>

            <?php $this->next_step_buttons(); ?>
        </form>

        <?php
    }


    public function setup_step_themes_save()
    {
        wp_redirect(esc_url_raw($this->get_next_step_link()));
        exit;
    }

    public function setup_final_ready()
    {
        ?>

        <div class="final-step">
            <h1><?php _e('Your Site is Ready!', 'yatra'); ?></h1>

            <div class="yatra-setup-next-steps">
                <div class="yatra-setup-next-steps-last">
                    <h2><?php _e('Next Steps &rarr;', 'yatra'); ?></h2>


                    <a class="button button-primary button-large"
                       href="<?php echo esc_url(admin_url('edit.php?post_type=tour&page=yatra-dashboard')); ?>">
                        <?php _e('Go to Dashboard!', 'yatra'); ?>
                    </a>
                    <button class="button button-primary button-large yatra-import-dummy-data"
                            href="<?php echo esc_url(admin_url('edit.php?post_type=tour&page=yatra-dashboard')); ?>">
                        <?php _e('Import Sample Data', 'yatra'); ?>
                    </button>
                </div>
            </div>
        </div>
        <?php
    }
}

return new Yatra_Setup_Wizard();