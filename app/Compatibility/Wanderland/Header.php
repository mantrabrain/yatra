<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Wanderland;

/**
 * Wanderland Theme Header Compatibility
 *
 * Solves two interrelated problems that occur on Yatra custom-routed pages:
 *
 * Problem 1 – Wrong page context at the `wp` hook:
 *   Yatra routes produce queried_object_id = 0 (no real WP page).
 *   Wanderland's wanderland_mikado_check_is_header_type_enabled() has a branch for
 *   page_id = 0 (PHP empty(0) = true) that looks up ALL per-page header-type meta
 *   values across the entire site.  If any page uses e.g. `header-bottom`, the check
 *   returns true even when the global setting is `header-standard`, causing the header
 *   action to be remapped to a hook Yatra templates never call.
 *
 * Problem 2 – Remapped action never fired by Yatra templates:
 *   Header types like `header-bottom`, `header-bottom-centered`, and
 *   `header-bottom-minimal` move `wanderland_mikado_get_header` from
 *   `wanderland_mikado_action_after_wrapper_inner` to
 *   `wanderland_mikado_action_before_main_content`.  Yatra's templates never call the
 *   latter, so the header simply disappears.
 *
 * Fixes:
 *   1. At `wp` priority 0, supply a real WordPress page ID as the queried object so
 *      Wanderland's header-type checks evaluate correctly (only against that specific
 *      page, not all pages on the site).
 *   2. Hook into `wanderland_mikado_action_after_wrapper_inner` and fire
 *      `wanderland_mikado_action_before_main_content` from there once per request,
 *      ensuring bottom-style headers still render inside `wanderland/header.php`.
 *
 * Safety guarantees:
 *   - Executes only when the Wanderland theme (or a child theme of it) is active, verified
 *     via get_template() === 'wanderland'.
 *   - Has zero interaction with Elementor compatibility (Elementor\Assets uses separate
 *     hooks: wp_enqueue_scripts, wp_head, body_class – none of which this class touches).
 *   - `maybeFireBeforeMainContent` is guarded by a per-request static flag so
 *     `wanderland_mikado_get_header` can never be rendered more than once per request,
 *     regardless of how many times the outer action fires.
 *
 * Registration timing note:
 *   Yatra's Compatibility loader calls register() at `plugins_loaded` priority 20.
 *   The Wanderland theme loads its functions.php AFTER `plugins_loaded`, so we must
 *   NOT gate registration on theme function existence here; the callbacks check
 *   isWanderlandActive() lazily when they actually fire (after `after_setup_theme`).
 */
final class Header
{
    /** Prevents register() from wiring hooks more than once. */
    private static bool $registered = false;

    /**
     * Prevents maybeFireBeforeMainContent from firing more than once per request.
     * This is the hard guard against double-header rendering.
     */
    private static bool $beforeMainContentFired = false;

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    /**
     * Register all compatibility hooks.
     * Called by Yatra\Compatibility\Compatibility at plugins_loaded priority 20.
     */
    public static function register(): void
    {
        if (self::$registered) {
            return;
        }

        self::$registered = true;

        /*
         * Priority 0: run before wanderland_mikado_set_header_object (priority 1)
         * AND before wanderland_mikado_include_header_types_after_load (priority 11).
         * Both read wanderland_mikado_get_page_id() → get_queried_object_id(), so we
         * must supply a valid queried object ID before they execute.
         */
        add_action('wp', [self::class, 'applyRequestContext'], 0);

        /*
         * Fires inside wanderland/header.php → do_action('wanderland_mikado_action_after_wrapper_inner').
         * Priority 5 runs BEFORE the default header hook (priority 10).  For bottom-style
         * header types that moved wanderland_mikado_get_header to
         * wanderland_mikado_action_before_main_content, we fire that action here so the
         * header renders inside the header.php template that Yatra's get_header() calls.
         * The static $beforeMainContentFired flag ensures this fires at most once.
         */
        add_action('wanderland_mikado_action_after_wrapper_inner', [self::class, 'maybeFireBeforeMainContent'], 5);
    }

    // -------------------------------------------------------------------------
    // Hook callbacks
    // -------------------------------------------------------------------------

