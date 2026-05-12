<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Core\Assets\BaseAssetManager;
use Yatra\Core\Routing\PageContext;

/**
 * Base Page Handler
 *
 * Provides common functionality for all page handlers
 */
abstract class BasePageHandler
{
    /**
     * Handle the page request
     *
     * @param array $route_data Route data from RouteMatcher
     * @return bool True if handled successfully
     */
    abstract public function handle(array $route_data): bool;

    /**
     * Set query vars for backward compatibility
     *
     * @param array $vars Query vars to set
     */
    protected function setQueryVars(array $vars): void
    {
        global $wp_query;

        foreach ($vars as $key => $value) {
            $wp_query->set($key, $value);
        }
    }

    /**
     * Set 404 status
     */
    protected function set404(): void
    {
        global $wp_query;

        $wp_query->set_404();
        status_header(404);
    }

    /**
     * Prevent 404 handling and set 200 status
     */
    protected function prevent404(): void
    {
        global $wp_query;

        $wp_query->is_404 = false;
        status_header(200);
    }

    /**
     * Configure $wp_query and globals so the current request looks like a real WP page to
     * the theme — required for FSE/block themes to resolve the correct block template
     * (singular/archive/index) instead of falling back to 404.html.
     *
     * @param string $context 'singular' for single-trip / booking-confirmation / account, 'archive' for listings.
     * @param array  $args {
     *     @type string      $title       Page title used in <title> and queried-object stub.
     *     @type int         $object_id   Optional ID for the virtual queried object (defaults to 0).
     *     @type string      $post_type   Post type for the faux WP_Post (default 'page').
     *     @type string      $post_name   Slug for the faux WP_Post.
     *     @type string|null $content     Optional post content placeholder.
     * }
     */
    protected function setupPageEnvironment(string $context = 'singular', array $args = []): void
    {
        global $wp_query, $post;

        $title = (string) ($args['title'] ?? '');
        $object_id = (int) ($args['object_id'] ?? 0);
        $post_type = (string) ($args['post_type'] ?? 'page');
        $post_name = (string) ($args['post_name'] ?? '');
        $content = (string) ($args['content'] ?? '');

        // Clear the conditional-tag state — WP_Query keeps stale flags from the main query.
        $wp_query->init_query_flags();
        $wp_query->is_404 = false;
        $wp_query->is_home = false;
        $wp_query->is_front_page = false;

        if ($context === 'archive') {
            $wp_query->is_archive = true;
            // Do NOT set is_post_type_archive — we are a virtual page, not a
            // real WP post-type archive. Setting it triggers WP code paths
            // (feed_links_extra, post_type_archive_title, …) that call
            // get_post_type_object() and crash on null when no CPT is set.
        } else {
            $wp_query->is_singular = true;
            $wp_query->is_page = ($post_type === 'page');
            $wp_query->is_single = ($post_type !== 'page');
        }

        // Build a virtual WP_Post so the_post(), get_the_ID(), body_class(), and FSE
        // block-template selection have something coherent to read.
        $virtual = new \WP_Post((object) [
            'ID' => $object_id,
            'post_author' => 0,
            'post_date' => current_time('mysql'),
            'post_date_gmt' => current_time('mysql', true),
            'post_content' => $content,
            'post_title' => $title,
            'post_excerpt' => '',
            'post_status' => 'publish',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
            'post_password' => '',
            'post_name' => $post_name,
            'to_ping' => '',
            'pinged' => '',
            'post_modified' => current_time('mysql'),
            'post_modified_gmt' => current_time('mysql', true),
            'post_content_filtered' => '',
            'post_parent' => 0,
            'guid' => home_url($post_name ? '/' . $post_name : '/'),
            'menu_order' => 0,
            'post_type' => $post_type,
            'post_mime_type' => '',
            'comment_count' => 0,
            'filter' => 'raw',
        ]);

        $wp_query->queried_object = $virtual;
        $wp_query->queried_object_id = $object_id;
        $wp_query->post = $virtual;
        $wp_query->posts = [$virtual];
        $wp_query->post_count = 1;
        $wp_query->found_posts = 1;
        $wp_query->max_num_pages = 1;
        $wp_query->current_post = -1;

        $post = $virtual;

        // ── Strip WP core hooks that don't make sense for virtual pages ─────────────
        //
        // Our queried-object ID is a Yatra trips-table row id, NOT a wp_posts row id.
        // Several WP core hooks call `get_post( get_queried_object_id() )` expecting a
        // real WP_Post — they receive null and crash with
        // "Attempt to read property 'post_type' on null".
        //
        // wp_shortlink_wp_head      → calls wp_get_shortlink('query') → get_post(id) → null
        // wp_shortlink_header       → same code path, called on template_redirect
        // adjacent_posts_rel_link_wp_head → walks $post->post_type for prev/next links
        //
        // None of these emit anything meaningful for a virtual Yatra page, so we strip
        // them at the start of the render. Re-checking they exist (rather than calling
        // remove_action blindly) keeps us forward-compatible if WP core retires a hook.
        if (function_exists('wp_shortlink_wp_head')) {
            remove_action('wp_head', 'wp_shortlink_wp_head', 10);
        }
        if (function_exists('wp_shortlink_header')) {
            remove_action('template_redirect', 'wp_shortlink_header', 11);
        }
        if (function_exists('adjacent_posts_rel_link_wp_head')) {
            remove_action('wp_head', 'adjacent_posts_rel_link_wp_head', 10);
        }

        // WP admin-bar "Edit Page" link — wp_admin_bar_edit_menu reads our virtual
        // $post->post_type ('page') and adds an Edit link pointing at
        // wp-admin/post.php?post=<our_virtual_id>&action=edit. That ID is a Yatra trip
        // row id, not a wp_posts row, so the link 404s (or worse, edits an unrelated
        // post that happens to share the ID). Yatra registers its own "Edit Trip"
        // admin-bar item via AdminBarProvider, which is the correct link for trips.
        if (function_exists('wp_admin_bar_edit_menu')) {
            remove_action('admin_bar_menu', 'wp_admin_bar_edit_menu', 80);
        }

        // Belt-and-braces: short-circuit `pre_get_shortlink` for THIS request so any
        // other plugin/theme code that calls `wp_get_shortlink( 0, 'query' )` directly
        // also bails out cleanly instead of feeding our virtual ID to `get_post()`.
        if (!has_filter('pre_get_shortlink', [self::class, 'suppressVirtualShortlink'])) {
            add_filter('pre_get_shortlink', [self::class, 'suppressVirtualShortlink'], 1);
        }

        status_header(200);
        nocache_headers();
    }

