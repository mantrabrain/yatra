<?php

declare(strict_types=1);

namespace Yatra\Utils;

/**
 * Frontend brand color → CSS custom properties for Yatra trip/booking/listing UI.
 */
final class FrontendThemeCss
{
    public const DEFAULT_PRIMARY = '#3b82f6';

    /**
     * @param mixed $value
     */
    public static function sanitizePrimaryColor($value): string
    {
        if (!is_string($value)) {
            return self::DEFAULT_PRIMARY;
        }
        $s = trim($value);
        if ($s === '') {
            return self::DEFAULT_PRIMARY;
        }
        if ($s[0] !== '#') {
            $s = '#' . $s;
        }
        if (!preg_match('/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $s)) {
            return self::DEFAULT_PRIMARY;
        }
        if (strlen($s) === 4) {
            $s = '#' . $s[1] . $s[1] . $s[2] . $s[2] . $s[3] . $s[3];
        }

        return strtolower($s);
    }

    /**
     * Inline :root rules to override bundled defaults. Safe to print inside <style> / wp_add_inline_style.
     */
    public static function buildInlineRootCss(string $primaryHex): string
    {
        $primary = self::sanitizePrimaryColor($primaryHex);
        $dark = self::mix($primary, '#000000', 0.14);
        $darker = self::mix($primary, '#000000', 0.32);
        $light = self::mix($primary, '#ffffff', 0.28);
        $softBg = self::mix($primary, '#ffffff', 0.92);
        $darkModeSurface = self::mix($primary, '#000000', 0.72);
        $darkModeAccent = self::mix($primary, '#ffffff', 0.22);

        $primaryE = esc_attr($primary);
        $darkE = esc_attr($dark);
        $darkerE = esc_attr($darker);
        $lightE = esc_attr($light);
        $softE = esc_attr($softBg);
        $dmSurfE = esc_attr($darkModeSurface);
        $dmAccE = esc_attr($darkModeAccent);

        return ':root{'
            . '--yatra-primary:' . $primaryE . ';'
            . '--yatra-primary-dark:' . $darkE . ';'
            . '--yatra-primary-light:' . $lightE . ';'
            . '--yatra-primary-color:' . $primaryE . ';'
            . '--yatra-primary-light-soft:' . $softE . ';'
            . '--yatra-primary-color-dark:' . $dmAccE . ';'
            . '--yatra-primary-light-dark:' . $dmSurfE . ';'
            . '--yatra-primary-darker:' . $darkerE . ';'
            . '}';
    }

    /**
     * @return array{r:int,g:int,b:int}|null
     */
    private static function hexToRgb(string $hex): ?array
    {
        if (strlen($hex) !== 7 || $hex[0] !== '#') {
            return null;
        }
        $r = hexdec(substr($hex, 1, 2));
        $g = hexdec(substr($hex, 3, 2));
        $b = hexdec(substr($hex, 5, 2));

        return ['r' => $r, 'g' => $g, 'b' => $b];
    }

    private static function mix(string $fromHex, string $towardHex, float $ratio): string
    {
        $ratio = max(0.0, min(1.0, $ratio));
        $a = self::hexToRgb(self::sanitizePrimaryColor($fromHex));
        $b = self::hexToRgb(self::sanitizePrimaryColor($towardHex));
        if ($a === null || $b === null) {
            return self::DEFAULT_PRIMARY;
        }
        $r = (int) round($a['r'] * (1 - $ratio) + $b['r'] * $ratio);
        $g = (int) round($a['g'] * (1 - $ratio) + $b['g'] * $ratio);
        $bb = (int) round($a['b'] * (1 - $ratio) + $b['b'] * $ratio);

        return sprintf('#%02x%02x%02x', max(0, min(255, $r)), max(0, min(255, $g)), max(0, min(255, $bb)));
    }

    /**
     * Max content width from block theme (theme.json) or $content_width, for --yatra-container-max-width.
     *
     * @return non-falsy-string|null Safe CSS length (e.g. 1200px, 40rem) or null to keep bundled default.
     */
    public static function resolveThemeContainerMaxWidth(): ?string
    {
        $filtered = apply_filters('yatra_container_max_width', null);
        if (is_string($filtered)) {
            $t = trim($filtered);
            if ($t !== '' && self::isSafeCssLengthToken($t)) {
                if (preg_match('/^\d+$/', $t)) {
                    return (int) $t . 'px';
                }

                return $t;
            }
        }

        if (function_exists('wp_get_global_settings')) {
            $settings = wp_get_global_settings();
            $layout = is_array($settings['layout'] ?? null) ? $settings['layout'] : [];
            $wide = isset($layout['wideSize']) && is_string($layout['wideSize']) ? trim($layout['wideSize']) : '';
            if ($wide !== '' && self::isSafeCssLengthToken($wide)) {
                return $wide;
            }
            $content = isset($layout['contentSize']) && is_string($layout['contentSize']) ? trim($layout['contentSize']) : '';
            if ($content !== '' && self::isSafeCssLengthToken($content)) {
                return $content;
            }
        }

        global $content_width;
        if (is_int($content_width) || is_float($content_width)) {
            $w = (int) round((float) $content_width);
            if ($w > 0 && $w <= 3840) {
                return $w . 'px';
            }
        }
        if (is_string($content_width)) {
            $cw = trim($content_width);
            if ($cw !== '' && self::isSafeCssLengthToken($cw)) {
                return $cw;
            }
            if ($cw !== '' && ctype_digit($cw)) {
                $w = (int) $cw;
                if ($w > 0 && $w <= 3840) {
                    return $w . 'px';
                }
            }
        }

        return null;
    }

    /**
     * Sanitize Design → container max width (stored setting). Empty string = use theme / filter resolution.
     */
    public static function sanitizeContainerMaxWidthSetting($value): string
    {
        if (!is_string($value)) {
            return '';
        }
        $t = trim($value);
        if ($t === '') {
            return '';
        }
        if (preg_match('/^\d+$/', $t)) {
            $w = (int) $t;
            if ($w > 0 && $w <= 3840) {
                return $w . 'px';
            }

            return '';
        }
        if (self::isSafeCssLengthToken($t)) {
            return $t;
        }

        return '';
    }

    /**
     * @param non-falsy-string $value
     */
    private static function isSafeCssLengthToken(string $value): bool
    {
        if (strlen($value) > 96) {
            return false;
        }
        if (preg_match('/[<>{}\';\\\\]|\/\*/', $value)) {
            return false;
        }
        if (preg_match('/^\d+$/', $value)) {
            $w = (int) $value;

            return $w > 0 && $w <= 3840;
        }

        return (bool) preg_match(
            '/^(?:clamp\([^)]+\)|min\([^)]+\)|max\([^)]+\)|calc\([^)]+\)|[\d.]+\s*(?:px|rem|em|vw|vh|%))$/i',
            $value
        );
    }
}
