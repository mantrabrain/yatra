<?php

declare(strict_types=1);

namespace Yatra\Core\Routing;

/**
 * PageContext
 *
 * Per-request handoff between a page handler (which decides what to render and
 * configures $wp_query) and the `template_include` filter (which actually swaps
 * the theme template for a Yatra one).
 *
 * The previous design did `include $template; exit;` inside each handler. That
 * bypassed WordPress's normal template-loader pipeline, so SEO/cache plugins,
 * FSE template-hierarchy resolution, theme template-overrides, and downstream
 * `wp_footer` hooks couldn't participate. PageContext is the seam that lets the
 * handler decide, and lets WordPress drive.
 *
 * Lifecycle:
 *   1. Handler calls PageContext::instance()->select($absolute_template_path).
 *   2. Handler returns true (no include, no exit).
 *   3. TemplateLoader::filterTemplateInclude() reads from the context and
 *      returns the Yatra template path; WP includes it normally.
 *   4. PageContext is reset at the end of the request (PHP destruction).
 *
 * Stays a singleton on purpose: the WordPress request is itself a singleton,
 * and the `template_include` filter has no way to receive an instance, so a
 * static accessor is the pragmatic choice.
 */
final class PageContext
{
    private static ?PageContext $instance = null;

    private ?string $templatePath = null;
    private string $pageType = '';
    private array $bodyClasses = [];
    private array $data = [];
    private bool $handled = false;

    private function __construct() {}

    public static function instance(): PageContext
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Reset state — primarily for tests and edge cases (e.g. an internal redirect).
     */
    public static function reset(): void
    {
        self::$instance = null;
    }

    /**
     * Mark the current request as handled by Yatra and select the template to render.
     *
     * @param string $absolutePath Absolute path to a readable PHP template file.
     * @param string $pageType     Logical page type (e.g. 'trip', 'listing', 'account').
     *                             Used for body_class hints and FSE template name.
     * @return bool true on success, false if the path is invalid.
     */
    public function select(string $absolutePath, string $pageType = ''): bool
    {
        if ($absolutePath === '' || !is_readable($absolutePath)) {
            return false;
        }
        $this->templatePath = $absolutePath;
        $this->pageType = $pageType;
        $this->handled = true;
        return true;
    }

    public function hasTemplate(): bool
    {
        return $this->handled && $this->templatePath !== null;
    }

    public function getTemplate(): ?string
    {
        return $this->templatePath;
    }

    public function getPageType(): string
    {
        return $this->pageType;
    }

    public function isHandled(): bool
    {
        return $this->handled;
    }

    /**
     * Add one or more body classes that should appear on Yatra pages.
     *
     * @param string|string[] $class
     */
    public function addBodyClass($class): void
    {
        $classes = is_array($class) ? $class : [$class];
        foreach ($classes as $c) {
            $c = (string) $c;
            if ($c !== '' && !in_array($c, $this->bodyClasses, true)) {
                $this->bodyClasses[] = $c;
            }
        }
    }

    /**
     * @return string[]
     */
    public function getBodyClasses(): array
    {
        return $this->bodyClasses;
    }

    /**
     * Stash arbitrary handler-side data that the template_include filter or
     * downstream hooks might want to read. Avoid using this for data the
     * template itself needs — pass that through globals/query vars as today.
     *
     * @param mixed $value
     */
    public function set(string $key, $value): void
    {
        $this->data[$key] = $value;
    }

    /**
     * @return mixed
     */
    public function get(string $key, $default = null)
    {
        return array_key_exists($key, $this->data) ? $this->data[$key] : $default;
    }
}
