<?php

namespace Yatra\Core\Admin;


use Yatra\Core\API\TrackerAPI;

/**
 * Agent Usage tracking
 *
 * @return void
 * @since 2.1.12
 */
class Tracking
{

    /**
     * @access private
     */
    private $slug = '';
    private $secret_opt_key = '';
    private $last_send_opt_key = '';
    private $hide_notice_opt_key = '';
    private $data;
    private $api_url = '';
    private $remote_url = '';
    private $version = '';
    private $is_test_environment = false;

    /**
     * Get things going
     * allow_tracking is set from $this->get_opt_data()
     * Other from opt key
     *
     * @return void
     * @since 2.1.12
     */
    public function __construct()
    {
        /*Changed with the plugin*/
        $this->remote_url = trailingslashit('https://tracking.mantrabrain.com/wp-json/mantrabrain/usage-tracking/v1/');
        if ($this->is_test_environment) {
            $this->remote_url = trailingslashit('http://localhost/wp-json/mantrabrain/usage-tracking/v1/');
        }
        $this->slug = 'yatra';
        $this->version = '1.0.0';
        /*Changed with the plugin end*/

        $this->secret_opt_key = 'agent_secret_key';
        $this->last_send_opt_key = 'agent_last_send';
        $this->hide_notice_opt_key = 'agent_hide_notice';

        $this->init();

    }

    /**
     * Set up WordPress hooks.
     *
     * @return void
     * @since 2.1.12
     */
    public function init()
    {

        add_action('init', array($this, 'schedule_send'));
        add_action('yatra_admin_settings_sanitize_option_yatra_allow_tracking', array($this, 'after_tracking_enable'), 10, 3);
        add_action('admin_init', array($this, 'show_tracking_notice'));
        add_action('admin_notices', array($this, 'admin_notice'));
    }

    /**
     * Update secret keyy
     *
     * @return void
     * @since 2.1.12
     */
    private function update_secret_key($secret_key)
    {
        $this->update_opt_data($this->secret_opt_key, sanitize_text_field($secret_key));
    }

    /**
     * Authorize this site to send data to engine.
     * get secret key from engine
     * run on agent activation.
     *
     * @return void
     * @since 2.1.12
     */
    public function handshake_and_request_api()
    {
        $this->request_api(true); //handshake
        $this->request_api(); // For Request


    }

    /**
     * Default Options
     *
     * @param null
     * @return array
     *
     * @since 2.1.12
     */
    private function default_options()
    {
        return array(
            'allow_tracking' => false,
        );
    }

    /**
     * Get option.
     *
     * @return array
     * @since 2.1.12
     */
    private function get_opt_data($key = '')
    {
        $helper_options = json_decode(get_option('yatra_helper_options'), true);

        $helper_default_options = $this->default_options();
        if (!empty($key)) {
            if (isset($helper_options[$key])) {
                return $helper_options[$key];
            }
            return $helper_default_options[$key] ?? '';
        } else {
            if (!is_array($helper_options)) {
                $helper_options = array();
            }
            return array_merge($helper_default_options, $helper_options);
        }
    }

    /**
     * Update options.
     *
     * @return array
     * @since 2.1.12
     */
    private function update_opt_data($key, $val)
    {
        $helper_options = json_decode(get_option('yatra_helper_options'), true);
        if (!is_array($helper_options)) {
            $helper_options = array();
        }
        $helper_options[$key] = $val;

        if ($key === 'allow_tracking') {
            $value = (boolean)$val ? 'yes' : 'no';
            delete_option('yatra_allow_tracking');
            add_option('yatra_allow_tracking', $value);
        }
        update_option(
            'yatra_helper_options',
            wp_json_encode($helper_options)
        );
    }

