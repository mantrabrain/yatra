<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor;

/**
 * Elementor compatibility – Assets & Body Class
 *
 * Ensures Elementor Theme Builder header/footer styling (kit typography, spacing,
 * Google Fonts) applies on all Yatra routed pages (trip, booking, destination,
 * activity, category and listing pages).
 *
 * Boot order: registered on `plugins_loaded` (priority 20) via Bootstrap so that
 * Elementor classes are guaranteed to be loaded before we check for them.
 *
 * === Font loading architecture ===
 *
 * Elementor loads Google Fonts in two stages:
 *   1. CSS enqueue   : `\Elementor\Core\Files\CSS\Post::create($id)->enqueue()` enqueues the
 *                      pre-generated CSS file AND queues each font in
 *                      `$frontend->fonts_to_enqueue` via `$frontend->enqueue_font()`.
 *   2. wp_head print : `$frontend->print_fonts_links()` (hooked by `Frontend::init()` at
 *                      priority 7) reads `fonts_to_enqueue` and outputs `<link>` tags.
 *
 * On Yatra pages (custom routing), Elementor does NOT detect the page as its own,
 * so neither step runs automatically. We trigger both:
 *   – Step 1: call `Post::create($id)->enqueue()` for the active Kit and every
 *             active Theme Builder header/footer template.
 *   – Step 2: hook an explicit `wp_head` callback at priority 9 as a safety-net
 *             in case `Frontend::init()` did not register its own priority-7 hook
 *             (edge-case: some caching/proxy setups skip template_redirect).
 */
final class Assets
{
    /**
     * Per-request cache (avoid duplicate DB/API calls within the same request).
     *
     * @var array<string,mixed>
     */
    private static array $cache = [];

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    public static function register(): void
    {
        if (!class_exists('\Elementor\Plugin')) {
            return;
        }

        // Primary: late priority so kit typography wins over theme base styles.
        add_action('wp_enqueue_scripts', [self::class, 'enqueue'], 100);

        // Safety-net: wp_enqueue_scripts sometimes fires before Yatra sets its
        // routing query-vars (especially with caching plugins). Re-run on wp_head
        // priority 1 as a second chance; WP deduplicates enqueued handles.
        add_action('wp_head', [self::class, 'enqueue'], 1);

        // Safety-net for Google Fonts: in edge-cases where Frontend::init() did not
        // register its own print_fonts_links hook, call it ourselves at priority 9
        // (just after Elementor's priority 7). Calling it when fonts_to_enqueue is
        // already empty is a no-op, so this is always safe.
        add_action('wp_head', [self::class, 'printFonts'], 9);

        // Inject the active Elementor kit body-class.
        add_filter('body_class', [self::class, 'bodyClass'], 20, 1);
    }

    // -------------------------------------------------------------------------
    // Yatra page detection
    // -------------------------------------------------------------------------

