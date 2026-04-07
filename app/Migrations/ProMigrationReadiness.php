<?php

declare(strict_types=1);

namespace Yatra\Migration;

/**
 * Detects active Yatra Pro by plugin headers (not install folder slug) and requires version 3.0+ for migration.
 *
 * @package Yatra\Migration
 */
final class ProMigrationReadiness
{
    public const MINIMUM_PRO_VERSION = '3.0.0';

    /**
     * Normalize semver for PHP's version_compare. Short forms like "3.0" compare as *older* than "3.0.0"
     * unless padded (see PHP version_compare behavior).
     */
    private static function normalizeVersionForCompare(string $version): string
    {
        $version = preg_replace('/^[vV]+/', '', trim($version));
        $core = preg_split('/[-+]/', $version, 2)[0];
        $segments = explode('.', $core);
        $segments = array_pad($segments, 3, '0');

        return implode('.', array_slice(array_map('intval', $segments), 0, 3));
    }

    /**
     * Plugins are considered Yatra Pro when Text Domain is `yatra-pro` or the plugin name contains "Yatra Pro"
     * (covers renamed install directories).
     *
     * @return list<array{file: string, name: string, version: string|null}>
     */
    public static function findActiveYatraProPlugins(): array
    {
        if (!function_exists('get_plugin_data')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $active = (array) get_option('active_plugins', []);
        if (is_multisite()) {
            $network = get_site_option('active_sitewide_plugins', []);
            if (is_array($network)) {
                $active = array_merge($active, array_keys($network));
            }
            $active = array_values(array_unique($active));
        }

        $found = [];
        foreach ($active as $pluginFile) {
            $pluginFile = (string) $pluginFile;
            if ($pluginFile === '') {
                continue;
            }
            $path = WP_PLUGIN_DIR . '/' . $pluginFile;
            if (!is_readable($path)) {
                continue;
            }
            $data = get_plugin_data($path, false, false);
            $name = isset($data['Name']) ? (string) $data['Name'] : '';
            $textDomain = isset($data['TextDomain']) ? (string) $data['TextDomain'] : '';
            $rawVersion = isset($data['Version']) ? trim((string) $data['Version']) : '';
            $version = $rawVersion !== '' ? $rawVersion : null;

            // Do not rely on install folder slug. Match official headers only (name may be "Yatra Pro", "Yatra Pro OLD", etc.).
            $isYatraPro = ($textDomain === 'yatra-pro')
                || (stripos($name, 'Yatra Pro') === 0);
            if (!$isYatraPro) {
                continue;
            }

            $found[] = [
                'file' => $pluginFile,
                'name' => $name,
                'version' => $version,
            ];
        }

        return $found;
    }

    /**
     * @return array{
     *     ready: bool,
     *     pro_plugin_active: bool,
     *     multiple_pro_plugins: bool,
     *     pro_plugin_file: string|null,
     *     pro_plugin_name: string|null,
     *     pro_version: string|null,
     *     active_pro_plugins: list<array{file: string, name: string, version: string|null}>,
     *     minimum_pro_version: string,
     *     warning_message: string
     * }
     */
    public static function getState(): array
    {
        $plugins = self::findActiveYatraProPlugins();
        $count = count($plugins);

        $multiple = $count > 1;
        $single = $count === 1 ? $plugins[0] : null;
        $version = $single['version'] ?? null;
        $versionOk = $version !== null
            && version_compare(
                self::normalizeVersionForCompare($version),
                self::normalizeVersionForCompare(self::MINIMUM_PRO_VERSION),
                '>='
            );
        $ready = !$multiple && $single !== null && $versionOk;

        $warning = '';
        if (!$ready) {
            if ($multiple) {
                $list = implode(', ', array_map(static fn (array $p): string => $p['file'], $plugins));
                $warning = sprintf(
                    /* translators: %s: comma-separated list of plugin paths */
                    __(
                        'More than one Yatra Pro plugin is active (%s). Deactivate duplicates so only Yatra Pro 3.0 or newer remains. Pro-specific migration will not run correctly with multiple copies.',
                        'yatra'
                    ),
                    $list
                );
            } elseif ($count === 0) {
                $warning = __(
                    'No Yatra Pro plugin is active. If you used Yatra Pro before, install and activate Yatra Pro 3.0 or newer first — Pro-related migration steps (additional services, some payment settings, Pro tables) will be skipped or incomplete.',
                    'yatra'
                );
            } else {
                $warning = sprintf(
                    /* translators: %1$s: detected Yatra Pro version, %2$s: minimum required version */
                    __(
                        'Your active Yatra Pro version is %1$s. Update to Yatra Pro %2$s or newer before migrating. Pro-specific migration steps will not succeed on older versions.',
                        'yatra'
                    ),
                    $version !== null ? $version : __('unknown', 'yatra'),
                    '3.0'
                );
            }
        }

        return [
            'ready' => $ready,
            'pro_plugin_active' => $count >= 1,
            'multiple_pro_plugins' => $multiple,
            'pro_plugin_file' => $single['file'] ?? null,
            'pro_plugin_name' => $single['name'] ?? null,
            'pro_version' => $version,
            'active_pro_plugins' => $plugins,
            'minimum_pro_version' => self::MINIMUM_PRO_VERSION,
            'warning_message' => $warning,
        ];
    }
}