    private function get_data_items()
    {

        $theme_data = wp_get_theme();
        $theme = $theme_data->Name . ' ' . $theme_data->Version;
        $checkout_page = yatra_get_checkout_page();
        $date = (absint($checkout_page) > 0)
            ? get_post_field('post_date', $checkout_page)
            : 'not set';
        $server = isset($_SERVER['SERVER_SOFTWARE'])
            ? $_SERVER['SERVER_SOFTWARE']
            : '';

        $installed_date = date('Y-m-d H:i:s', get_option('yatra_install_date', strtotime($date)));
        // Setup data.
        $data = array(
            'php_version' => phpversion(),
            'yatra_version' => YATRA_VERSION,
            'wp_version' => get_bloginfo('version'),
            'server' => $server,
            'install_date' => $installed_date,
            'multisite' => is_multisite(),
            'url' => home_url(),
            'theme' => $theme,
            'email' => get_bloginfo('admin_email')
        );

        // Retrieve current plugin information.
        if (!function_exists('get_plugins')) {
            include ABSPATH . '/wp-admin/includes/plugin.php';
        }

        // Get plugins
        $plugins = array_keys(get_plugins());
        $active_plugins = get_option('active_plugins', array());

        // Remove active plugins from list so we can show active and inactive separately.
        foreach ($plugins as $key => $plugin) {
            if (in_array($plugin, $active_plugins, true)) {
                unset($plugins[$key]);
            }
        }

        $data['active_plugins'] = $active_plugins;
        $data['inactive_plugins'] = $plugins;
        $data['active_gateways'] = yatra_get_active_payment_gateways();
        $data['tours'] = wp_count_posts('tour')->publish;
        $data['locale'] = get_locale();
        return $data;

    }

    /**
     * Gather data to send to engine.
     *
     * @return array
     * @since 2.1.12
     */
    private function get_data()
    {
        $data = array();
        $data['data'] = $this->get_data_items();
        $data['admin_email'] = get_bloginfo('admin_email');
        $user = get_user_by('email', $data['admin_email']);
        $data['nicename'] = $user->data->user_nicename;
        $data['site_url'] = get_bloginfo('url');
        $data['version'] = get_bloginfo('version');
        $data['sender'] = $this->slug;

        return $data;
    }

    /**
     * Setup the data
     *
     * @access private
     *
     * @return void
     * @since 2.1.12
     */
    private function setup_data()
    {
        $data = array();

        $data['secret_key'] = $this->get_opt_data($this->secret_opt_key);
        $data['validate_callback'] = rest_url(YATRA_REST_GENERAL_NAMESPACE . '/track');
        if ($this->is_test_environment) {
            $data['validate_callback'] = ('http://localhost/wp-json/' . YATRA_REST_GENERAL_NAMESPACE . '/track');
        }
        $data['agent_data'] = maybe_serialize($this->get_data());
        $this->data = $data;
    }

    public function is_last_send_pass()
    {
        $last_send = $this->get_last_send();
        if (is_numeric($last_send) && $last_send !== '' && $last_send > strtotime('-1 week') && !$this->is_test_environment) {
            return false;
        }
        return true;
    }

    /**
     * Send the data to the Engine server
     *
     * @access public
     *
     * @param bool $do_handshake If it is just handshake to get secret key.
     *
     * @return void|mixed
     * @since 2.1.12
     */
    public function request_api($do_handshake = false)
    {

        if (!$this->get_opt_data('allow_tracking')) {
            return false;
        }

        /*Send a maximum of once per week*/
        if (!$this->is_last_send_pass()) {
            return false;
        }


        if ($do_handshake) {

            $this->api_url = $this->remote_url . 'handshake';

        } else {

            $this->api_url = $this->remote_url . 'process';

            $this->update_last_send();
        }

        $this->setup_data();

        $response_array = $this->send_request($this->api_url, $this->data);


        $has_secret_key = isset($response_array['secret_key']);

        if ($has_secret_key) {
            $this->update_secret_key($response_array['secret_key']);

        }
        return $response_array;
    }

    public function send_request($url, $data)
    {

        $headers = array(
            'user-agent' => 'Yatra/' . YATRA_VERSION . '; ' . get_bloginfo('url'),
        );

        $response = wp_remote_post(
            $url,
            array(
                'method' => 'POST',
                'timeout' => 45,
                'redirection' => 5,
                'httpversion' => '1.0',
                'blocking' => true,
                'headers' => $headers,
                'body' => $data
            )
        );

        return json_decode(wp_remote_retrieve_body($response), true);
    }

    /**
     * While user allow the tracking
     *
     * @return array
     * @since 2.1.12
     */
    public function after_tracking_enable($value, $option, $raw)
    {
        if ($value != 'yes') {

            $this->update_opt_data('allow_tracking', false);

        } else {

            $this->update_opt_data('allow_tracking', true);

        }

        if ($this->get_opt_data('allow_tracking')) {

            $this->handshake_and_request_api();
        }

        return $value;

    }