    /**
     * Returning an empty string from `pre_get_shortlink` short-circuits
     * {@see wp_get_shortlink()} BEFORE it calls `get_post()` on our virtual ID. Used
     * to silence "Attempt to read property 'post_type' on null" warnings on Yatra
     * trip / listing / account pages where the queried-object ID is a Yatra row id,
     * not a wp_posts row id.
     */
    public static function suppressVirtualShortlink($shortlink): string
    {
        return '';
    }

    /**
     * Set global variable
     *
     * @param string $name Variable name
     * @param mixed $value Variable value
     */
    protected function setGlobal(string $name, $value): void
    {
        $GLOBALS[$name] = $value;
    }

    /**
     * Log error message
     *
     * @param string $message Error message
     */
    protected function logError(string $message): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            }
    }

    /**
     * Hand off a Yatra template to the `template_include` filter and return
     * a routing result. Replaces the legacy `include + exit` pattern.
     *
     * The handler should call this as the last step in handle(). It does NOT
     * render the template — that happens later via WordPress's normal
     * template-loader pipeline, so wp_head/wp_footer fire, other plugins can
     * hook in, and child themes can override.
     *
     * @param string                $templateName Template filename relative to /templates/, with or without .php.
     * @param BaseAssetManager|null $assetManager Optional asset manager whose assets to enqueue.
     * @param string                $pageType     Logical page type for body_class hints + FSE template slug.
     * @return bool true if the template was queued, false if missing.
     */
    protected function selectTemplate(string $templateName, ?BaseAssetManager $assetManager = null, string $pageType = ''): bool
    {
        $name = ltrim($templateName, '/');
        if (substr($name, -4) !== '.php') {
            $name .= '.php';
        }

        $absolute = YATRA_PLUGIN_PATH . 'templates/' . $name;

        // Allow themes/child-themes to override via templates/yatra/<name>.
        $located = locate_template(['yatra/' . $name], false, false);
        if (is_string($located) && $located !== '') {
            $absolute = $located;
        }

        $absolute = (string) apply_filters('yatra_template_path', $absolute, $name, $pageType);

        if (!is_readable($absolute)) {
            $this->logError("Template not readable: {$absolute}");
            return false;
        }

        if ($assetManager !== null) {
            $assetManager->enqueueAssets();
        }

        $ctx = PageContext::instance();
        $ok = $ctx->select($absolute, $pageType);
        if ($ok && $pageType !== '') {
            $ctx->addBodyClass('yatra-page-' . sanitize_html_class($pageType));
        }
        return $ok;
    }

    /**
     * @deprecated Kept only for backwards-compat with handlers not yet migrated.
     *             New handlers should call selectTemplate() and return.
     *
     * @param string|null $message Optional exit message
     */
    protected function exit(?string $message = null): void
    {
        if ($message && defined('WP_DEBUG') && WP_DEBUG) {
            echo '<!-- ' . esc_html($message) . ' -->';
        }
        exit;
    }
}
