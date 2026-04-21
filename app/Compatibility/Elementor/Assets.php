<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor;

/**
 * Elementor compatibility (assets + body class)
 *
 * Ensures Elementor Theme Builder header/footer styling (kit typography, spacing, fonts)
 * applies on Yatra routed pages (trip, booking, destination/activity/category, listings).
 */
final class Assets
{
    public static function register(): void
    {
        if (!class_exists('\Elementor\Plugin')) {
            return;
        }

        // Run late so kit typography can win over other CSS.
        add_action('wp_enqueue_scripts', [self::class, 'enqueue'], 100);
        add_filter('body_class', [self::class, 'bodyClass'], 20, 1);
    }

    /**
     * True when the current request is a Yatra routed frontend page.
     */
    private static function isYatraRoutedPage(): bool
    {
        if (!function_exists('yatra_is_yatra_page')) {
            return false;
        }

        return yatra_is_yatra_page()
            || (function_exists('yatra_is_booking_page') && yatra_is_booking_page())
            || (function_exists('yatra_is_trip_listing') && yatra_is_trip_listing())
            || (function_exists('yatra_is_single_trip') && yatra_is_single_trip());
    }

    public static function enqueue(): void
    {
        if (!self::isYatraRoutedPage()) {
            return;
        }

        try {
            $plugin = \Elementor\Plugin::$instance;

            // Force core Elementor handles (some themes rely on these directly).
            foreach ([
                'elementor-frontend',
                'elementor-icons',
                'elementor-animations',
                'elementor-frontend-google-fonts',
            ] as $handle) {
                if (wp_style_is($handle, 'registered') || wp_style_is($handle, 'queue')) {
                    wp_enqueue_style($handle);
                }
            }

            if ($plugin && isset($plugin->frontend)) {
                if (method_exists($plugin->frontend, 'enqueue_styles')) {
                    $plugin->frontend->enqueue_styles();
                }
                if (method_exists($plugin->frontend, 'enqueue_scripts')) {
                    $plugin->frontend->enqueue_scripts();
                }
            }

            // Elementor "Site Settings" (Kit) CSS.
            if (class_exists('\Elementor\Core\Files\CSS\Post')) {
                $kits = $plugin->kits_manager ?? null;
                if ($kits && method_exists($kits, 'get_active_id')) {
                    $kitId = (int) $kits->get_active_id();
                    if ($kitId > 0) {
                        \Elementor\Core\Files\CSS\Post::enqueue($kitId);

                        // Ensure the kit CSS handle itself is enqueued if Elementor registered it.
                        $kitHandle = 'elementor-post-' . $kitId;
                        if (wp_style_is($kitHandle, 'registered') || wp_style_is($kitHandle, 'queue')) {
                            wp_enqueue_style($kitHandle);
                        }
                    }
                }
            }

            // Elementor Pro Theme Builder extra styles/fonts (if present).
            if (class_exists('\ElementorPro\Plugin')) {
                foreach ([
                    'elementor-pro',
                    'elementor-pro-frontend',
                    'elementor-pro-frontend-google-fonts',
                ] as $handle) {
                    if (wp_style_is($handle, 'registered') || wp_style_is($handle, 'queue')) {
                        wp_enqueue_style($handle);
                    }
                }

                $pro = \ElementorPro\Plugin::instance();
                if ($pro && method_exists($pro, 'get_frontend')) {
                    $frontend = $pro->get_frontend();
                    if ($frontend) {
                        if (method_exists($frontend, 'enqueue_styles')) {
                            $frontend->enqueue_styles();
                        }
                        if (method_exists($frontend, 'enqueue_scripts')) {
                            $frontend->enqueue_scripts();
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // Never break frontend rendering due to optional integration.
        }
    }

    /**
     * @param string[] $classes
     * @return string[]
     */
    public static function bodyClass(array $classes): array
    {
        if (!self::isYatraRoutedPage()) {
            return $classes;
        }

        try {
            $plugin = \Elementor\Plugin::$instance;
            $kits = $plugin->kits_manager ?? null;
            if ($kits && method_exists($kits, 'get_active_id')) {
                $kitId = (int) $kits->get_active_id();
                if ($kitId > 0) {
                    $kitClass = 'elementor-kit-' . $kitId;
                    if (!in_array($kitClass, $classes, true)) {
                        $classes[] = $kitClass;
                    }
                }
            }
        } catch (\Throwable $e) {
            return $classes;
        }

        return $classes;
    }
}