    /**
     * Returns true when the current request is a Yatra-routed frontend page.
     *
     * Uses routing query-vars (available early, before TemplateLoader sets globals)
     * and falls back to REQUEST_URI path matching + late globals-based helpers.
     */
    private static function isYatraRoutedPage(): bool
    {
        // 1. WordPress query-var set by Yatra rewrite rules (pretty permalinks).
        if ((string) get_query_var('yatra_page') !== '') {
            return true;
        }

        // 2. Plain-permalink GET param fallback.
        $rawYatraPage = $_GET['yatra_page'] ?? '';
        if (is_string($rawYatraPage) && trim(wp_unslash($rawYatraPage)) !== '') {
            return true;
        }

        // 3. Individual taxonomy / special-page query-vars.
        foreach ([
            'yatra_booking_confirmation',
            'yatra_remaining_checkout',
            'yatra_verify_email',
            'yatra_login_page',
            'yatra_destination_slug',
            'yatra_activity_slug',
            'yatra_category_slug',
        ] as $qv) {
            $v = get_query_var($qv);
            if (is_string($v) && trim($v) !== '') {
                return true;
            }
        }

        // 4. Dynamic single-trip query-var (key = trip base, e.g. "trip" or "tours").
        if (class_exists('\Yatra\Services\SettingsService')) {
            $tripBase = preg_replace(
                '/[^a-zA-Z0-9_-]/',
                '',
                (string) \Yatra\Services\SettingsService::getTripBase()
            ) ?: 'trip';

            if (trim((string) get_query_var($tripBase)) !== '') {
                return true;
            }

            // Plain-permalink version: ?{tripBase}=slug
            $rawTrip = $_GET[$tripBase] ?? '';
            if (is_string($rawTrip) && trim(wp_unslash($rawTrip)) !== '') {
                return true;
            }

            // 5. Last resort: match REQUEST_URI path against Yatra URL bases.
            //    Handles edge-cases where caching/proxies strip query-vars.
            $requestUri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '';
            $path = $requestUri !== ''
                ? trim((string) wp_parse_url($requestUri, PHP_URL_PATH), '/')
                : '';

            if ($path !== '') {
                $bases = [
                    $tripBase,
                    preg_replace('/[^a-zA-Z0-9_-]/', '', (string) \Yatra\Services\SettingsService::getString('destination_base', 'destination')),
                    preg_replace('/[^a-zA-Z0-9_-]/', '', (string) \Yatra\Services\SettingsService::getString('activity_base', 'activity')),
                    preg_replace('/[^a-zA-Z0-9_-]/', '', (string) \Yatra\Services\SettingsService::getString('trip_category_base', 'trip-category')),
                    preg_replace('/[^a-zA-Z0-9_-]/', '', (string) \Yatra\Services\SettingsService::getBookingBase()),
                    preg_replace('/[^a-zA-Z0-9_-]/', '', (string) \Yatra\Services\SettingsService::getAccountBase()),
                ];
                foreach (array_filter($bases) as $base) {
                    if ($path === $base || str_starts_with($path, $base . '/')) {
                        return true;
                    }
                }
            }
        }

        // 6. Fallback: globals-based helpers (available after TemplateLoader runs).
        if (function_exists('yatra_is_yatra_page')) {
            return yatra_is_yatra_page()
                || (function_exists('yatra_is_booking_page') && yatra_is_booking_page())
                || (function_exists('yatra_is_trip_listing') && yatra_is_trip_listing())
                || (function_exists('yatra_is_single_trip') && yatra_is_single_trip());
        }

        return false;
    }

    // -------------------------------------------------------------------------
    // Asset enqueue
    // -------------------------------------------------------------------------

