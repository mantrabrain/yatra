<?php
/**
 * Yatra usage telemetry (opt-in, privacy-safe).
 *
 * @package Yatra\Admin
 */

declare(strict_types=1);

namespace Yatra\Admin;

use Yatra\Core\Modules\ModuleManager;
use Yatra\Database\Tables\BookingsTable;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripsTable;
use Yatra\Hooks\TelemetryHookNames;
use Yatra\Services\SettingsService;

defined('ABSPATH') || exit;

/**
 * Centralized telemetry: consent, collection, cron, sync, local cache.
 *
 * Payload is intentionally minimal: environment + Yatra usage signals only.
 * No customer PII, booking/traveler data, API keys, full plugin manifests,
 * or hashed emails — only counts, booleans, and coarse compatibility hints.
 *
 * @since 3.0.0
 */
final class StatsUsage
{
    public const OPT_CONSENT = 'yatra_allow_usage_tracking';
    public const OPT_INSTANCE_ID = 'yatra_usage_instance_id';
    public const OPT_LAST_SYNC = 'yatra_usage_last_sync';
    public const OPT_RETRY_COUNT = 'yatra_usage_retry_count';
    public const OPT_NEXT_RETRY = 'yatra_usage_next_retry';
    public const OPT_ONBOARDING_META = 'yatra_usage_onboarding_meta';
    public const OPT_EVENT_COUNTERS = 'yatra_usage_event_counters';
    public const OPT_LAST_PAYLOAD_HASH = 'yatra_usage_last_payload_hash';
    /** @var string Last remote error for admin debugging (HTTP code, wp_remote body snippet). */
    public const OPT_LAST_SEND_ERROR = 'yatra_usage_last_send_error';
    public const TRANSIENT_SNAPSHOT = 'yatra_usage_snapshot_pending';
    public const TRANSIENT_ADMIN_FALLBACK = 'yatra_usage_admin_fallback_throttle';
    public const CRON_HOOK = 'yatra_usage_tracking_event';
    public const IMMEDIATE_HOOK = 'yatra_usage_tracking_immediate';
    /**
     * Default ingest URL for the Usage hub (same route as pretty /wp-json/mantrabrain/v1/collect).
     * Query-style rest_route is used so POSTs still reach WordPress when rewrites or edge proxies
     * return a generic HTML 404 for /wp-json/... (common on some shared/CDN setups).
     */
    public const ENDPOINT = 'https://usage.mantrabrain.com/index.php?rest_route=/mantrabrain/v1/collect';

    /**
     * Remote collect URL. Override with wp-config constant YATRA_USAGE_TRACKING_ENDPOINT or filter `yatra_usage_tracking_endpoint`.
     */
    private static function get_remote_endpoint(): string
    {
        if (defined('YATRA_USAGE_TRACKING_ENDPOINT') && is_string(YATRA_USAGE_TRACKING_ENDPOINT) && YATRA_USAGE_TRACKING_ENDPOINT !== '') {
            return (string) YATRA_USAGE_TRACKING_ENDPOINT;
        }

        return (string) apply_filters('yatra_usage_tracking_endpoint', self::ENDPOINT);
    }

    private static ?self $instance = null;

    public static function instance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function init(): void
    {
        add_action(self::CRON_HOOK, [$this, 'cron_sync']);
        add_action(self::IMMEDIATE_HOOK, [$this, 'cron_sync']);
        add_action('admin_init', [$this, 'maybe_fallback_sync'], 30);
        // Subscribed hook names must match do_action() emitters (see TelemetryHookNames).
        add_action(TelemetryHookNames::BOOKING_CREATED, [$this, 'on_booking_created'], 20, 2);
        add_action(TelemetryHookNames::TRIP_CREATED_WITH_RELATIONS, [$this, 'on_trip_created'], 20, 3);
        add_action(TelemetryHookNames::SETUP_WIZARD_COMPLETED, [$this, 'on_wizard_completed']);
        add_action(TelemetryHookNames::PAYMENT_GATEWAY_CONFIG_SAVED, [$this, 'on_gateway_config_saved'], 10, 2);
    }

    public function is_enabled(): bool
    {
        return (bool) get_option(self::OPT_CONSENT, false);
    }

