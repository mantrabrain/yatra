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
    private $agents_opt_key = '';
    private $agent_active_opt_key = '';
    private $data;
    private $api_url = '';
    private $remote_url = '';
    private $version = '';

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
        $this->remote_url = trailingslashit('http://localhost/wp-json/mantrabrain/usage-tracking/v1/');
        $this->slug = 'yatra';
        $this->version = '1.0.0';
        /*Changed with the plugin end*/

        $this->secret_opt_key = 'agent_secret_key';
        $this->last_send_opt_key = 'agent_last_send';
        $this->hide_notice_opt_key = 'agent_hide_notice';
        $this->agent_active_opt_key = 'is_active_this_track';

        $this->agents_opt_key = 'agent_' . md5($this->remote_url);/*unique per remote url*/

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
        add_action('admin_init', array($this, 'do_agents'));
        add_action('admin_init', array($this, 'show_tracking_notice'));
        add_action('admin_notices', array($this, 'admin_notice'));
    }

    /**
     * Update agents.
     * Run once in the lifetime.
     *
     * @return void
     * @since 2.1.12
     */
    public function do_agents()
    {

        $installed_agents = get_option($this->agents_opt_key, array());

        if (isset($installed_agents[$this->slug])) {
            return;
        }

        $installed_agents[$this->slug] = $this->version;

        $active_agent = $this->get_opt_data($this->agent_active_opt_key, '');

        if (!$active_agent) {
            $active_agent = $this->slug;
        } else {
            if (is_array($installed_agents) && !empty($installed_agents)) {
                $highest_ver = $this->version;
                foreach ($installed_agents as $agent => $agent_ver) {
                    if (version_compare($agent_ver, $highest_ver) > 0) {
                        $highest_ver = $agent_ver;
                        $active_agent = $agent;
                    }
                }
            }
        }

        // register this agent locally.
        $this->update_opt_data($this->agent_active_opt_key, $active_agent);

        // register agent data globally.
        update_option($this->agents_opt_key, $installed_agents);
    }

    /**
     * Is this active agent
     *
     * @return boolean
     * @since 2.1.12
     */
    private function is_active_agent()
    {
        if ($this->slug == $this->get_opt_data($this->agent_active_opt_key)) {
            return true;
        }
        return false;

    }

    /**
     * Update secret keyy
     *
     * @return void
     * @since 2.1.12
     */
    private function update_secret_key($res)
    {
        // get secret key from engine.
        $get_secret_key = json_decode($res, true);
        $secret_key = 'none';
        if ($get_secret_key && is_array($get_secret_key) && isset($get_secret_key['secret_key'])) {
            $secret_key = $get_secret_key['secret_key'];
        }
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
    public function do_handshake()
    {
        $secret_key = $this->get_opt_data($this->secret_opt_key);


        /* if (!empty($secret_key)) {
             // secret_key already exists.
             // do nothing.
             return;
         }*/

        // authenticate with engine.
        $this->api_url = $this->remote_url . 'handshake';

        $get_secret_key = $this->send_data(true, true);

        $this->update_secret_key($get_secret_key);

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
        update_option(
            'yatra_helper_options',
            wp_json_encode($helper_options)
        );
    }

    /**
     * Gather data to send to engine.
     *
     * @return array
     * @since 2.1.12
     */
    private function get_data()
    {

        if (!class_exists('WP_Debug_Data')) {
            include_once ABSPATH . 'wp-admin/includes/class-wp-debug-data.php';
        }
        $data = array();

        if (method_exists('WP_Debug_Data', 'debug_data')) {
            $data['data'] = \WP_Debug_Data::debug_data();
        } else {
            $data['data'] = array();
        }
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
        $data['agent_data'] = maybe_serialize($this->get_data());
        $data['secret_key'] = $this->get_opt_data($this->secret_opt_key);
        $data['validate_callback'] = rest_url(YATRA_REST_GENERAL_NAMESPACE . '/track');
        $this->data = $data;
    }

    /**
     * Send the data to the Engine server
     *
     * @access public
     *
     * @param bool $override If we should override the tracking setting.
     * @param bool $is_handshake If it is just handshake to get secret key.
     *
     * @return bool
     * @since 2.1.12
     */
    public function send_data($override = false, $is_handshake = false)
    {

        if (!$this->get_opt_data('allow_tracking') && !$override) {
            return false;
        }

        /*Send a maximum of once per week*/
        $last_send = $this->get_last_send();
        if (is_numeric($last_send) && $last_send > strtotime('-1 week') && !$is_handshake) {
            //   return false;
        }

        /*if this agent is not active agent*/
        if (!$this->is_active_agent()) {
            // return false;
        }

        if (!$is_handshake) {
            $this->api_url = $this->remote_url . 'process';
            $this->update_last_send();
        }

        $this->setup_data();

        $response = wp_remote_post(
            $this->api_url,
            array(
                'method' => 'POST',
                'timeout' => 45,
                'redirection' => 5,
                'httpversion' => '1.0',
                'blocking' => true,
                'headers' => array(),
                'body' => $this->data,
            )
        );

        $response_array = json_decode(wp_remote_retrieve_body($response), true);

        $has_secret_key = isset($response_array['secret_key']);


        if ($is_handshake) {

            return $has_secret_key ? $response_array['secret_key'] : '';
        } else {
            if ($has_secret_key) {
                $this->update_secret_key(wp_remote_retrieve_body($response));
            }
        }

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

            $this->send_data(true);
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

        $this->do_handshake();

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
            $this->send_data(true);
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
        add_action('yatra_weekly_scheduled_events', array($this, 'do_post'));

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

        if ($this->get_opt_data('installed_time') > strtotime('-3 day')) {
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

        /*if this agent is not active agent*/
        if (!$this->is_active_agent()) {
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