    public static function enqueue(): void
    {
        if (!self::isYatraRoutedPage()) {
            return;
        }

        // Guard: only run once per request.
        if (!empty(self::$cache['enqueue_done'])) {
            return;
        }
        self::$cache['enqueue_done'] = true;

        try {
            $plugin = \Elementor\Plugin::$instance;

            // -- Core Elementor frontend handles -----------------------------------
            if ($plugin && isset($plugin->frontend)) {
                if (method_exists($plugin->frontend, 'enqueue_styles')) {
                    $plugin->frontend->enqueue_styles();
                }
                if (method_exists($plugin->frontend, 'enqueue_scripts')) {
                    $plugin->frontend->enqueue_scripts();
                }
            }

            // Explicit handles some themes depend on directly.
            foreach ([
                'elementor-frontend',
                'elementor-icons',
                'elementor-animations',
                'elementor-frontend-google-fonts',
            ] as $handle) {
                if (wp_style_is($handle, 'registered') || wp_style_is($handle, 'queued')) {
                    wp_enqueue_style($handle);
                }
            }

            // -- Active Kit (Site Settings) CSS ------------------------------------
            // The kit CSS defines all CSS custom properties (colors, typography variables)
            // that the header/footer templates inherit.
            self::enqueuePostCss($plugin, (int) self::getKitId($plugin));

            // -- Theme Builder Header / Footer template CSS ------------------------
            if (class_exists('\ElementorPro\Plugin')) {
                self::enqueueThemeBuilderTemplates($plugin);

                // Pro frontend styles & fonts.
                foreach ([
                    'elementor-pro',
                    'elementor-pro-frontend',
                    'elementor-pro-frontend-google-fonts',
                ] as $handle) {
                    if (wp_style_is($handle, 'registered') || wp_style_is($handle, 'queued')) {
                        wp_enqueue_style($handle);
                    }
                }

                $pro = \ElementorPro\Plugin::instance();
                if ($pro && method_exists($pro, 'get_frontend')) {
                    $fe = $pro->get_frontend();
                    if ($fe) {
                        if (method_exists($fe, 'enqueue_styles')) {
                            $fe->enqueue_styles();
                        }
                        if (method_exists($fe, 'enqueue_scripts')) {
                            $fe->enqueue_scripts();
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // Never break frontend rendering due to optional integration.
        }
    }

    // -------------------------------------------------------------------------
    // Google Fonts safety-net
    // -------------------------------------------------------------------------

    /**
     * Explicitly flush `$frontend->fonts_to_enqueue` → Google Fonts <link> tags.
     *
     * Elementor normally does this on wp_head priority 7 inside Frontend::init().
     * init() is hooked to template_redirect, which fires on all pages, so under
     * normal circumstances this is a no-op (fonts_to_enqueue is already empty).
     * It protects against edge-cases where template_redirect was skipped (e.g.
     * via a caching layer) and init() was therefore never called.
     */
    public static function printFonts(): void
    {
        if (!self::isYatraRoutedPage()) {
            return;
        }

        try {
            $frontend = \Elementor\Plugin::$instance->frontend ?? null;
            if ($frontend && method_exists($frontend, 'print_fonts_links')) {
                $frontend->print_fonts_links();
            }
        } catch (\Throwable $e) {
            // Silently skip.
        }
    }

    // -------------------------------------------------------------------------
    // Body class
    // -------------------------------------------------------------------------

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
            $kitId = (int) self::getKitId(\Elementor\Plugin::$instance);
            if ($kitId > 0) {
                $kitClass = 'elementor-kit-' . $kitId;
                if (!in_array($kitClass, $classes, true)) {
                    $classes[] = $kitClass;
                }
            }
        } catch (\Throwable $e) {
            // Silently skip.
        }

        return $classes;
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Return the active Elementor kit ID (cached per request).
     */
    private static function getKitId(object $plugin): int
    {
        if (isset(self::$cache['kit_id'])) {
            return (int) self::$cache['kit_id'];
        }

        $kitId = 0;
        $kits  = $plugin->kits_manager ?? null;
        if ($kits && method_exists($kits, 'get_active_id')) {
            $kitId = (int) $kits->get_active_id();
        }

        self::$cache['kit_id'] = $kitId;

        return $kitId;
    }

    /**
     * Enqueue an Elementor post CSS file.
     *
     * Uses Elementor's internal `Post::create($id)->enqueue()` API which:
     *   a) Enqueues the pre-generated `post-{id}.css` file (or inlines it).
     *   b) Calls `$frontend->enqueue_font($font)` for every font stored in the
     *      post's CSS meta, populating `$frontend->fonts_to_enqueue` so that
     *      Elementor's `print_fonts_links()` (wp_head priority 7) can output
     *      the correct Google Fonts <link> tags.
     *
     * Falls back to directly linking the file from uploads if the internal API
     * doesn't produce a registered handle (belt-and-suspenders for caching setups).
     *
     * IMPORTANT: Do NOT call `\Elementor\Core\Files\CSS\Post::enqueue($id)` —
     * `enqueue()` is an INSTANCE method; calling it statically is a PHP error
     * that is silently swallowed and leaves fonts_to_enqueue unpopulated.
     */
    private static function enqueuePostCss(object $plugin, int $postId): void
    {
        if ($postId <= 0) {
            return;
        }

        // Ask Elementor to enqueue via its internal system.
        // Post::create() uses the files_manager for per-request caching.
        if (class_exists('\Elementor\Core\Files\CSS\Post')) {
            try {
                /** @var \Elementor\Core\Files\CSS\Post $cssFile */
                $cssFile = \Elementor\Core\Files\CSS\Post::create($postId);
                if ($cssFile && method_exists($cssFile, 'enqueue')) {
                    $cssFile->enqueue();
                }
            } catch (\Throwable $e) {
                // Continue to fallback.
            }
        }

        // Ensure Elementor's own registered handle is queued (in case create()
        // registered but did not enqueue it for some reason).
        $handle = 'elementor-post-' . $postId;
        if (wp_style_is($handle, 'registered') || wp_style_is($handle, 'queued')) {
            wp_enqueue_style($handle);
        }

        // Absolute fallback: link the generated CSS file from uploads directly.
        // This fires even when Elementor's internal enqueue silently does nothing
        // (e.g. the document has no Elementor data flag set). It does NOT populate
        // fonts_to_enqueue — that path relies on the Post::create() call above.
        $upload = wp_upload_dir();
        if (is_array($upload) && !empty($upload['basedir']) && !empty($upload['baseurl'])) {
            $dir  = rtrim((string) $upload['basedir'], '/\\') . '/elementor/css/';
            $url  = rtrim((string) $upload['baseurl'], '/\\') . '/elementor/css/';
            $file = $dir . 'post-' . $postId . '.css';
            if (file_exists($file)) {
                wp_enqueue_style(
                    'yatra-elementor-post-' . $postId,
                    $url . 'post-' . $postId . '.css',
                    [],
                    (string) @filemtime($file)
                );
            }
        }
    }

    /**
     * Enqueue CSS for all active Elementor Pro Theme Builder header/footer templates.
     * Prefers the Theme Builder conditions API; falls back to a DB query.
     */
    private static function enqueueThemeBuilderTemplates(object $plugin): void
    {
        if (!class_exists('\ElementorPro\Modules\ThemeBuilder\Module')) {
            return;
        }

        foreach (['header', 'footer'] as $location) {
            $ids = self::getThemeBuilderTemplateIds($location);
            foreach ($ids as $id) {
                self::enqueuePostCss($plugin, $id);
            }
        }
    }

    /**
     * Resolve template IDs for a Theme Builder location (cached per request).
     *
     * @return int[]
     */
    private static function getThemeBuilderTemplateIds(string $location): array
    {
        $cacheKey = 'tb_ids_' . $location;
        if (isset(self::$cache[$cacheKey])) {
            return (array) self::$cache[$cacheKey];
        }

        $ids = [];

        // Preferred: Theme Builder conditions manager (only currently active templates).
        try {
            $tb = \ElementorPro\Modules\ThemeBuilder\Module::instance();
            if ($tb && method_exists($tb, 'get_conditions_manager')) {
                $cm = $tb->get_conditions_manager();
                if ($cm && method_exists($cm, 'get_documents_for_location')) {
                    foreach ((array) $cm->get_documents_for_location($location) as $doc) {
                        if (is_object($doc) && method_exists($doc, 'get_main_id')) {
                            $ids[] = (int) $doc->get_main_id();
                        } elseif (is_numeric($doc)) {
                            $ids[] = (int) $doc;
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            $ids = [];
        }

        // Fallback: query published Elementor library items for this template type.
        if (empty($ids)) {
            $rows = get_posts([
                'post_type'      => 'elementor_library',
                'post_status'    => 'publish',
                'fields'         => 'ids',
                'numberposts'    => -1,
                'no_found_rows'  => true,
                'meta_query'     => [[
                    'key'     => '_elementor_template_type',
                    'value'   => $location,
                    'compare' => '=',
                ]],
            ]);
            $ids = array_map('intval', (array) $rows);
        }

        $ids = array_values(array_filter(array_unique($ids)));
        self::$cache[$cacheKey] = $ids;

        return $ids;
    }
}