    public function enable(bool $send_immediate = true): void
    {
        update_option(self::OPT_CONSENT, true);
        $this->ensure_instance_id();
        $this->schedule_weekly();
        delete_option(self::OPT_RETRY_COUNT);
        delete_option(self::OPT_NEXT_RETRY);
        if ($send_immediate) {
            wp_unschedule_hook(self::IMMEDIATE_HOOK);
            wp_schedule_single_event(time() + 2, self::IMMEDIATE_HOOK);
            if (!defined('DISABLE_WP_CRON') || !DISABLE_WP_CRON) {
                spawn_cron();
            }
        }
    }

    public function disable(): void
    {
        update_option(self::OPT_CONSENT, false);
        wp_clear_scheduled_hook(self::CRON_HOOK);
        wp_clear_scheduled_hook(self::IMMEDIATE_HOOK);
        delete_option(self::OPT_RETRY_COUNT);
        delete_option(self::OPT_NEXT_RETRY);
        delete_transient(self::TRANSIENT_SNAPSHOT);
        delete_option(self::OPT_LAST_PAYLOAD_HASH);
    }

    public function schedule_weekly(): void
    {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time() + HOUR_IN_SECONDS, 'weekly', self::CRON_HOOK);
        }
    }

    /**
     * Record a lightweight product event (local counter; included in next payload).
     */
    public function record_event(string $name, int $delta = 1): void
    {
        if (!$this->is_enabled()) {
            return;
        }
        $name = sanitize_key($name);
        if ($name === '' || $delta === 0) {
            return;
        }
        $counters = get_option(self::OPT_EVENT_COUNTERS, []);
        if (!is_array($counters)) {
            $counters = [];
        }
        $counters[$name] = (int) ($counters[$name] ?? 0) + $delta;
        update_option(self::OPT_EVENT_COUNTERS, $counters, false);
        do_action('yatra_usage_tracking_event_recorded', $name, $delta, $counters);
    }

    public function cron_sync(): void
    {
        if (!$this->is_enabled()) {
            return;
        }
        $next = (int) get_option(self::OPT_NEXT_RETRY, 0);
        if ($next > time()) {
            return;
        }
        $this->sync();
    }

    public function maybe_fallback_sync(): void
    {
        if (!is_admin() || !current_user_can('manage_options')) {
            return;
        }
        if (!$this->is_enabled()) {
            return;
        }
        if (get_transient(self::TRANSIENT_ADMIN_FALLBACK)) {
            return;
        }
        $last = (int) get_option(self::OPT_LAST_SYNC, 0);
        // If weekly cron likely missed (~9 days), try once while an admin is present.
        if ($last > 0 && (time() - $last) < 9 * DAY_IN_SECONDS) {
            return;
        }
        set_transient(self::TRANSIENT_ADMIN_FALLBACK, 1, 12 * HOUR_IN_SECONDS);
        $this->sync();
    }

    public function on_booking_created(int $booking_id, $booking): void
    {
        unset($booking_id, $booking);
        if (!$this->is_enabled()) {
            return;
        }
        if (get_option('yatra_usage_flag_first_booking', '') === '1') {
            return;
        }
        update_option('yatra_usage_flag_first_booking', '1', false);
        $this->record_event('first_booking_received');
    }

    /**
     * Trips are stored in {@see TripsTable}, not the legacy `tour` post type.
     *
     * @param array<string,mixed> $relationships
     * @param array<string,mixed> $data
     */
    public function on_trip_created(int $trip_id, array $relationships, array $data): void
    {
        unset($trip_id, $relationships, $data);
        if (!$this->is_enabled()) {
            return;
        }
        if (get_option('yatra_usage_flag_first_trip', '') === '1') {
            return;
        }
        update_option('yatra_usage_flag_first_trip', '1', false);
        $this->record_event('first_trip_created');
    }

    public function on_wizard_completed(): void
    {
        $meta = $this->get_onboarding_meta();
        $meta['completed_at'] = time();
        $meta['onboarding_completed'] = true;
        update_option(self::OPT_ONBOARDING_META, $meta, false);
        if ($this->is_enabled()) {
            $this->record_event('onboarding_completed');
        }
    }

    /**
     * @param array<string,mixed> $config
     */
    public function on_gateway_config_saved(string $gateway_id, array $config): void
    {
        unset($gateway_id, $config);
        if (!$this->is_enabled()) {
            return;
        }
        $this->record_event('payment_gateway_connected');
    }

    /**
     * @return array<string,mixed>
     */
    public function get_onboarding_meta(): array
    {
        $m = get_option(self::OPT_ONBOARDING_META, []);
        return is_array($m) ? $m : [];
    }

    /**
     * @param array<string,mixed> $patch
     */
    public function patch_onboarding_meta(array $patch): void
    {
        $meta = array_merge($this->get_onboarding_meta(), $patch);
        update_option(self::OPT_ONBOARDING_META, $meta, false);
    }

    public function mark_onboarding_started(): void
    {
        $meta = $this->get_onboarding_meta();
        if (!empty($meta['started_at'])) {
            return;
        }
        $meta['started_at'] = time();
        $meta['onboarding_started'] = true;
        update_option(self::OPT_ONBOARDING_META, $meta, false);
        if ($this->is_enabled()) {
            $this->record_event('onboarding_started');
        }
    }

    public function set_onboarding_step(string $step): void
    {
        $this->patch_onboarding_meta([
            'last_step' => sanitize_key($step),
        ]);
    }

    /**
     * Full sync: build payload, POST, handle retry/backoff.
     *
     * @param bool $require_opt_in When false, sends even if the site has not opted in (admin “test send” only).
     */
    public function sync(bool $require_opt_in = true): bool
    {
        if ($require_opt_in && !$this->is_enabled()) {
            return false;
        }
        $this->ensure_instance_id();

        $payload = $this->build_payload();
        $json = wp_json_encode($payload);
        if ($json === false) {
            return false;
        }

        $hash = hash('sha256', $json);
        $last_hash = (string) get_option(self::OPT_LAST_PAYLOAD_HASH, '');
        // Avoid spamming identical payloads within the same day (cron + immediate + fallback).
        if ($last_hash === $hash && (time() - (int) get_option(self::OPT_LAST_SYNC, 0)) < DAY_IN_SECONDS) {
            return true;
        }

        set_transient(self::TRANSIENT_SNAPSHOT, $payload, HOUR_IN_SECONDS);

        $endpoint = self::get_remote_endpoint();

        $args = [
            'timeout' => 20,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Plugin' => 'yatra',
                'X-Product' => 'yatra',
                'X-Version' => defined('YATRA_VERSION') ? (string) YATRA_VERSION : '0',
            ],
            'body' => $json,
            'blocking' => true,
        ];

        /**
         * Filter wp_remote_post arguments for usage telemetry (e.g. add Authorization for a self-hosted receiver).
         *
         * @param array<string,mixed>   $args     Request arguments.
         * @param array<string,mixed>   $payload  Encoded payload array (pre-JSON).
         * @param string                $endpoint Resolved remote URL after `yatra_usage_tracking_endpoint`.
         */
        $args = apply_filters('yatra_usage_tracking_remote_args', $args, $payload, $endpoint);

        $response = wp_remote_post($endpoint, $args);

        $code = wp_remote_retrieve_response_code($response);
        $ok = !is_wp_error($response) && $code >= 200 && $code < 300;

        if ($ok) {
            update_option(self::OPT_LAST_SYNC, time(), false);
            update_option(self::OPT_LAST_PAYLOAD_HASH, $hash, false);
            delete_option(self::OPT_RETRY_COUNT);
            delete_option(self::OPT_NEXT_RETRY);
            delete_option(self::OPT_LAST_SEND_ERROR);
            delete_transient(self::TRANSIENT_SNAPSHOT);
            return true;
        }

        $this->record_send_failure($endpoint, $response);

        $retries = (int) get_option(self::OPT_RETRY_COUNT, 0) + 1;
        update_option(self::OPT_RETRY_COUNT, $retries, false);
        $delay = min(86400, (int) (300 * pow(2, min($retries, 8))));
        update_option(self::OPT_NEXT_RETRY, time() + $delay, false);

        return false;
    }

    /**
     * Last send failure detail for REST / admin (cleared on success).
     *
     * @return array{endpoint:string,time:int,code:int,wp_error:?string,body:?string}|null
     */
    public function get_last_send_error(): ?array
    {
        $raw = get_option(self::OPT_LAST_SEND_ERROR, null);
        if (!is_array($raw)) {
            return null;
        }

        return $raw;
    }

    /**
     * @param \WP_Error|array<string,mixed> $response
     */
    private function record_send_failure(string $endpoint, $response): void
    {
        $code = is_wp_error($response) ? 0 : (int) wp_remote_retrieve_response_code($response);
        $wpErr = is_wp_error($response) ? $response->get_error_message() : null;
        $body = null;
        if (!is_wp_error($response)) {
            $b = wp_remote_retrieve_body($response);
            if (is_string($b) && $b !== '') {
                $body = function_exists('mb_substr') ? mb_substr($b, 0, 800) : substr($b, 0, 800);
            }
        }

        update_option(
            self::OPT_LAST_SEND_ERROR,
            [
                'endpoint' => $endpoint,
                'time' => time(),
                'code' => $code,
                'wp_error' => $wpErr,
                'body' => $body,
            ],
            false
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function build_payload(): array
    {
        $system = $this->collect_system();
        $free = $this->collect_yatra_free();
        $pro = apply_filters('yatra_pro_usage_tracking_payload', $this->collect_yatra_pro_base());
        $support = $this->collect_support_intel($system, $free, $pro);
        $events = $this->get_event_counters();

        $pro_arr = is_array($pro) ? $pro : [];
        $is_pro_site = !empty($pro_arr['yatra_pro_active']) || !empty($pro_arr['yatra_pro_license_active']);

        $themeRows = $this->collect_active_wordpress_themes();

        $payload = [
            'schema_version' => 2,
            'product' => 'yatra',
            'plugin_slug' => 'yatra',
            'plugin_name' => 'Yatra',
            'plugin_category' => 'booking',
            'plugin_version' => defined('YATRA_VERSION') ? (string) YATRA_VERSION : '',
            'is_premium' => $is_pro_site,
            'sent_at' => gmdate('c'),
            'blog_id' => is_multisite() ? get_current_blog_id() : 1,
            'system' => $system,
            'yatra_free' => $free,
            'yatra_pro' => $pro_arr,
            'support' => $support,
            'events' => $events,
            /** Full inventory for telemetry warehouse (plugins/themes/modules). */
            'active_plugins' => $this->collect_active_wordpress_plugins(),
            'active_theme' => $themeRows[0] ?? null,
            'active_themes' => $themeRows,
            'yatra_modules' => $this->collect_yatra_modules_rows(),
        ];

        return apply_filters('yatra_usage_tracking_payload', $payload);
    }

    public function ensure_instance_id(): string
    {
        $id = (string) get_option(self::OPT_INSTANCE_ID, '');
        if ($id !== '') {
            return $id;
        }
        if (function_exists('wp_generate_uuid4')) {
            $id = wp_generate_uuid4();
        } else {
            $id = bin2hex(random_bytes(16));
        }
        update_option(self::OPT_INSTANCE_ID, $id, false);

        return $id;
    }

    public function clear_local_cache(): void
    {
        delete_transient(self::TRANSIENT_SNAPSHOT);
        delete_option(self::OPT_LAST_PAYLOAD_HASH);
        delete_option(self::OPT_EVENT_COUNTERS);
    }

    public function delete_snapshots(): void
    {
        $this->clear_local_cache();
        delete_option(self::OPT_LAST_SYNC);
    }

    /**
     * @return array<string,int>
     */
    public function get_event_counters(): array
    {
        $c = get_option(self::OPT_EVENT_COUNTERS, []);
        if (!is_array($c)) {
            return [];
        }
        $out = [];
        foreach ($c as $k => $v) {
            $out[sanitize_key((string) $k)] = (int) $v;
        }

        return $out;
    }

    public function get_next_scheduled(): int
    {
        $t = wp_next_scheduled(self::CRON_HOOK);

        return $t ? (int) $t : 0;
    }

    /**
     * @return array<string,mixed>
     */
    private function collect_system(): array
    {
        global $wpdb;

        $theme = wp_get_theme();
        $active_plugins = (array) get_option('active_plugins', []);

        return [
            'instance_id' => $this->ensure_instance_id(),
            'site_url' => untrailingslashit(site_url()),
            'wp_version' => $GLOBALS['wp_version'] ?? '',
            'php_version' => PHP_VERSION,
            'mysql_version' => isset($wpdb->dbh) ? (string) $wpdb->db_version() : '',
            'web_server' => isset($_SERVER['SERVER_SOFTWARE']) ? sanitize_text_field(wp_unslash((string) $_SERVER['SERVER_SOFTWARE'])) : '',
            'ssl_enabled' => is_ssl(),
            'timezone' => (string) wp_timezone_string(),
            'locale' => get_locale(),
            'multisite' => is_multisite(),
            'wp_cron_disabled' => defined('DISABLE_WP_CRON') && DISABLE_WP_CRON,
            'object_cache_enabled' => function_exists('wp_using_ext_object_cache') && wp_using_ext_object_cache(),
            'active_theme_name' => (string) $theme->get('Name'),
            'active_theme_version' => (string) $theme->get('Version'),
            /** Aggregate only — avoids sending full stack / per-plugin versions. */
            'active_plugin_count' => count($active_plugins),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function collect_yatra_free(): array
    {
        $meta = $this->get_onboarding_meta();
        $tours = $this->count_trips();
        $destinations = $this->count_destinations();
        $bookings = $this->count_bookings();
        $gateways = SettingsService::get('payment_gateways', []);
        if (!is_array($gateways)) {
            $gateways = [];
        }
        $enabled_gateways = array_filter($gateways);

        return [
            'yatra_free_version' => defined('YATRA_VERSION') ? YATRA_VERSION : '',
            'booking_flow' => (string) apply_filters('yatra_usage_booking_flow', 'pageless'),
            'onboarding_started' => !empty($meta['onboarding_started']),
            'onboarding_completed' => !empty($meta['onboarding_completed']),
            'onboarding_last_step' => (string) ($meta['last_step'] ?? ''),
            'setup_dropoff_step' => (string) ($meta['dropoff_step'] ?? ''),
            'tours_count' => $tours,
            'destinations_count' => $destinations,
            'bookings_count' => $bookings,
            'enquiry_forms_enabled' => (bool) get_option('yatra_enable_enquiry', false),
            'payment_gateways_enabled' => array_keys($enabled_gateways),
            'email_templates_customized' => $this->detect_email_templates_customized(),
            'blocks_used' => $this->detect_yatra_blocks_used(),
            'widgets_used' => $this->detect_yatra_widgets_used(),
            'elementor_widgets_used' => (bool) apply_filters('yatra_usage_elementor_widgets_used', false),
            'rest_api_usage_enabled' => (bool) apply_filters('yatra_usage_rest_api_enabled', true),
            'beta_features_enabled' => (bool) apply_filters('yatra_usage_beta_features_enabled', false),
            'first_trip_created' => get_option('yatra_usage_flag_first_trip', '') === '1',
            'first_booking_received' => get_option('yatra_usage_flag_first_booking', '') === '1',
            'upgrade_cta_clicks' => (int) ($this->get_event_counters()['pro_cta_clicked'] ?? 0),
            'upgrade_page_views' => (int) ($this->get_event_counters()['pro_upgrade_page_visited'] ?? 0),
            'abandoned_setup_detected' => $this->detect_abandoned_setup($meta),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function collect_yatra_pro_base(): array
    {
        $pro_file = WP_PLUGIN_DIR . '/yatra-pro/yatra-pro.php';
        $installed = file_exists($pro_file);
        $active = (bool) apply_filters('yatra_is_pro_active', false);
        $version = defined('YATRA_PRO_VERSION') ? (string) YATRA_PRO_VERSION : '';
        $activated_at = (int) get_option('yatra_usage_pro_activated_at', 0);
        if ($active && $activated_at === 0) {
            $activated_at = time();
            update_option('yatra_usage_pro_activated_at', $activated_at, false);
        }
        $days_since = $activated_at > 0 ? (int) floor((time() - $activated_at) / DAY_IN_SECONDS) : 0;

        $modules = [];
        if ($active && function_exists('get_option')) {
            $enabled = get_option('yatra_pro_modules_enabled', []);
            $modules = is_array($enabled) ? array_values(array_map('sanitize_key', $enabled)) : [];
        }

        return [
            'yatra_pro_installed' => $installed,
            'yatra_pro_active' => $active,
            'yatra_pro_version' => $version,
            'yatra_pro_license_active' => (bool) apply_filters('yatra_pro_usage_license_active', false),
            'yatra_pro_license_tier' => (string) apply_filters('yatra_pro_usage_license_tier', ''),
            'yatra_pro_days_since_activation' => $days_since,
            'yatra_pro_last_seen' => time(),
            /** List of enabled Pro module slugs (compact vs. all-true map). */
            'enabled_pro_modules' => $modules,
            'premium_payment_gateways' => (array) apply_filters('yatra_pro_usage_premium_gateways', []),
            'coupons_enabled' => (bool) apply_filters('yatra_pro_usage_coupons_enabled', false),
            'recurring_tours_enabled' => (bool) apply_filters('yatra_pro_usage_recurring_tours', false),
            'seasonal_pricing_enabled' => (bool) apply_filters('yatra_pro_usage_seasonal_pricing', false),
            'advanced_search_enabled' => (bool) apply_filters('yatra_pro_usage_advanced_search', false),
            'partial_payment_enabled' => (bool) SettingsService::get('partial_payment', false),
            'multicurrency_enabled' => (bool) apply_filters('yatra_pro_usage_multicurrency', false),
            'custom_checkout_fields_enabled' => (bool) apply_filters('yatra_pro_usage_custom_checkout_fields', false),
            'premium_email_automation_enabled' => (bool) apply_filters('yatra_pro_usage_email_automation', false),
            'pdf_invoice_enabled' => (bool) apply_filters('yatra_pro_usage_pdf_invoice', false),
            'woocommerce_bridge_enabled' => (bool) apply_filters('yatra_pro_usage_woocommerce', false),
            'advanced_itinerary_builder_used' => (bool) apply_filters('yatra_pro_usage_itinerary_builder', false),
            'abandoned_booking_recovery_enabled' => (bool) apply_filters('yatra_pro_usage_abandoned_recovery', false),
            'agent_vendor_module_enabled' => (bool) apply_filters('yatra_pro_usage_agent_vendor', false),
            'premium_analytics_enabled' => (bool) apply_filters('yatra_pro_usage_premium_analytics', false),
            'premium_rest_integrations_enabled' => (bool) apply_filters('yatra_pro_usage_rest_integrations', false),
            'premium_widgets_used' => (bool) apply_filters('yatra_pro_usage_premium_widgets', false),
            'first_premium_booking_received' => (bool) apply_filters('yatra_pro_usage_first_premium_booking', false),
            'unused_premium_modules_count' => (int) apply_filters('yatra_pro_usage_unused_modules_count', 0),
            'free_pro_version_mismatch' => $this->version_mismatch($version),
            'legacy_pro_upgrade_needed' => (bool) apply_filters('yatra_pro_usage_legacy_upgrade_needed', false),
            'renewal_due_in_days' => (int) apply_filters('yatra_pro_usage_renewal_due_days', -1),
            'expired_license_days' => (int) apply_filters('yatra_pro_usage_expired_license_days', 0),
            'pro_retention_health_score' => (float) apply_filters('yatra_pro_usage_retention_health_score', 0.0),
        ];
    }

    /**
     * @param array<string,mixed> $system
     * @param array<string,mixed> $free
     * @param array<string,mixed> $pro
     * @return array<string,mixed>
     */
    private function collect_support_intel(array $system, array $free, array $pro): array
    {
        unset($free, $pro);
        $php_ver = PHP_VERSION;
        $wp_ver = (string) ($system['wp_version'] ?? '');
        $mem = $this->parse_bytes((string) ini_get('memory_limit'));

        $out = [
            'recent_cron_failures_count' => (int) get_option('yatra_usage_cron_failures', 0),
            'recent_rest_errors_count' => (int) get_option('yatra_usage_rest_errors', 0),
            'plugin_conflict_candidates' => $this->conflict_plugin_slugs(),
            'low_memory_risk' => $mem > 0 && $mem < 96 * 1024 * 1024,
            'old_php_risk' => version_compare($php_ver, '8.0', '<'),
            'unsupported_wp_risk' => $wp_ver !== '' && version_compare($wp_ver, '6.0', '<'),
            'checkout_misconfiguration_detected' => (bool) apply_filters('yatra_usage_checkout_misconfigured', false),
        ];

        return apply_filters('yatra_usage_support_intel_payload', $out, $system);
    }

    /**
     * @return array<string,mixed>
     */
    private function detect_abandoned_setup(array $meta): bool
    {
        if (!empty($meta['onboarding_completed'])) {
            return false;
        }
        $started = (int) ($meta['started_at'] ?? 0);
        if ($started <= 0) {
            return false;
        }

        return (time() - $started) > 7 * DAY_IN_SECONDS;
    }

    private function version_mismatch(string $pro_version): bool
    {
        if ($pro_version === '') {
            return false;
        }
        $free = defined('YATRA_VERSION') ? (string) YATRA_VERSION : '';

        return $free !== '' && version_compare(explode('-', $free)[0], explode('-', $pro_version)[0], '!=');
    }

    /**
     * @return list<string>
     */
    private function conflict_plugin_slugs(): array
    {
        $candidates = [
            'woocommerce/woocommerce.php',
            'easy-digital-downloads/easy-digital-downloads.php',
            'wp-travel/wp-travel.php',
            'wp-travel-engine/wp-travel-engine.php',

        ];
        $active = (array) get_option('active_plugins', []);
        $hit = [];
        foreach ($candidates as $p) {
            if (in_array($p, $active, true)) {
                $hit[] = $p;
            }
        }

        return apply_filters('yatra_usage_conflict_plugin_candidates', $hit);
    }

    private function parse_bytes(string $val): int
    {
        $val = trim($val);
        if ($val === '' || $val === '-1') {
            return 0;
        }
        $u = strtoupper(substr($val, -1));
        $n = (float) $val;
        if ($u === 'G') {
            return (int) ($n * 1024 * 1024 * 1024);
        }
        if ($u === 'M') {
            return (int) ($n * 1024 * 1024);
        }
        if ($u === 'K') {
            return (int) ($n * 1024);
        }

        return (int) $n;
    }

    private function count_trips(): int
    {
        if (!class_exists(TripsTable::class)) {
            return 0;
        }
        global $wpdb;
        $table = TripsTable::getTableName();
        $like = $wpdb->esc_like($table);
        $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $like));
        if ($exists !== $table) {
            return 0;
        }
        $n = $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$table}` WHERE deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00'" // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        );

        return (int) $n;
    }

    private function count_destinations(): int
    {
        if (!class_exists(ClassificationsTable::class)) {
            return 0;
        }
        global $wpdb;
        $table = ClassificationsTable::getTableName();
        $like = $wpdb->esc_like($table);
        $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $like));
        if ($exists !== $table) {
            return 0;
        }
        $n = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM `{$table}` WHERE `type` = %s AND `status` = %s", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
                'destination',
                'publish'
            )
        );

        return (int) $n;
    }

    private function count_bookings(): int
    {
        if (!class_exists(BookingsTable::class)) {
            return 0;
        }
        global $wpdb;
        $table = BookingsTable::getTableName();
        $like = $wpdb->esc_like($table);
        $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $like));
        if ($exists !== $table) {
            return 0;
        }
        $n = $wpdb->get_var("SELECT COUNT(*) FROM `{$table}`"); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        return (int) $n;
    }

    private function detect_email_templates_customized(): bool
    {
        $keys = [
            'email_template_booking_custom',
            'email_body_booking',
        ];
        foreach ($keys as $k) {
            $v = get_option('yatra_' . $k, null);
            if ($v !== null && $v !== '') {
                return true;
            }
        }

        return (bool) apply_filters('yatra_usage_email_templates_customized', false);
    }

    private function detect_yatra_blocks_used(): bool
    {
        $detected = false;
        if (apply_filters('yatra_usage_skip_blocks_scan', false)) {
            return (bool) apply_filters('yatra_usage_blocks_used', $detected);
        }
        global $wpdb;
        $like = '%wp:yatra/%';
        $n = (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(ID) FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_content LIKE %s LIMIT 1",
                $like
            )
        );
        $detected = $n > 0;

        return (bool) apply_filters('yatra_usage_blocks_used', $detected);
    }

    private function detect_yatra_widgets_used(): bool
    {
        $sidebars = get_option('sidebars_widgets', []);
        if (!is_array($sidebars)) {
            return false;
        }
        foreach ($sidebars as $widgets) {
            if (!is_array($widgets)) {
                continue;
            }
            foreach ($widgets as $id) {
                if (is_string($id) && stripos($id, 'yatra') !== false) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * All active regular + network + must-use plugins (Yatra core row excluded; sent as main product).
     *
     * @return list<array<string,mixed>>
     */
    private function collect_active_wordpress_plugins(): array
    {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugins = get_plugins();
        $active = (array) get_option('active_plugins', []);

        if (is_multisite()) {
            $network = get_site_option('active_sitewide_plugins', []);
            if (is_array($network)) {
                $active = array_values(array_unique(array_merge($active, array_keys($network))));
            }
        }

        $yatraFile = defined('YATRA_PLUGIN_FILE') ? plugin_basename((string) YATRA_PLUGIN_FILE) : 'yatra/yatra.php';
        $metricDate = gmdate('Y-m-d');
        $out = [];

        foreach ($active as $rel) {
            if (!is_string($rel) || !isset($plugins[$rel])) {
                continue;
            }
            if ($rel === $yatraFile) {
                continue;
            }
            $row = $plugins[$rel];
            $dir = dirname($rel);
            $slug = ($dir === '.' || $dir === '') ? basename($rel, '.php') : $dir;
            $slug = sanitize_title(str_replace(['/', '\\'], '-', $slug));

            $out[] = [
                'product_slug' => $slug !== '' ? $slug : 'plugin',
                'product_name' => (string) ($row['Name'] ?? $slug),
                'product_version' => (string) ($row['Version'] ?? ''),
                'parameters' => [
                    [
                        'parameter_id' => 'plugin_file',
                        'parameter_name' => 'Plugin file',
                        'value' => $rel,
                        'metric_date' => $metricDate,
                    ],
                ],
            ];
        }

        if (function_exists('get_mu_plugins')) {
            foreach (get_mu_plugins() as $rel => $row) {
                if (!is_array($row)) {
                    continue;
                }
                $base = basename($rel, '.php');
                $slug = 'mu-' . sanitize_title($base);

                $out[] = [
                    'product_slug' => $slug !== '' ? $slug : 'mu-plugin',
                    'product_name' => (string) ($row['Name'] ?? $base),
                    'product_version' => (string) ($row['Version'] ?? ''),
                    'parameters' => [
                        [
                            'parameter_id' => 'must_use',
                            'parameter_name' => 'Must-use plugin',
                            'value' => '1',
                            'metric_date' => $metricDate,
                        ],
                        [
                            'parameter_id' => 'plugin_file',
                            'parameter_name' => 'Plugin file',
                            'value' => $rel,
                            'metric_date' => $metricDate,
                        ],
                    ],
                ];
            }
        }

        return $out;
    }

    /**
     * Active stylesheet theme and parent theme (if child theme).
     *
     * @return list<array<string,mixed>>
     */
    private function collect_active_wordpress_themes(): array
    {
        $theme = wp_get_theme();
        $metricDate = gmdate('Y-m-d');
        $stylesheet = (string) $theme->get_stylesheet();
        $slug = sanitize_title($stylesheet);

        $out = [
            [
                'product_slug' => $slug !== '' ? $slug : 'theme',
                'product_name' => (string) $theme->get('Name'),
                'product_version' => (string) $theme->get('Version'),
                'product_type' => 'theme',
                'parameters' => [
                    [
                        'parameter_id' => 'theme_role',
                        'parameter_name' => 'Theme role',
                        'value' => 'active',
                        'metric_date' => $metricDate,
                    ],
                    [
                        'parameter_id' => 'stylesheet',
                        'parameter_name' => 'Stylesheet',
                        'value' => $stylesheet,
                        'metric_date' => $metricDate,
                    ],
                ],
            ],
        ];

        $parent = $theme->parent();
        if ($parent instanceof \WP_Theme) {
            $pStylesheet = (string) $parent->get_stylesheet();
            $pSlug = sanitize_title($pStylesheet);
            $out[] = [
                'product_slug' => $pSlug !== '' ? $pSlug : 'parent-theme',
                'product_name' => (string) $parent->get('Name'),
                'product_version' => (string) $parent->get('Version'),
                'product_type' => 'theme',
                'parameters' => [
                    [
                        'parameter_id' => 'theme_role',
                        'parameter_name' => 'Theme role',
                        'value' => 'parent',
                        'metric_date' => $metricDate,
                    ],
                    [
                        'parameter_id' => 'stylesheet',
                        'parameter_name' => 'Stylesheet',
                        'value' => $pStylesheet,
                        'metric_date' => $metricDate,
                    ],
                ],
            ];
        }

        return $out;
    }

    /**
     * Yatra feature modules (enabled / availability flags).
     *
     * @return list<array<string,mixed>>
     */
    private function collect_yatra_modules_rows(): array
    {
        if (!class_exists(ModuleManager::class)) {
            return [];
        }

        $metricDate = gmdate('Y-m-d');
        $rows = [];
        foreach (ModuleManager::getModules() as $mod) {
            if (!is_array($mod) || empty($mod['slug'])) {
                continue;
            }
            $slug = sanitize_key((string) $mod['slug']);
            if ($slug === '') {
                continue;
            }
            $name = $mod['name'] ?? $slug;
            if (!is_string($name)) {
                $name = (string) $slug;
            }

            $rows[] = [
                'product_slug' => 'yatra-module-' . $slug,
                'product_name' => $name,
                'product_type' => 'module',
                'parent_slug' => 'yatra',
                'product_version' => '',
                'parameters' => [
                    [
                        'parameter_id' => 'module_enabled',
                        'parameter_name' => 'Enabled',
                        'value' => !empty($mod['enabled']) ? '1' : '0',
                        'metric_date' => $metricDate,
                    ],
                    [
                        'parameter_id' => 'module_available',
                        'parameter_name' => 'Available',
                        'value' => !empty($mod['is_available']) ? '1' : '0',
                        'metric_date' => $metricDate,
                    ],
                    [
                        'parameter_id' => 'requires_pro',
                        'parameter_name' => 'Requires Pro',
                        'value' => !empty($mod['requires_pro']) ? '1' : '0',
                        'metric_date' => $metricDate,
                    ],
                ],
            ];
        }

        return $rows;
    }
}
