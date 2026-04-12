<?php
/**
 * Yatra Pro &lt; 3.0 is incompatible with Yatra Free 3.0+ (removed / renamed classes such as Yatra_Form).
 * When both are active, old Pro can fatal before Free runs if Pro loads first in the active-plugins list.
 *
 * This file:
 * 1. Reorders active plugins so yatra/yatra.php loads before yatra-pro/yatra-pro.php when both are active.
 * 2. Deactivates old Pro (version &lt; 3.0.0) when Free 3.0+ is running, and stores an admin notice.
 *
 * @package Yatra
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Minimum Yatra Pro version that works with Yatra Free 3.0.x.
 */
function yatra_get_minimum_compatible_pro_version(): string
{
    return '3.0.0';
}

/**
 * Where customers download Yatra Pro (account / downloads).
 */
function yatra_get_compatible_pro_account_url(): string
{
    return 'https://store.mantrabrain.com/account';
}

/**
 * Normalize plugin header versions for comparison. PHP's version_compare treats "3.0" as older than "3.0.0",
 * so Pro 3.0 was incorrectly flagged as incompatible with minimum 3.0.0.
 *
 * @param string $version Raw Version header value.
 */
function yatra_normalize_version_for_compare(string $version): string
{
    $version = trim($version);
    if ($version === '') {
        return '0.0.0';
    }

    if (preg_match('/^(\d+(?:\.\d+)*)/', $version, $m)) {
        $parts = array_map('intval', explode('.', $m[1]));
        while (count($parts) < 3) {
            $parts[] = 0;
        }

        return implode('.', array_slice($parts, 0, 3));
    }

    return $version;
}

/**
 * Whether installed Yatra Pro version meets the minimum for Yatra Free 3.0+.
 */
function yatra_is_pro_version_compatible(string $pro_version): bool
{
    $pro = yatra_normalize_version_for_compare($pro_version);
    $min = yatra_normalize_version_for_compare(yatra_get_minimum_compatible_pro_version());

    return version_compare($pro, $min, '>=');
}

/**
 * Put Yatra Free and Yatra Pro at the start of the active list, in that order, so Free always boots before Pro.
 *
 * @return bool True if the option was updated.
 */
function yatra_normalize_yatra_plugins_active_order(): bool
{
    if (!function_exists('get_option') || !function_exists('update_option')) {
        return false;
    }

    $active = get_option('active_plugins', []);
    if (!is_array($active) || $active === []) {
        return false;
    }

    $free = 'yatra/yatra.php';
    $pro = 'yatra-pro/yatra-pro.php';

    $has_free = in_array($free, $active, true);
    $has_pro = in_array($pro, $active, true);

    if (!$has_free || !$has_pro) {
        return false;
    }

    $rest = array_values(array_diff($active, [$free, $pro]));
    $merged = array_merge([$free, $pro], $rest);

    if ($merged === array_values($active)) {
        return false;
    }

    update_option('active_plugins', $merged);

    return true;
}

/**
 * If Yatra Free 3.0+ is active and an old Yatra Pro (&lt; 3.0.0) is active, deactivate Pro and queue an admin notice.
 */
function yatra_deactivate_incompatible_old_pro(): void
{
    if (!defined('YATRA_VERSION')) {
        return;
    }

    if (version_compare(YATRA_VERSION, '3.0.0', '<')) {
        return;
    }

    if (!function_exists('get_plugin_data')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    $pro_file = WP_PLUGIN_DIR . '/yatra-pro/yatra-pro.php';
    if (!is_readable($pro_file)) {
        return;
    }

    $data = get_plugin_data($pro_file, false, false);
    $pro_version = isset($data['Version']) ? trim((string) $data['Version']) : '0';

    if ($pro_version === '' || yatra_is_pro_version_compatible($pro_version)) {
        return;
    }

    if (!function_exists('is_plugin_active')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    if (!is_plugin_active('yatra-pro/yatra-pro.php')) {
        return;
    }

    deactivate_plugins('yatra-pro/yatra-pro.php', true);

    set_transient(
        'yatra_admin_notice_incompatible_pro_deactivated',
        [
            'pro_version' => $pro_version,
            'min_required' => yatra_get_minimum_compatible_pro_version(),
        ],
        WEEK_IN_SECONDS
    );
}

/**
 * Run guard once this file is loaded (yatra.php included after constants).
 */
function yatra_run_incompatible_pro_guard(): void
{
    yatra_normalize_yatra_plugins_active_order();
    yatra_deactivate_incompatible_old_pro();
}

/**
 * Admin notice after we deactivated incompatible Pro.
 */
function yatra_admin_notice_incompatible_pro_deactivated(): void
{
    if (!is_admin() || !current_user_can('activate_plugins')) {
        return;
    }

    $payload = get_transient('yatra_admin_notice_incompatible_pro_deactivated');
    if (!is_array($payload)) {
        return;
    }

    $pro_v = isset($payload['pro_version']) ? sanitize_text_field((string) $payload['pro_version']) : '';
    $min_v = isset($payload['min_required']) ? sanitize_text_field((string) $payload['min_required']) : yatra_get_minimum_compatible_pro_version();

    $dismiss_url = wp_nonce_url(
        add_query_arg('yatra_dismiss_pro_notice', '1'),
        'yatra_dismiss_pro_notice'
    );

    ?>
    <div class="notice notice-error is-dismissible" data-yatra-pro-notice="1">
        <p>
            <strong><?php esc_html_e('Yatra Pro was deactivated', 'yatra'); ?></strong>
        </p>
        <p>
            <?php
            printf(
                /* translators: 1: detected Yatra Pro version, 2: minimum required Pro version, 3: current Yatra Free version */
                esc_html__(
                    'Your site had Yatra Pro %1$s active together with Yatra %3$s. Pro versions older than %2$s are not compatible with Yatra 3.0 and were causing fatal errors (missing classes such as Yatra_Form). Yatra Pro has been deactivated automatically.',
                    'yatra'
                ),
                esc_html($pro_v !== '' ? $pro_v : '?'),
                esc_html($min_v),
                esc_html(defined('YATRA_VERSION') ? YATRA_VERSION : '3.0')
            );
            ?>
        </p>
        <p>
            <?php
            $account_url = yatra_get_compatible_pro_account_url();
            printf(
                /* translators: 1: minimum Yatra Pro version, 2: HTML link to MantraBrain store account */
                wp_kses_post(
                    __(
                        'Please download and install <strong>Yatra Pro %1$s or newer</strong> from your MantraBrain store account: %2$s to use Pro features with this version of Yatra.',
                        'yatra'
                    )
                ),
                esc_html($min_v),
                sprintf(
                    '<a href="%1$s" target="_blank" rel="noopener noreferrer">%2$s</a>',
                    esc_url($account_url),
                    esc_html($account_url)
                )
            );
            ?>
        </p>
        <p>
            <a href="<?php echo esc_url($dismiss_url); ?>" class="button">
                <?php esc_html_e('Dismiss this notice', 'yatra'); ?>
            </a>
        </p>
    </div>
    <?php
}

/**
 * Dismiss the notice (clears transient).
 */
function yatra_handle_dismiss_incompatible_pro_notice(): void
{
    if (!is_admin() || !isset($_GET['yatra_dismiss_pro_notice']) || !current_user_can('activate_plugins')) {
        return;
    }

    if (!isset($_GET['_wpnonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_wpnonce'])), 'yatra_dismiss_pro_notice')) {
        return;
    }

    delete_transient('yatra_admin_notice_incompatible_pro_deactivated');
    wp_safe_redirect(remove_query_arg(['yatra_dismiss_pro_notice', '_wpnonce']));
    exit;
}