    /**
     * When saving hide tracking notice.
     *
     * @return void
     */
    public function show_tracking_notice()
    {

        // listen for our activate button to be clicked
        if (!isset($_GET[esc_attr($this->slug) . '_tracking'])) {
            return;
        }

        if (!current_user_can('manage_options')) {
            return;
        }

        /*Security check*/
        check_admin_referer($this->slug);

        if (1 == $_GET[esc_attr($this->slug) . '_tracking']) {
            $this->update_opt_data('allow_tracking', true);
            $this->handshake_and_request_api();
        } else {
            $this->update_opt_data('allow_tracking', false);
        }

        $this->update_hide_tracking_notice(true);
    }

    /**
     * Schedule a weekly tracking
     *
     * @return array|false|string
     * @since 2.1.12
     */
    public function schedule_send()
    {

        if (!wp_doing_cron()) {
            return;
        }
        if (!$this->get_opt_data('allow_tracking')) {
            return;
        }
        add_action('yatra_weekly_scheduled_events', array($this, 'handshake_and_request_api'));

    }

    /**
     * Update last send
     *
     * @return void
     * @since 2.1.12
     */
    public function update_last_send()
    {

        $this->update_opt_data($this->last_send_opt_key, time());
    }

    /**
     * Get last send
     *
     * @return string
     * @since 2.1.12
     */
    public function get_last_send()
    {
        return $this->get_opt_data($this->last_send_opt_key);

    }

    /**
     * Update hide notice
     *
     * @return void
     * @since 2.1.12
     */
    public function update_hide_tracking_notice($val = false)
    {
        $this->update_opt_data($this->hide_notice_opt_key, $val);
    }

    /**
     * Get hide notice
     *
     * @return boolean
     * @since 2.1.12
     */
    public function get_hide_tracking_notice()
    {
        return $this->get_opt_data($this->hide_notice_opt_key);

    }

    /**
     * Check if we can show tracking notice to user.
     *
     * @return boolean
     * @since 2.1.12
     */
    public function can_show_notice()
    {

        if (get_option('yatra_install_date', 0) > strtotime('-3 day')) {
            return false;
        }


        if ($this->get_hide_tracking_notice()) {
            return false;
        }
        if ($this->get_opt_data('allow_tracking')) {
            return false;
        }

        if (!current_user_can('manage_yatra')) {
            return false;
        }


        return true;

    }

    /**
     * Get current admin page URL.
     *
     * Returns an empty string if it cannot generate a URL.
     *
     * @return string
     * @since 2.1.12
     */
    private function get_current_admin_url()
    {
        $uri = isset($_SERVER['REQUEST_URI']) ? esc_url_raw(wp_unslash($_SERVER['REQUEST_URI'])) : '';
        $uri = preg_replace('|^.*/wp-admin/|i', '', $uri);

        if (!$uri) {
            return '';
        }

        return remove_query_arg(array('_wpnonce'), admin_url($uri));
    }

    /**
     * Display the admin notice to users.
     *
     * @return void
     * @since 2.1.12
     */
    public function admin_notice()
    {
        if (!$this->can_show_notice()) {
            return;
        }
        $allow_url = wp_nonce_url(
            add_query_arg(
                array(
                    esc_attr($this->slug) . '_tracking' => 1,
                ),
                $this->get_current_admin_url()
            ),
            $this->slug
        );
        $not_allow_url = wp_nonce_url(
            add_query_arg(
                array(
                    esc_attr($this->slug) . '_tracking' => 0,
                ),
                $this->get_current_admin_url()
            ),
            $this->slug
        );
        ob_start();
        ?>
        <p>
            <strong>Help us to improve Yatra!</strong></p>
        <p>Allow Yatra to anonymously track how this plugin is used and help us to make the plugin better. </p>
        <p>No sensitive data is tracked.</p>
        <p><a href="<?php echo esc_attr($allow_url) ?>" class="button-secondary">Allow</a> <a
                    href="<?php echo esc_attr($not_allow_url) ?>" class="button-secondary">Do not allow</a></p>

        <?php

        $notice_html = ob_get_clean();

        Notices::info(
            $notice_html,
            [
                'dismiss' => Notices::DISMISS_NONE,
                'slug' => 'usage_tracking',
                'autop' => true,
                'class' => 'yatra-usage-tracking-notice',
            ]
        );
    }
}
