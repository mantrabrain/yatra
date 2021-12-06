<?php

class Yatra_Module_Section_System_Status
{
    public function __construct()
    {
        include YATRA_ABSPATH . 'includes/modules/status/templates/html-admin-page-status-report.php';
    }


    function get_server_database_version()
    {
        global $wpdb;

        if (empty($wpdb->is_mysql)) {
            return array(
                'string' => '',
                'number' => '',
            );
        }

        // phpcs:disable WordPress.DB.RestrictedFunctions, PHPCompatibility.Extensions.RemovedExtensions.mysql_DeprecatedRemoved
        if ($wpdb->use_mysqli) {
            $server_info = mysqli_get_server_info($wpdb->dbh);
        } else {
            $server_info = mysql_get_server_info($wpdb->dbh);
        }
        // phpcs:enable WordPress.DB.RestrictedFunctions, PHPCompatibility.Extensions.RemovedExtensions.mysql_DeprecatedRemoved

        return array(
            'string' => $server_info,
            'number' => preg_replace('/([^\d.]+).*/', '', $server_info),
        );
    }

    public function get_database_info()
    {
        global $wpdb;

        $tables = array();
        $database_size = array();

        // It is not possible to get the database name from some classes that replace wpdb (e.g., HyperDB)
        // and that is why this if condition is needed.
        if (defined('DB_NAME')) {
            $database_table_information = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT
					    table_name AS 'name',
						engine AS 'engine',
					    round( ( data_length / 1024 / 1024 ), 2 ) 'data',
					    round( ( index_length / 1024 / 1024 ), 2 ) 'index'
					FROM information_schema.TABLES
					WHERE table_schema = %s
					ORDER BY name ASC;",
                    DB_NAME
                )
            );

            $core_tables = apply_filters(
                'yatra_database_tables',
                array(
                    'yatra_tour_dates',
                    'yatra_tour_enquiries',
                    'yatra_tour_booking_stats',
                    'yatra_logs',
                )
            );

            /**
             * Adding the prefix to the tables array, for backwards compatibility.
             *
             * If we changed the tables above to include the prefix, then any filters against that table could break.
             */
            $core_tables = array_map(array($this, 'add_db_table_prefix'), $core_tables);


            $tables = array(
                'yatra' => array_fill_keys($core_tables, false),
                'other' => array(),
            );

            $database_size = array(
                'data' => 0,
                'index' => 0,
            );

