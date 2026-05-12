<?php

declare(strict_types=1);

namespace Yatra\Core\Template;

use Yatra\Core\Routing\PageContext;

/**
 * FseTemplates
 *
 * Make Yatra pages first-class citizens in Full Site Editing:
 *
 *   - Registers virtual block templates (Single Trip, Trip Listing, Booking,
 *     etc.) so admins can find and edit them in Appearance → Editor → Templates.
 *
 *   - Registers a server-side `yatra/page-content` block that, when present in
 *     a block template, defers to the PHP template selected by Yatra's router.
 *     This lets an admin reorder/replace header/footer/sidebar around Yatra
 *     content using normal FSE tools.
 *
 *   - When an admin saves a customisation in the Site Editor, WordPress core
 *     stores it as a `wp_template` post with `source = 'custom'`. We detect
 *     that via `should_render_block_template()` and let WP render the block
 *     template instead of our PHP template — so user edits actually take
 *     effect, without us needing to maintain a separate FSE rendering path.
 *
 * The class is intentionally inert on classic (non-block) themes: every hook
 * short-circuits early via wp_is_block_theme() so there is zero cost when not
 * applicable.
 *
 * @package Yatra\Core\Template
 */
final class FseTemplates
{
    /**
     * Plugin slug used as the namespace for block templates we register.
     * WordPress stores customisations against `<theme>//<slug>` for theme
     * templates and `<plugin>//<slug>` for plugin templates.
     */
    public const NAMESPACE_SLUG = 'yatra';

    /**
     * True while a Yatra PHP template is being executed as the body of the
     * `yatra/page-content` server block (i.e. nested inside a block-template
     * canvas). yatra_get_header() / yatra_get_footer() consult this so they
     * don't re-emit <doctype>/<html>/<head>/<body>/header/footer chrome that
     * the canvas already owns.
     */
    private static bool $insideCanvas = false;

    public static function isRenderingInsideCanvas(): bool
    {
        return self::$insideCanvas;
    }

    /**
     * Map of virtual template slug → metadata.
     * Adding a new entry here exposes a new editable layout in the Site Editor.
     */
    private const TEMPLATES = [
        'yatra-single-trip' => [
            'title' => 'Yatra: Single Trip',
            'description' => 'Layout used for individual trip detail pages.',
            'page_type' => 'trip',
            'php_template' => 'single-trip',
            'is_singular' => true,
        ],
        'yatra-trip-listing' => [
            'title' => 'Yatra: Trip Listing',
            'description' => 'Layout used for the main trip archive.',
            'page_type' => 'listing-trip',
            'php_template' => 'listing-trip',
            'is_singular' => false,
        ],
        'yatra-destination' => [
            'title' => 'Yatra: Destination',
            'description' => 'Layout used for destination taxonomy pages.',
            'page_type' => 'taxonomy-destination',
            'php_template' => 'single-taxonomy',
            'is_singular' => false,
        ],
        'yatra-activity' => [
            'title' => 'Yatra: Activity',
            'description' => 'Layout used for activity taxonomy pages.',
            'page_type' => 'taxonomy-activity',
            'php_template' => 'single-taxonomy',
            'is_singular' => false,
        ],
        'yatra-booking' => [
            'title' => 'Yatra: Booking',
            'description' => 'Layout used for the booking flow page.',
            'page_type' => 'booking',
            'php_template' => 'booking',
            'is_singular' => true,
        ],
        'yatra-booking-confirmation' => [
            'title' => 'Yatra: Booking Confirmation',
            'description' => 'Layout used for the booking confirmation page.',
            'page_type' => 'booking-confirmation',
            'php_template' => 'booking-confirmation',
            'is_singular' => true,
        ],
        'yatra-account' => [
            'title' => 'Yatra: My Account',
            'description' => 'Layout used for the customer account dashboard.',
            'page_type' => 'account',
            'php_template' => 'account-page',
            'is_singular' => true,
        ],
    ];

