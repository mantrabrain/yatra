<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * A block that wraps one of Yatra's existing shortcodes.
 *
 * The block maps its (typed) attributes onto the shortcode's string attributes
 * and calls the registered shortcode callback, so the output, the asset loading
 * in {@see \Yatra\Shortcodes\BaseShortcode::render()} and every filter the
 * shortcode applies stay exactly the same as [yatra_*] on a page.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
abstract class AbstractShortcodeBlock extends AbstractServerBlock
{
    /**
     * Shortcode tag to render (e.g. yatra_search).
     */
    abstract protected function shortcodeTag(): string;

    /**
     * Map block attributes to shortcode attributes. Omit a key to keep the
     * shortcode default.
     *
     * @param array<string, mixed> $attributes
     * @return array<string, string>
     */
    abstract protected function shortcodeAttributes(array $attributes): array;

    /**
     * @param array<string, mixed> $attributes
     */
    public function render(array $attributes): string
    {
        $this->ensureAssets();

        global $shortcode_tags;
        $tag = $this->shortcodeTag();
        if (! isset($shortcode_tags[$tag]) || ! is_callable($shortcode_tags[$tag])) {
            return '';
        }

        $output = call_user_func($shortcode_tags[$tag], $this->shortcodeAttributes($attributes), '', $tag);

        return '<div ' . $this->wrapperAttributes('yatra-block yatra-block--' . $this->slug()) . '>' . (string) $output . '</div>';
    }
}