            $site_tables_prefix = $wpdb->get_blog_prefix(get_current_blog_id());
            $global_tables = $wpdb->tables('global', true);
            foreach ($database_table_information as $table) {
                // Only include tables matching the prefix of the current site, this is to prevent displaying all tables on a MS install not relating to the current.
                if (is_multisite() && 0 !== strpos($table->name, $site_tables_prefix) && !in_array($table->name, $global_tables, true)) {
                    continue;
                }
                $table_type = in_array($table->name, $core_tables, true) ? 'yatra' : 'other';

                $tables[$table_type][$table->name] = array(
                    'data' => $table->data,
                    'index' => $table->index,
                    'engine' => $table->engine,
                );

                $database_size['data'] += $table->data;
                $database_size['index'] += $table->index;
            }
        }

        // Return all database info. Described by JSON Schema.
        return array(
            'database_prefix' => $wpdb->prefix,
            'database_tables' => $tables,
            'database_size' => $database_size,
        );
    }


    /**
     * Get array of counts of objects. Orders, products, etc.
     *
     * @return array
     */
    public function get_post_type_counts()
    {
        global $wpdb;

        $post_type_counts = $wpdb->get_results("SELECT post_type AS 'type', count(1) AS 'count' FROM {$wpdb->posts} GROUP BY post_type;", ARRAY_A);

        return is_array($post_type_counts) ? $post_type_counts : array();
    }

    /**
     * Get a list of plugins active on the site.
     *
     * @return array
     */
    public function get_active_plugins()
    {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';

        if (!function_exists('get_plugin_data')) {
            return array();
        }

        $active_plugins = (array)get_option('active_plugins', array());
        if (is_multisite()) {
            $network_activated_plugins = array_keys(get_site_option('active_sitewide_plugins', array()));
            $active_plugins = array_merge($active_plugins, $network_activated_plugins);
        }

        $active_plugins_data = array();

        foreach ($active_plugins as $plugin) {

            if (file_exists(WP_PLUGIN_DIR . '/' . $plugin)) {
                $data = get_plugin_data(WP_PLUGIN_DIR . '/' . $plugin);
                $active_plugins_data[] = $this->format_plugin_data($plugin, $data);
            }
        }

        return $active_plugins_data;
    }

    /**
     * Get a list of inplugins active on the site.
     *
     * @return array
     */
    public function get_inactive_plugins()
    {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';

        if (!function_exists('get_plugins')) {
            return array();
        }

        $plugins = get_plugins();
        $active_plugins = (array)get_option('active_plugins', array());

        if (is_multisite()) {
            $network_activated_plugins = array_keys(get_site_option('active_sitewide_plugins', array()));
            $active_plugins = array_merge($active_plugins, $network_activated_plugins);
        }

        $plugins_data = array();

        foreach ($plugins as $plugin => $data) {
            if (in_array($plugin, $active_plugins, true)) {
                continue;
            }
            $plugins_data[] = $this->format_plugin_data($plugin, $data);
        }

        return $plugins_data;
    }

    /**
     * Format plugin data, including data on updates, into a standard format.
     *
     * @param string $plugin Plugin directory/file.
     * @param array $data Plugin data from WP.
     * @return array Formatted data.
     */
    protected function format_plugin_data($plugin, $data)
    {
        require_once ABSPATH . 'wp-admin/includes/update.php';

        if (!function_exists('get_plugin_updates')) {
            return array();
        }

        if (empty($this->available_updates)) {
            $this->available_updates = get_plugin_updates();
        }

        $version_latest = $data['Version'];

        // Find latest version.
        if (isset($this->available_updates[$plugin]->update->new_version)) {
            $version_latest = $this->available_updates[$plugin]->update->new_version;
        }

        return array(
            'plugin' => $plugin,
            'name' => $data['Name'],
            'version' => $data['Version'],
            'version_latest' => $version_latest,
            'url' => $data['PluginURI'],
            'author_name' => $data['AuthorName'],
            'author_url' => esc_url_raw($data['AuthorURI']),
            'network_activated' => $data['Network'],
        );
    }

    /**
     * Get a list of Dropins and MU plugins.
     *
     * @return array
     */
    public function get_dropins_mu_plugins()
    {
        $dropins = get_dropins();
        $plugins = array(
            'dropins' => array(),
            'mu_plugins' => array(),
        );
        foreach ($dropins as $key => $dropin) {
            $plugins['dropins'][] = array(
                'plugin' => $key,
                'name' => $dropin['Name'],
            );
        }

        $mu_plugins = get_mu_plugins();
        foreach ($mu_plugins as $plugin => $mu_plugin) {
            $plugins['mu_plugins'][] = array(
                'plugin' => $plugin,
                'name' => $mu_plugin['Name'],
                'version' => $mu_plugin['Version'],
                'url' => $mu_plugin['PluginURI'],
                'author_name' => $mu_plugin['AuthorName'],
                'author_url' => esc_url_raw($mu_plugin['AuthorURI']),
            );
        }
        return $plugins;
    }

    public static function get_file_version($file)
    {

        // Avoid notices if file does not exist.
        if (!file_exists($file)) {
            return '';
        }

        // We don't need to write to the file, so just open for reading.
        $fp = fopen($file, 'r'); // @codingStandardsIgnoreLine.

        // Pull only the first 8kiB of the file in.
        $file_data = fread($fp, 8192); // @codingStandardsIgnoreLine.

        // PHP will close file handle, but we are good citizens.
        fclose($fp); // @codingStandardsIgnoreLine.

        // Make sure we catch CR-only line endings.
        $file_data = str_replace("\r", "\n", $file_data);
        $version = '';

        if (preg_match('/^[ \t\/*#@]*' . preg_quote('@version', '/') . '(.*)$/mi', $file_data, $match) && $match[1]) {
            $version = _cleanup_header_comment($match[1]);
        }

        return $version;
    }

    /**
     * Get info on the current active theme, info on parent theme (if presnet)
     * and a list of template overrides.
     *
     * @return array
     */
    public function get_theme_info()
    {
        $active_theme = wp_get_theme();

        // Get parent theme info if this theme is a child theme, otherwise
        // pass empty info in the response.
        if (is_child_theme()) {
            $parent_theme = wp_get_theme($active_theme->template);
            $parent_theme_info = array(
                'parent_name' => $parent_theme->name,
                'parent_version' => $parent_theme->version,
                'parent_version_latest' => self::get_latest_theme_version($parent_theme),
                'parent_author_url' => $parent_theme->{'Author URI'},
            );
        } else {
            $parent_theme_info = array(
                'parent_name' => '',
                'parent_version' => '',
                'parent_version_latest' => '',
                'parent_author_url' => '',
            );
        }


        $override_files = array();
        $outdated_templates = false;
        $scan_files = array();
        $scan_files[] = 'single-tour.php';
        $scan_files[] = 'archive-tour.php';
        $scan_files[] = 'taxonomy-activity.php';
        $scan_files[] = 'taxonomy-destination.php';
        foreach ($scan_files as $file) {
            $located = apply_filters('yatra_get_template', $file, $file, array(), yatra()->template_path(), yatra()->plugin_path() . '/templates/');

            if (file_exists($located)) {
                $theme_file = $located;
            } elseif (file_exists(get_stylesheet_directory() . '/' . $file)) {
                $theme_file = get_stylesheet_directory() . '/' . $file;
            } elseif (file_exists(get_stylesheet_directory() . '/' . yatra()->template_path() . $file)) {
                $theme_file = get_stylesheet_directory() . '/' . yatra()->template_path() . $file;
            } elseif (file_exists(get_template_directory() . '/' . $file)) {
                $theme_file = get_template_directory() . '/' . $file;
            } elseif (file_exists(get_template_directory() . '/' . yatra()->template_path() . $file)) {
                $theme_file = get_template_directory() . '/' . yatra()->template_path() . $file;
            } else {
                $theme_file = false;
            }

            if (!empty($theme_file)) {
                $core_file = $file;

                $core_version = self::get_file_version(yatra()->plugin_path() . '/templates/' . $core_file);
                $theme_version = self::get_file_version($theme_file);
                if ($core_version && (empty($theme_version) || version_compare($theme_version, $core_version, '<'))) {
                    if (!$outdated_templates) {
                        $outdated_templates = true;
                    }
                }
                $override_files[] = array(
                    'file' => str_replace(WP_CONTENT_DIR . '/themes/', '', $theme_file),
                    'version' => $theme_version,
                    'core_version' => $core_version,
                );
            }
        }

        $active_theme_info = array(
            'name' => $active_theme->name,
            'version' => $active_theme->version,
            'version_latest' => self::get_latest_theme_version($active_theme),
            'author_url' => esc_url_raw($active_theme->{'Author URI'}),
            'is_child_theme' => is_child_theme(),
            'has_yatra_file' => (file_exists(get_stylesheet_directory() . '/yatra.php') || file_exists(get_template_directory() . '/yatra.php')),
            'has_outdated_templates' => $outdated_templates,
            'overrides' => $override_files,
        );

        return array_merge($active_theme_info, $parent_theme_info);
    }

    public static function get_latest_theme_version($theme)
    {
        include_once ABSPATH . 'wp-admin/includes/theme.php';

        $api = themes_api(
            'theme_information',
            array(
                'slug' => $theme->get_stylesheet(),
                'fields' => array(
                    'sections' => false,
                    'tags' => false,
                ),
            )
        );

        $update_theme_version = 0;

        // Check .org for updates.
        if (is_object($api) && !is_wp_error($api)) {
            $update_theme_version = $api->version;
        } elseif (strstr($theme->{'Author URI'}, 'mantrabrain')) { //
            $theme_dir = substr(strtolower(str_replace(' ', '', $theme->Name)), 0, 45); // @codingStandardsIgnoreLine.
            $theme_version_data = get_transient($theme_dir . '_version_data');

            if (false === $theme_version_data) {
                $theme_changelog = wp_safe_remote_get('http://dzv365zjfbd8v.cloudfront.net/changelogs/' . $theme_dir . '/changelog.txt');
                $cl_lines = explode("\n", wp_remote_retrieve_body($theme_changelog));
                if (!empty($cl_lines)) {
                    foreach ($cl_lines as $line_num => $cl_line) {
                        if (preg_match('/^[0-9]/', $cl_line)) {
                            $theme_date = str_replace('.', '-', trim(substr($cl_line, 0, strpos($cl_line, '-'))));
                            $theme_version = preg_replace('~[^0-9,.]~', '', stristr($cl_line, 'version'));
                            $theme_update = trim(str_replace('*', '', $cl_lines[$line_num + 1]));
                            $theme_version_data = array(
                                'date' => $theme_date,
                                'version' => $theme_version,
                                'update' => $theme_update,
                                'changelog' => $theme_changelog,
                            );
                            set_transient($theme_dir . '_version_data', $theme_version_data, DAY_IN_SECONDS);
                            break;
                        }
                    }
                }
            }

            if (!empty($theme_version_data['version'])) {
                $update_theme_version = $theme_version_data['version'];
            }
        }

        return $update_theme_version;
    }

    public function get_settings()
    {
        $all_positions = yatra_get_currency_positions();
        $currency_position = get_option('yatra_currency_position', 'left');
        $currency_position = isset($all_positions[$currency_position]) ? $all_positions[$currency_position] : 'Left';
        return array(
            'currency' => yatra_get_current_currency(),
            'currency_symbol' => yatra_get_current_currency_symbol(),
            'currency_position' => $currency_position,
            'thousand_separator' => get_option('yatra_thousand_separator', ','),
            'decimal_separator' => get_option('yatra_decimal_separator', '.'),
            'number_of_decimals' => get_option('yatra_price_number_decimals', '2'),
        );
    }

    /**
     * Returns security tips.
     *
     * @return array
     */
    public function get_security_info()
    {
        $check_page = yatra_get_my_account_page(true);
        return array(
            'secure_connection' => 'https' === substr($check_page, 0, 5),
            'hide_errors' => !(defined('WP_DEBUG') && defined('WP_DEBUG_DISPLAY') && WP_DEBUG && WP_DEBUG_DISPLAY) || 0 === intval(ini_get('display_errors')),
        );
    }

    public function get_pages()
    {
        $check_pages = array(

            _x('Cart', 'Page setting', 'yatra') => array(
                'option' => 'yatra_cart_page',
                'shortcode' => '[' . apply_filters('yatra_cart_shortcode_tag', 'yatra_cart') . ']',
                'block' => '',
            ),
            _x('Checkout', 'Page setting', 'yatra') => array(
                'option' => 'yatra_checkout_page',
                'shortcode' => '[' . apply_filters('yatra_checkout_shortcode_tag', 'yatra_checkout') . ']',
                'block' => '',
            ),
            _x('My account', 'Page setting', 'yatra') => array(
                'option' => 'yatra_my_account_page',
                'shortcode' => '[' . apply_filters('yatra_my_account_shortcode_tag', 'yatra_my_account') . ']',
                'block' => '',
            ),
            _x('Terms and conditions', 'Page setting', 'yatra') => array(
                'option' => 'yatra_terms_and_conditions_page',
                'shortcode' => '',
                'block' => '',
            ),
        );

        $pages_output = array();

        foreach ($check_pages as $page_name => $values) {
            $page_id = get_option($values['option']);
            $page_set = false;
            $page_exists = false;
            $page_visible = false;
            $shortcode_present = false;
            $shortcode_required = false;
            $block_present = false;
            $block_required = false;

            // Page checks.
            if ($page_id) {
                $page_set = true;
            }
            if (get_post($page_id)) {
                $page_exists = true;
            }
            if ('publish' === get_post_status($page_id)) {
                $page_visible = true;
            }

            // Shortcode checks.
            if ($values['shortcode'] && get_post($page_id)) {
                $shortcode_required = true;
                $page = get_post($page_id);
                if (strstr($page->post_content, $values['shortcode'])) {
                    $shortcode_present = true;
                }
            }

            // Block checks.
            if ($values['block'] && get_post($page_id)) {
                $block_required = true;
                $block_present = $this->has_block_in_page($page_id, $values['block']);
            }

            // Wrap up our findings into an output array.
            $pages_output[] = array(
                'page_name' => $page_name,
                'page_id' => $page_id,
                'page_set' => $page_set,
                'page_exists' => $page_exists,
                'page_visible' => $page_visible,
                'shortcode' => $values['shortcode'],
                'block' => $values['block'],
                'shortcode_required' => $shortcode_required,
                'shortcode_present' => $shortcode_present,
                'block_present' => $block_present,
                'block_required' => $block_required,
            );
        }

        return $pages_output;
    }

    public function has_block_in_page($page, $block_name)
    {
        $page_to_check = get_post($page);
        if (null === $page_to_check) {
            return false;
        }

        $blocks = parse_blocks($page_to_check->post_content);
        foreach ($blocks as $block) {
            if ($block_name === $block['blockName']) {
                return true;
            }
        }

        return false;
    }

    protected function add_db_table_prefix($table)
    {
        global $wpdb;
        return $wpdb->prefix . $table;
    }

    public function environment()
    {
        global $wpdb;


        // Figure out cURL version, if installed.
        $curl_version = '';
        if (function_exists('curl_version')) {
            $curl_version = curl_version();
            $curl_version = $curl_version['version'] . ', ' . $curl_version['ssl_version'];
        } elseif (extension_loaded('curl')) {
            $curl_version = __('cURL installed but unable to retrieve version.', 'yatra');
        }

        // WP memory limit.
        $wp_memory_limit = yatra_let_to_num(WP_MEMORY_LIMIT);
        if (function_exists('memory_get_usage')) {
            $wp_memory_limit = max($wp_memory_limit, yatra_let_to_num(@ini_get('memory_limit'))); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
        }

        // Test POST requests.
        $post_response_successful = null;

        $post_response_code = null;

        $post_response_code = get_transient('yatra_test_remote_post');

        if (false === $post_response_code || is_wp_error($post_response_code)) {
            $response = wp_safe_remote_post(
                'https://www.paypal.com/cgi-bin/webscr',
                array(
                    'timeout' => 10,
                    'user-agent' => 'Yatra/' . YATRA_VERSION,
                    'httpversion' => '1.1',
                    'body' => array(
                        'cmd' => '_notify-validate',
                    ),
                )
            );
            if (!is_wp_error($response)) {
                $post_response_code = $response['response']['code'];
            }
            set_transient('yatra_test_remote_post', $post_response_code, HOUR_IN_SECONDS);
        }

        $post_response_successful = !is_wp_error($post_response_code) && $post_response_code >= 200 && $post_response_code < 300;


        // Test GET requests.
        $get_response_successful = null;
        $get_response_code = null;

        $get_response_code = get_transient('yatra_test_remote_get');

        if (false === $get_response_code || is_wp_error($get_response_code)) {
            $response = wp_safe_remote_get('https://mantrabrain.com/?request=ping&network=' . (is_multisite() ? '1' : '0'));
            if (!is_wp_error($response)) {
                $get_response_code = $response['response']['code'];
            }
            set_transient('yatra_test_remote_get', $get_response_code, HOUR_IN_SECONDS);
        }

        $get_response_successful = !is_wp_error($get_response_code) && $get_response_code >= 200 && $get_response_code < 300;


        $database_version = $this->get_server_database_version();

        // Return all environment info. Described by JSON Schema.
        return array(
            'home_url' => get_option('home'),
            'site_url' => get_option('siteurl'),
            'version' => YATRA_VERSION,
            'log_directory' => yatra()->get_log_dir(),
            'log_directory_writable' => (bool)@fopen(yatra()->get_log_dir() . 'test-log.log', 'a'), // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_system_read_fopen
            'wp_version' => get_bloginfo('version'),
            'wp_multisite' => is_multisite(),
            'wp_memory_limit' => $wp_memory_limit,
            'wp_debug_mode' => (defined('WP_DEBUG') && WP_DEBUG),
            'wp_cron' => !(defined('DISABLE_WP_CRON') && DISABLE_WP_CRON),
            'language' => get_locale(),
            'external_object_cache' => wp_using_ext_object_cache(),
            'server_info' => isset($_SERVER['SERVER_SOFTWARE']) ? yatra_clean(wp_unslash($_SERVER['SERVER_SOFTWARE'])) : '',
            'php_version' => phpversion(),
            'php_post_max_size' => yatra_let_to_num(ini_get('post_max_size')),
            'php_max_execution_time' => (int)ini_get('max_execution_time'),
            'php_max_input_vars' => (int)ini_get('max_input_vars'),
            'curl_version' => $curl_version,
            'suhosin_installed' => extension_loaded('suhosin'),
            'max_upload_size' => wp_max_upload_size(),
            'mysql_version' => $database_version['number'],
            'mysql_version_string' => $database_version['string'],
            'default_timezone' => date_default_timezone_get(),
            'fsockopen_or_curl_enabled' => (function_exists('fsockopen') || function_exists('curl_init')),
            'soapclient_enabled' => class_exists('SoapClient'),
            'domdocument_enabled' => class_exists('DOMDocument'),
            'gzip_enabled' => is_callable('gzopen'),
            'mbstring_enabled' => extension_loaded('mbstring'),
            'remote_post_successful' => $post_response_successful,
            'remote_post_response' => is_wp_error($post_response_code) ? $post_response_code->get_error_message() : $post_response_code,
            'remote_get_successful' => $get_response_successful,
            'remote_get_response' => is_wp_error($get_response_code) ? $get_response_code->get_error_message() : $get_response_code,
        );
    }

    private static function output_plugins_info($plugins, $untested_plugins = array())
    {
        $yatra_version = YATRA_VERSION;


        foreach ($plugins as $plugin) {
            if (!empty($plugin['name'])) {
                // Link the plugin name to the plugin url if available.
                $plugin_name = esc_html($plugin['name']);
                if (!empty($plugin['url'])) {
                    $plugin_name = '<a href="' . esc_url($plugin['url']) . '" aria-label="' . esc_attr__('Visit plugin homepage', 'yatra') . '" target="_blank">' . $plugin_name . '</a>';
                }

                $has_newer_version = false;
                $version_string = $plugin['version'];
                $network_string = '';
                if (strstr($plugin['url'], 'woothemes.com') || strstr($plugin['url'], 'yatra.com')) {
                    if (!empty($plugin['version_latest']) && version_compare($plugin['version_latest'], $plugin['version'], '>')) {
                        /* translators: 1: current version. 2: latest version */
                        $version_string = sprintf(__('%1$s (update to version %2$s is available)', 'yatra'), $plugin['version'], $plugin['version_latest']);
                    }

                    if (false !== $plugin['network_activated']) {
                        $network_string = ' &ndash; <strong style="color: black;">' . esc_html__('Network enabled', 'yatra') . '</strong>';
                    }
                }
                $untested_string = '';
                if (array_key_exists($plugin['plugin'], $untested_plugins)) {
                    $untested_string = ' &ndash; <strong style="color: #a00;">';

                    /* translators: %s: version */
                    $untested_string .= esc_html(sprintf(__('Installed version not tested with active version of Yatra %s', 'yatra'), $yatra_version));

                    $untested_string .= '</strong>';
                }
                ?>
                <tr>
                    <td><?php echo wp_kses_post($plugin_name); ?></td>
                    <td class="help">&nbsp;</td>
                    <td>
                        <?php
                        /* translators: %s: plugin author */
                        printf(esc_html__('by %s', 'yatra'), esc_html($plugin['author_name']));
                        echo ' &ndash; ' . esc_html($version_string) . $untested_string . $network_string; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                        ?>
                    </td>
                </tr>
                <?php
            }
        }
    }

}

new Yatra_Module_Section_System_Status();