<?php
/**
 * Admin View: Page - Status Report.
 *
 * @package Yatra
 * @var $this Yatra_Module_Section_System_Status
 */

defined('ABSPATH') || exit;

global $wpdb;


$environment = $this->environment();
$database = $this->get_database_info();
$post_type_counts = $this->get_post_type_counts();

$active_plugins = $this->get_active_plugins();

$inactive_plugins = $this->get_inactive_plugins();
$dropins_mu_plugins = $this->get_dropins_mu_plugins();
$theme = $this->get_theme_info();
$security = $this->get_security_info();
$settings = $this->get_settings();
$wp_pages = $this->get_pages();
$untested_plugins = array();

?>
<div class="yatra-status-table-wrap">

    <table class="yatra_status_table widefat" cellspacing="0" id="status">
        <thead>
        <tr>
            <th colspan="3">
                <h2><?php esc_html_e('WordPress Environment', 'yatra'); ?></h2></th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td><?php esc_html_e('WordPress address (URL)', 'yatra'); ?>:</td>
            <td><span class="yatra-tippy-tooltip dashicons dashicons-editor-help"
                      data-tippy-content="<?php esc_attr_e('The root URL of your site.', 'yatra') ?>"></span>

            </td>
            <td><?php echo esc_html($environment['site_url']); ?></td>
        </tr>
        <tr>
            <td><?php esc_html_e('Site address (URL)', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('The homepage URL of your site', 'yatra'));
                ?>
            </td>
            <td><?php echo esc_html($environment['home_url']); ?></td>
        </tr>
        <tr>
            <td><?php esc_html_e('Yatra version', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('The version of Yatra installed on your site', 'yatra'));
                ?>
            </td>
            <td><?php echo esc_html($environment['version']); ?></td>
        </tr>

        <tr>
            <td><?php esc_html_e('Log directory writable', 'yatra'); ?>:
            </td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Several Yatra addons can write logs which makes debugging problems easier. The directory must be writable for this to happen', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ($environment['log_directory_writable']) {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span> <code class="private">' . esc_html($environment['log_directory']) . '</code></mark> ';
                } else {
                    /* Translators: %1$s: Log directory, %2$s: Log directory constant */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('To allow logging, make %1$s writable or define a custom %2$s.', 'yatra'), '<code>' . esc_html($environment['log_directory']) . '</code>', '<code>yatra()->get_log_dir()</code>') . '</mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td><?php esc_html_e('WordPress version', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('The version of WordPress installed on your site.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                $latest_version = get_transient('yatra_system_status_wp_version_check');

                if (false === $latest_version) {
                    $version_check = wp_remote_get('https://api.wordpress.org/core/version-check/1.7/');
                    $api_response = json_decode(wp_remote_retrieve_body($version_check), true);

                    if ($api_response && isset($api_response['offers'], $api_response['offers'][0], $api_response['offers'][0]['version'])) {
                        $latest_version = $api_response['offers'][0]['version'];
                    } else {
                        $latest_version = $environment['wp_version'];
                    }
                    set_transient('yatra_system_status_wp_version_check', $latest_version, DAY_IN_SECONDS);
                }

                if (version_compare($environment['wp_version'], $latest_version, '<')) {
                    /* Translators: %1$s: Current version, %2$s: New version */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('%1$s - There is a newer version of WordPress available (%2$s)', 'yatra'), esc_html($environment['wp_version']), esc_html($latest_version)) . '</mark>';
                } else {
                    echo '<mark class="yes">' . esc_html($environment['wp_version']) . '</mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="WP Multisite"><?php esc_html_e('WordPress multisite', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Whether or not you have WordPress Multisite enabled.', 'yatra'));
                ?>
            </td>
            <td><?php echo ($environment['wp_multisite']) ? '<span class="dashicons dashicons-yes"></span>' : '&ndash;'; ?></td>
        </tr>
        <tr>
            <td data-export-label="WP Memory Limit"><?php esc_html_e('WordPress memory limit', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('The maximum amount of memory (RAM) that your site can use at one time.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ($environment['wp_memory_limit'] < 67108864) {
                    /* Translators: %1$s: Memory limit, %2$s: Docs link. */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('%1$s - We recommend setting memory to at least 64MB. See: %2$s', 'yatra'), esc_html(size_format($environment['wp_memory_limit'])), '<a href="https://wordpress.org/support/article/editing-wp-config-php/#increasing-memory-allocated-to-php" target="_blank">' . esc_html__('Increasing memory allocated to PHP', 'yatra') . '</a>') . '</mark>';
                } else {
                    echo '<mark class="yes">' . esc_html(size_format($environment['wp_memory_limit'])) . '</mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="WP Debug Mode"><?php esc_html_e('WordPress debug mode', 'yatra'); ?>:</td>

            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Displays whether or not WordPress is in Debug Mode.', 'yatra'));
                ?>
            </td>
            <td>
                <?php if ($environment['wp_debug_mode']) : ?>
                    <mark class="yes"><span class="dashicons dashicons-yes"></span></mark>
                <?php else : ?>
                    <mark class="no">&ndash;</mark>
                <?php endif; ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="WP Cron"><?php esc_html_e('WordPress cron', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Displays whether or not WP Cron Jobs are enabled.', 'yatra'));
                ?>
            </td>
            <td>
                <?php if ($environment['wp_cron']) : ?>
                    <mark class="yes"><span class="dashicons dashicons-yes"></span></mark>
                <?php else : ?>
                    <mark class="no">&ndash;</mark>
                <?php endif; ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="Language"><?php esc_html_e('Language', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('The current language used by WordPress. Default = English.', 'yatra'));
                ?>
            </td>
            <td><?php echo esc_html($environment['language']); ?></td>
        </tr>
        <tr>
            <td data-export-label="External object cache"><?php esc_html_e('External object cache', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Displays whether or not WordPress is using an external object cache.', 'yatra'));
                ?>
            </td>
            <td>
                <?php if ($environment['external_object_cache']) : ?>
                    <mark class="yes"><span class="dashicons dashicons-yes"></span></mark>
                <?php else : ?>
                    <mark class="no">&ndash;</mark>
                <?php endif; ?>
            </td>
        </tr>
        </tbody>
    </table>
    <table class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Server Environment">
                <h2><?php esc_html_e('Server Environment', 'yatra'); ?></h2></th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td data-export-label="Server Info"><?php esc_html_e('Server info', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Information about the web server that is currently hosting your site.', 'yatra'));
                ?>
            </td>
            <td><?php echo esc_html($environment['server_info']); ?></td>
        </tr>
        <tr>
            <td data-export-label="PHP Version"><?php esc_html_e('PHP version', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('The version of PHP installed on your hosting server.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if (version_compare($environment['php_version'], '7.2', '>=')) {
                    echo '<mark class="yes">' . esc_html($environment['php_version']) . '</mark>';
                } else {
                    $update_link = ' <a href="https://docs.yatra.com/document/how-to-update-your-php-version/" target="_blank">' . esc_html__('How to update your PHP version', 'yatra') . '</a>';
                    $class = 'error';

                    if (version_compare($environment['php_version'], '5.4', '<')) {
                        $notice = '<span class="dashicons dashicons-warning"></span> ' . __('Yatra will run under this version of PHP, however, some features such as geolocation are not compatible. Support for this version will be dropped in the next major release. We recommend using PHP version 7.2 or above for greater performance and security.', 'yatra') . $update_link;
                    } elseif (version_compare($environment['php_version'], '5.6', '<')) {
                        $notice = '<span class="dashicons dashicons-warning"></span> ' . __('Yatra will run under this version of PHP, however, it has reached end of life. We recommend using PHP version 7.2 or above for greater performance and security.', 'yatra') . $update_link;
                    } elseif (version_compare($environment['php_version'], '7.2', '<')) {
                        $notice = __('We recommend using PHP version 7.2 or above for greater performance and security.', 'yatra') . $update_link;
                        $class = 'recommendation';
                    }

                    echo '<mark class="' . esc_attr($class) . '">' . esc_html($environment['php_version']) . ' - ' . wp_kses_post($notice) . '</mark>';
                }
                ?>
            </td>
        </tr>
        <?php if (function_exists('ini_get')) : ?>
            <tr>
                <td data-export-label="PHP Post Max Size"><?php esc_html_e('PHP post max size', 'yatra'); ?>:</td>
                <td class="help">
                    <?php
                    yatra_tippy_tooltip(__('The largest filesize that can be contained in one post.', 'yatra'));
                    ?>
                </td>
                <td><?php echo esc_html(size_format($environment['php_post_max_size'])); ?></td>
            </tr>
            <tr>
                <td data-export-label="PHP Time Limit"><?php esc_html_e('PHP time limit', 'yatra'); ?>:</td>
                <td class="help">
                    <?php
                    yatra_tippy_tooltip(__('The amount of time (in seconds) that your site will spend on a single operation before timing out (to avoid server lockups).', 'yatra'));
                    ?>
                </td>
                <td><?php echo esc_html($environment['php_max_execution_time']); ?></td>
            </tr>
            <tr>
                <td data-export-label="PHP Max Input Vars"><?php esc_html_e('PHP max input vars', 'yatra'); ?>:</td>
                <td class="help">
                    <?php
                    yatra_tippy_tooltip(__('The maximum number of variables your server can use for a single function to avoid overloads.', 'yatra'));
                    ?>
                </td>
                <td><?php echo esc_html($environment['php_max_input_vars']); ?></td>
            </tr>
            <tr>
                <td data-export-label="cURL Version"><?php esc_html_e('cURL version', 'yatra'); ?>:</td>
                <td class="help">
                    <?php
                    yatra_tippy_tooltip(__('The version of cURL installed on your server.', 'yatra'));
                    ?>
                </td>
                <td><?php echo esc_html($environment['curl_version']); ?></td>
            </tr>
            <tr>
                <td data-export-label="SUHOSIN Installed"><?php esc_html_e('SUHOSIN installed', 'yatra'); ?>:</td>
                <td class="help">
                    <?php
                    yatra_tippy_tooltip(__('Suhosin is an advanced protection system for PHP installations. It was designed to protect your servers on the one hand against a number of well known problems in PHP applications and on the other hand against potential unknown vulnerabilities within these applications or the PHP core itself. If enabled on your server, Suhosin may need to be configured to increase its data submission limits.', 'yatra'));
                    ?>
                </td>
                <td><?php echo $environment['suhosin_installed'] ? '<span class="dashicons dashicons-yes"></span>' : '&ndash;'; ?></td>
            </tr>
        <?php endif; ?>

        <?php

        if ($environment['mysql_version']) :
            ?>
            <tr>
                <td data-export-label="MySQL Version"><?php esc_html_e('MySQL version', 'yatra'); ?>:</td>

                <td class="help">
                    <?php
                    yatra_tippy_tooltip(__('The version of MySQL installed on your hosting server.', 'yatra'));
                    ?>
                </td>
                <td>
                    <?php
                    if (version_compare($environment['mysql_version'], '5.6', '<') && !strstr($environment['mysql_version_string'], 'MariaDB')) {
                        /* Translators: %1$s: MySQL version, %2$s: Recommended MySQL version. */
                        echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('%1$s - We recommend a minimum MySQL version of 5.6. See: %2$s', 'yatra'), esc_html($environment['mysql_version_string']), '<a href="https://wordpress.org/about/requirements/" target="_blank">' . esc_html__('WordPress requirements', 'yatra') . '</a>') . '</mark>';
                    } else {
                        echo '<mark class="yes">' . esc_html($environment['mysql_version_string']) . '</mark>';
                    }
                    ?>
                </td>
            </tr>
        <?php endif; ?>
        <tr>
            <td data-export-label="Max Upload Size"><?php esc_html_e('Max upload size', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('The largest filesize that can be uploaded to your WordPress installation.', 'yatra'));
                ?>
            </td>
            <td><?php echo esc_html(size_format($environment['max_upload_size'])); ?></td>
        </tr>
        <tr>
            <td data-export-label="Default Timezone is UTC"><?php esc_html_e('Default timezone is UTC', 'yatra'); ?>
                :
            </td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('The default timezone for your server.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ('UTC' !== $environment['default_timezone']) {
                    /* Translators: %s: default timezone.. */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('Default timezone is %s - it should be UTC', 'yatra'), esc_html($environment['default_timezone'])) . '</mark>';
                } else {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span></mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="fsockopen/cURL"><?php esc_html_e('fsockopen/cURL', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Payment gateways can use cURL to communicate with remote servers to authorize payments, other plugins may also use it when communicating with remote services.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ($environment['fsockopen_or_curl_enabled']) {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span></mark>';
                } else {
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . esc_html__('Your server does not have fsockopen or cURL enabled - PayPal IPN and other scripts which communicate with other servers will not work. Contact your hosting provider.', 'yatra') . '</mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="SoapClient"><?php esc_html_e('SoapClient', 'yatra'); ?>:</td>

            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Some webservices like shipping use SOAP to get information from remote servers, for example, live shipping quotes from FedEx require SOAP to be installed.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ($environment['soapclient_enabled']) {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span></mark>';
                } else {
                    /* Translators: %s classname and link. */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('Your server does not have the %s class enabled.', 'yatra'), '<a href="https://php.net/manual/en/class.soapclient.php">SoapClient</a>') . '</mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="DOMDocument"><?php esc_html_e('DOMDocument', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('HTML/Multipart emails use DOMDocument to generate inline CSS in templates.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ($environment['domdocument_enabled']) {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span></mark>';
                } else {
                    /* Translators: %s: classname and link. */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('Your server does not have the %s class enabled - HTML/Multipart emails, and also some extensions, will not work without DOMDocument.', 'yatra'), '<a href="https://php.net/manual/en/class.domdocument.php">DOMDocument</a>') . '</mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="GZip"><?php esc_html_e('GZip', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('GZip (gzopen) is used to open the GEOIP database from MaxMind.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ($environment['gzip_enabled']) {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span></mark>';
                } else {
                    /* Translators: %s: classname and link. */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('Your server does not support the %s function - this is required to use the GeoIP database from MaxMind.', 'yatra'), '<a href="https://php.net/manual/en/zlib.installation.php">gzopen</a>') . '</mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="Multibyte String"><?php esc_html_e('Multibyte string', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Multibyte String (mbstring) is used to convert character encoding, like for emails or converting characters to lowercase.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ($environment['mbstring_enabled']) {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span></mark>';
                } else {
                    /* Translators: %s: classname and link. */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('Your server does not support the %s functions - this is required for better character encoding. Some fallbacks will be used instead for it.', 'yatra'), '<a href="https://php.net/manual/en/mbstring.installation.php">mbstring</a>') . '</mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="Remote Post"><?php esc_html_e('Remote post', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('PayPal uses this method of communicating when sending back transaction information.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ($environment['remote_post_successful']) {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span></mark>';
                } else {
                    /* Translators: %s: function name. */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('%s failed. Contact your hosting provider.', 'yatra'), 'wp_remote_post()') . ' ' . esc_html($environment['remote_post_response']) . '</mark>';
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="Remote Get"><?php esc_html_e('Remote get', 'yatra'); ?>:</td>
            <td class="help">
                <?php
                yatra_tippy_tooltip(__('Yatra plugins may use this method of communication when checking for plugin updates.', 'yatra'));
                ?>
            </td>
            <td>
                <?php
                if ($environment['remote_get_successful']) {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span></mark>';
                } else {
                    /* Translators: %s: function name. */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('%s failed. Contact your hosting provider.', 'yatra'), 'wp_remote_get()') . ' ' . esc_html($environment['remote_get_response']) . '</mark>';
                }
                ?>
            </td>
        </tr>
        <?php
        $rows = apply_filters('yatra_system_status_environment_rows', array());
        foreach ($rows as $row) {
            if (!empty($row['success'])) {
                $css_class = 'yes';
                $icon = '<span class="dashicons dashicons-yes"></span>';
            } else {
                $css_class = 'error';
                $icon = '<span class="dashicons dashicons-no-alt"></span>';
            }
            ?>
            <tr>
                <td data-export-label="<?php echo esc_attr($row['name']); ?>"><?php echo esc_html($row['name']); ?>:
                </td>
                <td class="help">
                    <?php
                    if (isset($row['help'])) {
                        yatra_tippy_tooltip($row['help']);
                    } ?>
                </td>
                <td>
                    <mark class="<?php echo esc_attr($css_class); ?>">
                        <?php echo wp_kses_post($icon); ?><?php echo wp_kses_data(!empty($row['note']) ? $row['note'] : ''); ?>
                    </mark>
                </td>
            </tr>
            <?php
        }
        ?>
        </tbody>
    </table>
    <table id="status-database" class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Database">
                <h2>
                    <?php
                    esc_html_e('Database', 'yatra');
                    //self::output_tables_info();
                    ?>
                </h2>
            </th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td data-export-label="Database Prefix"><?php esc_html_e('Database prefix', 'yatra'); ?></td>
            <td class="help">&nbsp;</td>
            <td>
                <?php
                if (strlen($database['database_prefix']) > 20) {
                    /* Translators: %1$s: Database prefix, %2$s: Docs link. */
                    echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . sprintf(esc_html__('%1$s - We recommend using a prefix with less than 20 characters. See: %2$s', 'yatra'), esc_html($database['database_prefix']), '<a href="https://docs.yatra.com/document/completed-order-email-doesnt-contain-download-links/#section-2" target="_blank">' . esc_html__('How to update your database table prefix', 'yatra') . '</a>') . '</mark>';
                } else {
                    echo '<mark class="yes">' . esc_html($database['database_prefix']) . '</mark>';
                }
                ?>
            </td>
        </tr>

        <?php if (!empty($database['database_size']) && !empty($database['database_tables'])) : ?>
            <tr>
                <td><?php esc_html_e('Total Database Size', 'yatra'); ?></td>
                <td class="help">&nbsp;</td>
                <td><?php printf('%.2fMB', esc_html($database['database_size']['data'] + $database['database_size']['index'])); ?></td>
            </tr>

            <tr>
                <td><?php esc_html_e('Database Data Size', 'yatra'); ?></td>
                <td class="help">&nbsp;</td>
                <td><?php printf('%.2fMB', esc_html($database['database_size']['data'])); ?></td>
            </tr>

            <tr>
                <td><?php esc_html_e('Database Index Size', 'yatra'); ?></td>
                <td class="help">&nbsp;</td>
                <td><?php printf('%.2fMB', esc_html($database['database_size']['index'])); ?></td>
            </tr>

            <?php

            foreach ($database['database_tables']['yatra'] as $table => $table_data) { ?>
                <tr>
                    <td><?php echo esc_html($table); ?></td>
                    <td class="help">&nbsp;</td>
                    <td>
                        <?php
                        if (!$table_data) {
                            echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . esc_html__('Table does not exist', 'yatra') . '</mark>';
                        } else {
                            /* Translators: %1$f: Table size, %2$f: Index size, %3$s Engine. */
                            printf(esc_html__('Data: %1$.2fMB + Index: %2$.2fMB + Engine %3$s', 'yatra'), esc_html(yatra_format_decimal($table_data['data'], 2)), esc_html(yatra_format_decimal($table_data['index'], 2)), esc_html($table_data['engine']));
                        }
                        ?>
                    </td>
                </tr>
            <?php } ?>

            <?php foreach ($database['database_tables']['other'] as $table => $table_data) { ?>
                <tr>
                    <td><?php echo esc_html($table); ?></td>
                    <td class="help">&nbsp;</td>
                    <td>
                        <?php
                        /* Translators: %1$f: Table size, %2$f: Index size, %3$s Engine. */
                        printf(esc_html__('Data: %1$.2fMB + Index: %2$.2fMB + Engine %3$s', 'yatra'), esc_html(yatra_format_decimal($table_data['data'], 2)), esc_html(yatra_format_decimal($table_data['index'], 2)), esc_html($table_data['engine']));
                        ?>
                    </td>
                </tr>
            <?php } ?>
        <?php else : ?>
            <tr>
                <td><?php esc_html_e('Database information:', 'yatra'); ?></td>
                <td class="help">&nbsp;</td>
                <td>
                    <?php
                    esc_html_e(
                        'Unable to retrieve database information. Usually, this is not a problem, and it only means that your install is using a class that replaces the WordPress database class (e.g., HyperDB) and Yatra is unable to get database information.',
                        'yatra'
                    );
                    ?>
                </td>
            </tr>
        <?php endif; ?>
        </tbody>
    </table>
    <?php if ($post_type_counts) : ?>
        <table class="yatra_status_table widefat" cellspacing="0">
            <thead>
            <tr>
                <th colspan="3" data-export-label="Post Type Counts">
                    <h2><?php esc_html_e('Post Type Counts', 'yatra'); ?></h2></th>
            </tr>
            </thead>
            <tbody>
            <?php
            foreach ($post_type_counts as $ptype) {
                ?>
                <tr>
                    <td><?php echo esc_html($ptype['type']); ?></td>
                    <td class="help">&nbsp;</td>
                    <td><?php echo absint($ptype['count']); ?></td>
                </tr>
                <?php
            }
            ?>
            </tbody>
        </table>
    <?php endif; ?>
    <table class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Security"><h2><?php esc_html_e('Security', 'yatra'); ?></h2></th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td data-export-label="Secure connection (HTTPS)"><?php esc_html_e('Secure connection (HTTPS)', 'yatra'); ?>
                :
            </td>

            <td class="help">
                <?php yatra_tippy_tooltip(esc_html__('Is the connection to your site secure?', 'yatra')); ?>
            </td>
            <td>
                <?php if ($security['secure_connection']) : ?>
                    <mark class="yes"><span class="dashicons dashicons-yes"></span></mark>
                <?php else : ?>
                    <mark class="error"><span class="dashicons dashicons-warning"></span>
                        <?php
                        /* Translators: %s: docs link. */
                        echo wp_kses_post(__('Your site is not using HTTPS', 'yatra'));
                        ?>
                    </mark>
                <?php endif; ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="Hide errors from visitors"><?php esc_html_e('Hide errors from visitors', 'yatra'); ?></td>
            <td class="help">
                <?php yatra_tippy_tooltip(esc_html__('Error messages can contain sensitive information about your site environment. These should be hidden from untrusted visitors.', 'yatra')); ?>
            </td>
            <td>
                <?php if ($security['hide_errors']) : ?>
                    <mark class="yes"><span class="dashicons dashicons-yes"></span></mark>
                <?php else : ?>
                    <mark class="error"><span
                                class="dashicons dashicons-warning"></span><?php esc_html_e('Error messages should not be shown to visitors.', 'yatra'); ?>
                    </mark>
                <?php endif; ?>
            </td>
        </tr>
        </tbody>
    </table>
    <table class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Active Plugins (<?php echo count($active_plugins); ?>)">
                <h2><?php esc_html_e('Active Plugins', 'yatra'); ?> (<?php echo count($active_plugins); ?>)</h2></th>
        </tr>
        </thead>
        <tbody>
        <?php self::output_plugins_info($active_plugins, $untested_plugins); ?>
        </tbody>
    </table>
    <table class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Inactive Plugins (<?php echo count($inactive_plugins); ?>)">
                <h2><?php esc_html_e('Inactive Plugins', 'yatra'); ?> (<?php echo count($inactive_plugins); ?>)</h2>
            </th>
        </tr>
        </thead>
        <tbody>
        <?php self::output_plugins_info($inactive_plugins, $untested_plugins); ?>
        </tbody>
    </table>
    <?php
    if (0 < count($dropins_mu_plugins['dropins'])) :
        ?>
        <table class="yatra_status_table widefat" cellspacing="0">
            <thead>
            <tr>
                <th colspan="3"
                    data-export-label="Dropin Plugins (<?php echo count($dropins_mu_plugins['dropins']); ?>)">
                    <h2><?php esc_html_e('Dropin Plugins', 'yatra'); ?>
                        (<?php echo count($dropins_mu_plugins['dropins']); ?>)</h2></th>
            </tr>
            </thead>
            <tbody>
            <?php
            foreach ($dropins_mu_plugins['dropins'] as $dropin) {
                ?>
                <tr>
                    <td><?php echo wp_kses_post($dropin['plugin']); ?></td>
                    <td class="help">&nbsp;</td>
                    <td><?php echo wp_kses_post($dropin['name']); ?>
                </tr>
                <?php
            }
            ?>
            </tbody>
        </table>
    <?php
    endif;
    if (0 < count($dropins_mu_plugins['mu_plugins'])) :
        ?>
        <table class="yatra_status_table widefat" cellspacing="0">
            <thead>
            <tr>
                <th colspan="3"
                    data-export-label="Must Use Plugins (<?php echo count($dropins_mu_plugins['mu_plugins']); ?>)">
                    <h2><?php esc_html_e('Must Use Plugins', 'yatra'); ?>
                        (<?php echo count($dropins_mu_plugins['mu_plugins']); ?>)</h2></th>
            </tr>
            </thead>
            <tbody>
            <?php
            foreach ($dropins_mu_plugins['mu_plugins'] as $mu_plugin) { // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
                $plugin_name = esc_html($mu_plugin['name']);
                if (!empty($mu_plugin['url'])) {
                    $plugin_name = '<a href="' . esc_url($mu_plugin['url']) . '" aria-label="' . esc_attr__('Visit plugin homepage', 'yatra') . '" target="_blank">' . $plugin_name . '</a>';
                }
                ?>
                <tr>
                    <td><?php echo wp_kses_post($plugin_name); ?></td>
                    <td class="help">&nbsp;</td>
                    <td>
                        <?php
                        /* translators: %s: plugin author */
                        printf(esc_html__('by %s', 'yatra'), esc_html($mu_plugin['author_name']));
                        echo ' &ndash; ' . esc_html($mu_plugin['version']);
                        ?>
                </tr>
                <?php
            }
            ?>
            </tbody>
        </table>
    <?php endif; ?>
    <table class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Settings"><h2><?php esc_html_e('Settings', 'yatra'); ?></h2></th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td data-export-label="Currency"><?php esc_html_e('Currency', 'yatra'); ?></td>
            <td class="help">
                <?php yatra_tippy_tooltip(esc_html__('What currency prices are listed and which currency gateways will take payments in.', 'yatra')); ?>
            </td>
            <td><?php echo esc_html($settings['currency']); ?> (<?php echo esc_html($settings['currency_symbol']); ?>)
            </td>
        </tr>
        <tr>
            <td data-export-label="Currency Position"><?php esc_html_e('Currency position', 'yatra'); ?></td>
            <td class="help">
                <?php yatra_tippy_tooltip(esc_html__('The position of the currency symbol.', 'yatra')); ?>
            </td>
            <td><?php echo esc_html($settings['currency_position']); ?></td>
        </tr>
        <tr>
            <td data-export-label="Thousand Separator"><?php esc_html_e('Thousand separator', 'yatra'); ?></td>
            <td class="help">
                <?php yatra_tippy_tooltip(esc_html__('The thousand separator of displayed prices.', 'yatra')); ?>
            </td>
            <td><?php echo esc_html($settings['thousand_separator']); ?></td>
        </tr>
        <tr>
            <td data-export-label="Decimal Separator"><?php esc_html_e('Decimal separator', 'yatra'); ?></td>
            <td class="help">
                <?php yatra_tippy_tooltip(esc_html__('The decimal separator of displayed prices.', 'yatra')); ?>
            </td>
            <td><?php echo esc_html($settings['decimal_separator']); ?></td>
        </tr>
        <tr>
            <td data-export-label="Number of Decimals"><?php esc_html_e('Number of decimals', 'yatra'); ?></td>
            <td class="help">
                <?php yatra_tippy_tooltip(esc_html__('The number of decimal points shown in displayed prices.', 'yatra')); ?>
            </td>
            <td><?php echo esc_html($settings['number_of_decimals']); ?></td>
        </tr>

        </tbody>
    </table>
    <table class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Yatra Pages"><h2><?php esc_html_e('Yatra Pages', 'yatra'); ?></h2>
            </th>
        </tr>
        </thead>
        <tbody>
        <?php
        $alt = 1;
        foreach ($wp_pages as $_page) {
            $found_error = false;

            if ($_page['page_id']) {
                /* Translators: %s: page name. */
                $page_name = '<a href="' . get_edit_post_link($_page['page_id']) . '" aria-label="' . sprintf(esc_html__('Edit %s page', 'yatra'), esc_html($_page['page_name'])) . '">' . esc_html($_page['page_name']) . '</a>';
            } else {
                $page_name = esc_html($_page['page_name']);
            }

            echo '<tr><td data-export-label="' . esc_attr($page_name) . '">' . wp_kses_post($page_name) . ':</td>';
            /* Translators: %s: page name. */
            echo '<td class="help">';


            yatra_tippy_tooltip((sprintf(esc_html__('The URL of your %s page (along with the Page ID).', 'yatra'), $page_name)));
            echo '</td><td>';

            // Page ID check.
            if (!$_page['page_set']) {
                echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . esc_html__('Page not set', 'yatra') . '</mark>';
                $found_error = true;
            } elseif (!$_page['page_exists']) {
                echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . esc_html__('Page ID is set, but the page does not exist', 'yatra') . '</mark>';
                $found_error = true;
            } elseif (!$_page['page_visible']) {
                /* Translators: %s: docs link. */
                echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . wp_kses_post(sprintf(__('Page visibility should be <a href="%s" target="_blank">public</a>', 'yatra'), 'https://wordpress.org/support/article/content-visibility/')) . '</mark>';
                $found_error = true;
            } else {
                // Shortcode and block check.
                if ($_page['shortcode_required'] || $_page['block_required']) {
                    if (!$_page['shortcode_present'] && !$_page['block_present']) {
                        /* Translators: %1$s: shortcode text, %2$s: block slug. */
                        echo '<mark class="error"><span class="dashicons dashicons-warning"></span> ' . ($_page['block_required'] ? sprintf(esc_html__('Page does not contain the %1$s shortcode or the %2$s block.', 'yatra'), esc_html($_page['shortcode']), esc_html($_page['block'])) : sprintf(esc_html__('Page does not contain the %s shortcode.', 'yatra'), esc_html($_page['shortcode']))) . '</mark>'; /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped */
                        $found_error = true;
                    }
                }
            }

            if (!$found_error) {
                echo '<mark class="yes">#' . absint($_page['page_id']) . ' - ' . esc_html(str_replace(home_url(), '', get_permalink($_page['page_id']))) . '</mark>';
            }

            echo '</td></tr>';
        }
        ?>
        </tbody>
    </table>
    <table class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Theme"><h2><?php esc_html_e('Theme', 'yatra'); ?></h2></th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td data-export-label="Name"><?php esc_html_e('Name', 'yatra'); ?>:</td>
            <td class="help"><?php echo(esc_html__('The name of the current active theme.', 'yatra')); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped */ ?></td>
            <td><?php echo esc_html($theme['name']); ?></td>
        </tr>
        <tr>
            <td data-export-label="Version"><?php esc_html_e('Version', 'yatra'); ?>:</td>
            <td class="help"><?php echo(esc_html__('The installed version of the current active theme.', 'yatra')); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped */ ?></td>
            <td>
                <?php
                if (version_compare($theme['version'], $theme['version_latest'], '<')) {
                    /* translators: 1: current version. 2: latest version */
                    echo esc_html(sprintf(__('%1$s (update to version %2$s is available)', 'yatra'), $theme['version'], $theme['version_latest']));
                } else {
                    echo esc_html($theme['version']);
                }
                ?>
            </td>
        </tr>
        <tr>
            <td data-export-label="Author URL"><?php esc_html_e('Author URL', 'yatra'); ?>:</td>
            <td class="help"><?php echo(esc_html__('The theme developers URL.', 'yatra')); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped */ ?></td>
            <td><?php echo esc_html($theme['author_url']); ?></td>
        </tr>
        <tr>
            <td data-export-label="Child Theme"><?php esc_html_e('Child theme', 'yatra'); ?>:</td>
            <td class="help"><?php echo(esc_html__('Displays whether or not the current theme is a child theme.', 'yatra')); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped */ ?></td>
            <td>
                <?php
                if ($theme['is_child_theme']) {
                    echo '<mark class="yes"><span class="dashicons dashicons-yes"></span></mark>';
                } else {
                    /* Translators: %s docs link. */
                    echo '<span class="dashicons dashicons-no-alt"></span> &ndash; ' . wp_kses_post(sprintf(__('If you are modifying Yatra on a parent theme that you did not build personally we recommend using a child theme. See: <a href="%s" target="_blank">How to create a child theme</a>', 'yatra'), 'https://developer.wordpress.org/themes/advanced-topics/child-themes/'));
                }
                ?>
            </td>
        </tr>
        <?php if ($theme['is_child_theme']) : ?>
            <tr>
                <td data-export-label="Parent Theme Name"><?php esc_html_e('Parent theme name', 'yatra'); ?>:</td>
                <td class="help"><?php echo(esc_html__('The name of the parent theme.', 'yatra')); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped */ ?></td>
                <td><?php echo esc_html($theme['parent_name']); ?></td>
            </tr>
            <tr>
                <td data-export-label="Parent Theme Version"><?php esc_html_e('Parent theme version', 'yatra'); ?>:
                </td>
                <td class="help"><?php echo(esc_html__('The installed version of the parent theme.', 'yatra')); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped */ ?></td>
                <td>
                    <?php
                    echo esc_html($theme['parent_version']);
                    if (version_compare($theme['parent_version'], $theme['parent_version_latest'], '<')) {
                        /* translators: %s: parent theme latest version */
                        echo ' &ndash; <strong style="color:red;">' . sprintf(esc_html__('%s is available', 'yatra'), esc_html($theme['parent_version_latest'])) . '</strong>';
                    }
                    ?>
                </td>
            </tr>
            <tr>
                <td data-export-label="Parent Theme Author URL"><?php esc_html_e('Parent theme author URL', 'yatra'); ?>
                    :
                </td>
                <td class="help"><?php echo(esc_html__('The parent theme developers URL.', 'yatra')); /* phpcs:ignore WordPress.XSS.EscapeOutput.OutputNotEscaped */ ?></td>
                <td><?php echo esc_html($theme['parent_author_url']); ?></td>
            </tr>
        <?php endif ?>
        </tbody>
    </table>
    <table class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Templates">
                <h2><?php esc_html_e('Templates', 'yatra'); ?>

                    <?php
                    yatra_tippy_tooltip(esc_html__('This section shows any files that are overriding the default Yatra template pages.', 'yatra')); ?>
                </h2>
            </th>
        </tr>
        </thead>
        <tbody>
        <?php if ($theme['has_yatra_file']) : ?>
            <tr>
                <td data-export-label="Archive Template"><?php esc_html_e('Archive template', 'yatra'); ?>:</td>
                <td class="help">&nbsp;</td>
                <td><?php esc_html_e('Your theme has a yatra.php file, you will not be able to override the yatra/archive-product.php custom template since yatra.php has priority over archive-product.php. This is intended to prevent display issues.', 'yatra'); ?></td>
            </tr>
        <?php endif ?>
        <?php if (!empty($theme['overrides'])) : ?>
            <tr>
                <td data-export-label="Overrides"><?php esc_html_e('Overrides', 'yatra'); ?></td>
                <td class="help">&nbsp;</td>
                <td>
                    <?php
                    $total_overrides = count($theme['overrides']);
                    for ($i = 0; $i < $total_overrides; $i++) {
                        $override = $theme['overrides'][$i];
                        if ($override['core_version'] && (empty($override['version']) || version_compare($override['version'], $override['core_version'], '<'))) {
                            $current_version = $override['version'] ? $override['version'] : '-';
                            printf(
                            /* Translators: %1$s: Template name, %2$s: Template version, %3$s: Core version. */
                                esc_html__('%1$s version %2$s is out of date. The core version is %3$s', 'yatra'),
                                '<code>' . esc_html($override['file']) . '</code>',
                                '<strong style="color:red">' . esc_html($current_version) . '</strong>',
                                esc_html($override['core_version'])
                            );
                        } else {
                            echo esc_html($override['file']);
                        }
                        if ((count($theme['overrides']) - 1) !== $i) {
                            echo ', ';
                        }
                        echo '<br />';
                    }
                    ?>
                </td>
            </tr>
        <?php else : ?>
            <tr>
                <td data-export-label="Overrides"><?php esc_html_e('Overrides', 'yatra'); ?>:</td>
                <td class="help">&nbsp;</td>
                <td>&ndash;</td>
            </tr>
        <?php endif; ?>

        <?php if (true === $theme['has_outdated_templates']) : ?>
            <tr>
                <td data-export-label="Outdated Templates"><?php esc_html_e('Outdated templates', 'yatra'); ?>:</td>
                <td class="help">&nbsp;</td>
                <td>
                    <mark class="error">
                        <span class="dashicons dashicons-warning"></span>
                    </mark>
                    <a href="https://docs.mantrabrain.com/yatra-wordpress-plugin/" target="_blank">
                        <?php esc_html_e('Learn how to update', 'yatra'); ?>
                    </a>
                </td>
            </tr>
        <?php endif; ?>
        </tbody>
    </table>

    <?php do_action('yatra_system_status_report'); ?>

    <table class="yatra_status_table widefat" cellspacing="0">
        <thead>
        <tr>
            <th colspan="3" data-export-label="Status Report Information">
                <h2><?php esc_html_e('Status Report Information', 'yatra'); ?>
                    <?php
                    yatra_tippy_tooltip(esc_html__('This section shows information about this status report.', 'yatra')); ?>

                </h2>
            </th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td data-export-label="Generated at"><?php esc_html_e('Generated at', 'yatra'); ?>:</td>
            <td class="help">&nbsp;</td>
            <td><?php echo esc_html(current_time('Y-m-d H:i:s P')); ?></td>

        </tr>
        </tbody>
    </table>
</div>