/**
 * Remove the "Pro was deactivated" notice once installed Yatra Pro meets the minimum (e.g. header "3.0" vs minimum "3.0.0").
 */
function yatra_clear_stale_pro_incompatible_notice(): void
{
    if (!is_admin()) {
        return;
    }

    if (!get_transient('yatra_admin_notice_incompatible_pro_deactivated')) {
        return;
    }

    if (!function_exists('get_plugin_data')) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    $pro_file = WP_PLUGIN_DIR . '/yatra-pro/yatra-pro.php';
    if (!is_readable($pro_file)) {
        return;
    }

    $data = get_plugin_data($pro_file, false, false);
    $v = isset($data['Version']) ? trim((string) $data['Version']) : '0';

    if ($v !== '' && yatra_is_pro_version_compatible($v)) {
        delete_transient('yatra_admin_notice_incompatible_pro_deactivated');
    }
}

add_action('admin_init', 'yatra_clear_stale_pro_incompatible_notice', 0);
add_action('admin_notices', 'yatra_admin_notice_incompatible_pro_deactivated', 1);
add_action('admin_init', 'yatra_handle_dismiss_incompatible_pro_notice', 1);

/**
 * After Free is installed/updated via the dashboard, normalize load order before the next request hits plugins.
 */
function yatra_on_upgrader_process_complete($upgrader, array $hook_extra): void
{
    if (!isset($hook_extra['plugin']) || $hook_extra['plugin'] !== 'yatra/yatra.php') {
        return;
    }
    yatra_normalize_yatra_plugins_active_order();
    yatra_deactivate_incompatible_old_pro();
}

add_action('upgrader_process_complete', 'yatra_on_upgrader_process_complete', 10, 2);

/**
 * On Plugins → Installed Plugins, show a row warning under Yatra Pro if the installed package is &lt; 3.0 (cannot be safely activated with Yatra 3.0 Free).
 *
 * @param string               $plugin_file Relative plugin path.
 * @param array<string, mixed> $plugin_data Headers from the plugin file.
 */
function yatra_plugin_row_old_pro_warning(string $plugin_file, array $plugin_data): void
{
    if (!defined('YATRA_VERSION') || version_compare(YATRA_VERSION, '3.0.0', '<')) {
        return;
    }

    $v = isset($plugin_data['Version']) ? trim((string) $plugin_data['Version']) : '0';
    if ($v === '' || yatra_is_pro_version_compatible($v)) {
        return;
    }

    $account_url = yatra_get_compatible_pro_account_url();
    $msg = sprintf(
        /* translators: 1: minimum Yatra Pro version, 2: account URL */
        esc_html__(
            'This Yatra Pro version is not compatible with Yatra 3.0. Activating it will cause a fatal error. Install Yatra Pro %1$s or newer from your MantraBrain store account (%2$s) before activating.',
            'yatra'
        ),
        esc_html(yatra_get_minimum_compatible_pro_version()),
        esc_html($account_url)
    );

    printf(
        '<tr class="plugin-update-tr active yatra-pro-incompatible-row"><td colspan="4" class="plugin-update colspanchange"><div class="update-message notice inline notice-error notice-alt"><p>%s</p></div></td></tr>',
        $msg
    );
}

add_action('after_plugin_row_yatra-pro/yatra-pro.php', 'yatra_plugin_row_old_pro_warning', 10, 2);