    public static function init(): void
    {
        add_action('init', [self::class, 'registerBlock']);
        add_action('enqueue_block_editor_assets', [self::class, 'enqueueEditorAssets']);
        add_filter('get_block_templates', [self::class, 'injectVirtualTemplates'], 10, 3);
        add_filter('get_block_template', [self::class, 'resolveVirtualTemplate'], 10, 3);
    }

    /**
     * Enqueue the JS that registers `yatra/page-content` in the block editor.
     *
     * Without this, the editor's JS-side block registry doesn't know about the
     * block, the deserializer fails on `<!-- wp:yatra/page-content /-->` markup
     * inside saved templates, and the Site Editor shows the "Your site doesn't
     * include support for the X block" warning.
     */
    public static function enqueueEditorAssets(): void
    {
        $handle = 'yatra-block-page-content';
        $relPath = 'assets/js/blocks/page-content.js';
        $absPath = YATRA_PLUGIN_PATH . $relPath;
        if (!is_readable($absPath)) {
            return;
        }
        wp_enqueue_script(
            $handle,
            YATRA_PLUGIN_URL . $relPath,
            ['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-i18n'],
            (string) filemtime($absPath),
            true
        );
        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations($handle, 'yatra');
        }
    }

    /**
     * Server-side render: emit the Yatra PHP template inline.
     *
     * The template path comes from PageContext (set by the router) when
     * available; otherwise the block's `template` attribute is used as a
     * fallback so the block can be previewed in the editor with explicit
     * configuration.
     *
     * Output buffering captures the included template safely even if it
     * echoes directly.
     *
     * @param array $attributes Block attributes (supports 'template').
     * @return string Rendered HTML.
     */
    public static function renderPageContentBlock(array $attributes): string
    {
        $ctx = PageContext::instance();
        $path = $ctx->getTemplate();

        if (($path === null || $path === '') && !empty($attributes['template'])) {
            $name = ltrim((string) $attributes['template'], '/');
            if (substr($name, -4) !== '.php') {
                $name .= '.php';
            }
            $candidate = YATRA_PLUGIN_PATH . 'templates/' . $name;
            if (is_readable($candidate)) {
                $path = $candidate;
            }
        }

        if ($path === null || $path === '' || !is_readable($path)) {
            return '';
        }

        // Mark "inside canvas" for the duration of the include so that
        // yatra_get_header() / yatra_get_footer() inside the template don't
        // re-emit document chrome. try/finally guarantees the flag is reset
        // even if the template throws.
        $previous = self::$insideCanvas;
        self::$insideCanvas = true;
        ob_start();
        try {
            include $path;
        } finally {
            self::$insideCanvas = $previous;
        }
        return (string) ob_get_clean();
    }

    /**
     * Register the dynamic block. Safe to call on every request — register_block_type
     * is idempotent against re-registration of the same name (it returns false).
     */
    public static function registerBlock(): void
    {
        if (!function_exists('register_block_type')) {
            return;
        }
        if (\WP_Block_Type_Registry::get_instance()->is_registered('yatra/page-content')) {
            return;
        }
        register_block_type('yatra/page-content', [
            'api_version' => 2,
            'title' => 'Yatra Page Content',
            'description' => 'Renders the current Yatra page (single trip, listing, booking, etc.) inside a block template.',
            'category' => 'theme',
            'supports' => [
                'html' => false,
                'reusable' => false,
            ],
            'attributes' => [
                'template' => [
                    'type' => 'string',
                    'default' => '',
                ],
            ],
            'render_callback' => [self::class, 'renderPageContentBlock'],
        ]);
    }

    /**
     * Inject virtual templates into the Site Editor's template list.
     * Skipped for classic themes — they don't use block templates.
     *
     * @param \WP_Block_Template[] $query_result
     * @param array                $query
     * @param string               $template_type 'wp_template' or 'wp_template_part'.
     * @return \WP_Block_Template[]
     */
    public static function injectVirtualTemplates(array $query_result, array $query, string $template_type): array
    {
        if ($template_type !== 'wp_template' || !function_exists('wp_is_block_theme') || !wp_is_block_theme()) {
            return $query_result;
        }

        $existing = [];
        foreach ($query_result as $tpl) {
            if (isset($tpl->slug)) {
                $existing[$tpl->slug] = true;
            }
        }

        foreach (self::TEMPLATES as $slug => $meta) {
            if (isset($existing[$slug])) {
                continue; // User has already customised this template.
            }
            // Respect query filters (slug__in, post_type, etc.) the editor passes.
            if (!empty($query['slug__in']) && !in_array($slug, (array) $query['slug__in'], true)) {
                continue;
            }
            $query_result[] = self::buildVirtualTemplate($slug, $meta);
        }

        return $query_result;
    }

    /**
     * Resolve a single template by id (`<namespace>//<slug>`) — used when an
     * admin opens a Yatra template directly in the Site Editor.
     *
     * @param \WP_Block_Template|null $template
     * @param string                  $id
     * @param string                  $template_type
     * @return \WP_Block_Template|null
     */
    public static function resolveVirtualTemplate($template, string $id, string $template_type)
    {
        if ($template !== null || $template_type !== 'wp_template') {
            return $template;
        }
        if (!function_exists('wp_is_block_theme') || !wp_is_block_theme()) {
            return $template;
        }

        // id format: "<namespace>//<slug>"
        $parts = explode('//', $id, 2);
        if (count($parts) !== 2) {
            return $template;
        }
        [$ns, $slug] = $parts;
        if ($ns !== self::NAMESPACE_SLUG) {
            return $template;
        }
        if (!isset(self::TEMPLATES[$slug])) {
            return $template;
        }
        return self::buildVirtualTemplate($slug, self::TEMPLATES[$slug]);
    }

    /**
     * If the admin has saved a Site Editor customisation for the given Yatra
     * page type, prime the block-template canvas globals with that customised
     * content and return the absolute path to template-canvas.php so the
     * caller can return it from the `template_include` filter.
     *
     * Implementation note: we deliberately avoid get_block_templates() here.
     * Core silently restricts that query to wp_theme = get_stylesheet(), but
     * plugin-namespaced template customisations are saved under wp_theme =
     * '<plugin-namespace>' (e.g. 'yatra'), so the core query misses them. We
     * query the wp_template post type directly and accept matches against the
     * plugin namespace OR the active theme — whichever Gutenberg ended up
     * using when the admin saved their customisation.
     *
     * Returns null when:
     *   - not on a block theme
     *   - this page type has no virtual template
     *   - no `wp_template` post exists for the slug under either namespace
     */
    public static function loadCustomisedCanvas(string $pageType): ?string
    {
        if (!function_exists('wp_is_block_theme') || !wp_is_block_theme()) {
            return null;
        }
        $slug = self::slugForPageType($pageType);
        if ($slug === null) {
            return null;
        }

        $post = self::findCustomisedTemplatePost($slug);
        if ($post === null) {
            return null;
        }

        $content = (string) $post->post_content;
        if ($content === '') {
            return null;
        }

        // template-canvas.php reads these two globals and renders the blocks.
        global $_wp_current_template_content, $_wp_current_template_id;
        $_wp_current_template_id = self::NAMESPACE_SLUG . '//' . $slug;
        $_wp_current_template_content = $content;

        $canvas = ABSPATH . WPINC . '/template-canvas.php';
        return is_readable($canvas) ? $canvas : null;
    }

    /**
     * Find a saved wp_template customisation for the given slug.
     *
     * Looks for a published `wp_template` post with matching post_name whose
     * wp_theme term is either the plugin namespace ('yatra') or the active
     * theme. The plugin namespace is checked first because that's where
     * Gutenberg saves customisations of plugin-registered templates; the
     * stylesheet fallback handles WP versions/configurations that map the
     * customisation onto the active theme instead.
     */
    private static function findCustomisedTemplatePost(string $slug): ?\WP_Post
    {
        $namespaces = [self::NAMESPACE_SLUG];
        if (function_exists('get_stylesheet')) {
            $stylesheet = (string) get_stylesheet();
            if ($stylesheet !== '' && $stylesheet !== self::NAMESPACE_SLUG) {
                $namespaces[] = $stylesheet;
            }
        }

        $query = new \WP_Query([
            'post_type' => 'wp_template',
            'name' => $slug,
            'post_status' => ['publish', 'auto-draft'],
            'posts_per_page' => -1,
            'no_found_rows' => true,
            'ignore_sticky_posts' => true,
            'suppress_filters' => true,
            'tax_query' => [
                [
                    'taxonomy' => 'wp_theme',
                    'field' => 'name',
                    'terms' => $namespaces,
                ],
            ],
        ]);

        if (empty($query->posts)) {
            return null;
        }

        // If multiple matches, prefer one whose wp_theme term equals the
        // plugin namespace (most precise) — that's where Gutenberg saves
        // plugin-registered template customisations.
        $preferred = null;
        foreach ($query->posts as $post) {
            $terms = wp_get_post_terms($post->ID, 'wp_theme', ['fields' => 'names']);
            if (is_wp_error($terms)) {
                continue;
            }
            if (in_array(self::NAMESPACE_SLUG, $terms, true)) {
                return $post;
            }
            if ($preferred === null) {
                $preferred = $post;
            }
        }

        return $preferred;
    }

    /**
     * @internal Public so TemplateLoader can map page-type → slug for logging.
     */
    public static function slugForPageType(string $pageType): ?string
    {
        foreach (self::TEMPLATES as $slug => $meta) {
            if (($meta['page_type'] ?? '') === $pageType) {
                return $slug;
            }
        }
        return null;
    }

    /**
     * Build a WP_Block_Template object that wraps the theme's header/footer
     * template parts around the `yatra/page-content` server-side block.
     *
     * @param string $slug
     * @param array  $meta
     */
    private static function buildVirtualTemplate(string $slug, array $meta): \WP_Block_Template
    {
        $tpl = new \WP_Block_Template();
        $tpl->type = 'wp_template';
        $tpl->theme = self::NAMESPACE_SLUG;
        $tpl->slug = $slug;
        $tpl->id = self::NAMESPACE_SLUG . '//' . $slug;
        $tpl->title = $meta['title'];
        $tpl->description = $meta['description'];
        $tpl->source = 'plugin';
        $tpl->origin = 'plugin';
        $tpl->status = 'publish';
        $tpl->has_theme_file = false;
        $tpl->is_custom = false;
        $tpl->author = null;
        $tpl->content = self::defaultBlockTemplateMarkup($meta);

        return $tpl;
    }

    /**
     * Default block-template body: header part → page-content → footer part.
     * Authors can rearrange in the editor; their version supersedes this.
     */
    private static function defaultBlockTemplateMarkup(array $meta): string
    {
        $phpTemplate = (string) ($meta['php_template'] ?? '');
        $alignment = !empty($meta['is_singular']) ? 'full' : 'wide';

        return implode("\n", [
            '<!-- wp:template-part {"slug":"header","theme":"' . esc_attr(get_stylesheet()) . '","tagName":"header"} /-->',
            '',
            '<!-- wp:group {"tagName":"main","align":"' . esc_attr($alignment) . '","layout":{"type":"constrained"}} -->',
            '<main class="wp-block-group align' . esc_attr($alignment) . ' yatra-page-content-wrap">',
            '<!-- wp:yatra/page-content {"template":"' . esc_attr($phpTemplate) . '"} /-->',
            '</main>',
            '<!-- /wp:group -->',
            '',
            '<!-- wp:template-part {"slug":"footer","theme":"' . esc_attr(get_stylesheet()) . '","tagName":"footer"} /-->',
        ]);
    }
}