    /**
     * Set a real WordPress page ID as the queried object on Yatra-routed requests.
     *
     * This prevents the page_id = 0 path in wanderland_mikado_check_is_header_type_enabled(),
     * which can incorrectly enable non-global header types (because PHP's empty(0) = true
     * triggers a fallback that checks ALL per-page meta across the whole site).
     *
     * Hooked: wp, priority 0
     */
    public static function applyRequestContext(): void
    {
        if (!self::isWanderlandActive()) {
            return;
        }

        if (!self::isYatraRoutedRequest()) {
            return;
        }

        $contextId = self::resolveContextPageId();
        if ($contextId <= 0) {
            return;
        }

        $contextPost = get_post($contextId);
        if (!($contextPost instanceof \WP_Post)) {
            return;
        }

        global $wp_query;
        if (!($wp_query instanceof \WP_Query)) {
            return;
        }

        // Clear any stale 404 state so wanderland_mikado_is_default_wp_template()
        // returns false (otherwise get_page_id() returns -1 which skips per-page meta
        // entirely and forces global-only resolution).
        $wp_query->is_404            = false;
        $wp_query->queried_object    = $contextPost;
        $wp_query->queried_object_id = $contextId;
    }

    /**
     * On Yatra pages, fire wanderland_mikado_action_before_main_content from inside
     * wanderland_mikado_action_after_wrapper_inner.
     *
     * Header types that remap the header hook (header-bottom, header-bottom-centered,
     * header-bottom-minimal) attach wanderland_mikado_get_header to
     * wanderland_mikado_action_before_main_content.  Yatra templates only call
     * get_header() → wanderland/header.php → wanderland_mikado_action_after_wrapper_inner,
     * never the before_main_content action.  This bridge ensures those header types
     * still render their output.
     *
     * The static flag guarantees this bridge fires at most once per request, so the
     * header is never duplicated even if the action fires more than once.
     *
     * Hooked: wanderland_mikado_action_after_wrapper_inner, priority 5
     */
    public static function maybeFireBeforeMainContent(): void
    {
        // Hard guard: fire at most once per request.
        if (self::$beforeMainContentFired) {
            return;
        }

        if (!self::isWanderlandActive()) {
            return;
        }

        if (!self::isYatraRoutedRequest()) {
            return;
        }

        self::$beforeMainContentFired = true;

        do_action('wanderland_mikado_action_before_main_content');
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Returns true when the Wanderland theme (or a child theme of it) is active.
     *
     * Uses get_template() which returns the PARENT theme slug even for child themes.
     * This is checked lazily (inside callbacks) so it works correctly regardless of
     * whether the theme was loaded before or after register() ran.
     */
    private static function isWanderlandActive(): bool
    {
        return get_template() === 'wanderland';
    }

    /**
     * Detect whether the current request is a Yatra-routed page.
     * Relies only on registered WP query vars, which are available from `wp` onwards.
     */
    private static function isYatraRoutedRequest(): bool
    {
        $yatraQueryVars = [
            'yatra_page',
            'yatra_booking_confirmation',
            'yatra_remaining_checkout',
            'yatra_verify_email',
            'yatra_login_page',
        ];

        foreach ($yatraQueryVars as $var) {
            if ((string) get_query_var($var, '') !== '') {
                return true;
            }
        }

        return false;
    }

    /**
     * Find the best WordPress page ID to use as the request context.
     *
     * The chosen page must NOT have a per-page header-type override so Wanderland
     * falls back to the global header option — which is what should apply to Yatra pages.
     *
     * Selection order (first non-zero result wins):
     *   1. Static front page (page_on_front) — present on most sites, rarely has a
     *      per-page header override.
     *   2. Posts page (page_for_posts).
     *   3. The first published WP page (by ID ascending) without mkdf_header_type_meta set.
     */
    private static function resolveContextPageId(): int
    {
        // 1. Static front page
        $id = (int) get_option('page_on_front', 0);
        if ($id > 0) {
            return $id;
        }

        // 2. Posts page
        $id = (int) get_option('page_for_posts', 0);
        if ($id > 0) {
            return $id;
        }

        // 3. Any published page without a per-page header override
        $pages = get_posts([
            'post_type'      => 'page',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'orderby'        => 'ID',
            'order'          => 'ASC',
            'meta_query'     => [
                [
                    'key'     => 'mkdf_header_type_meta',
                    'compare' => 'NOT EXISTS',
                ],
            ],
            'no_found_rows'  => true,
        ]);

        if (!empty($pages) && $pages[0] instanceof \WP_Post) {
            return $pages[0]->ID;
        }

        return 0;
    }
}
