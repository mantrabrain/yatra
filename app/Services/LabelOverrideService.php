<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Rename Yatra's customer-facing texts ("Book Now" → "Reserve", "Travelers" →
 * "Guests") without a translation plugin.
 *
 * Settings → Labels stores a list of {from, to}: `from` is Yatra's original
 * English text, exactly as in the code, `to` what customers see instead. It
 * applies on the site, in emails and in Yatra's front-end scripts — never on
 * admin screens, so the admin keeps the texts it is documented with. It works
 * on the original text, so it also works on a translated site (the override
 * wins over the translation).
 *
 * @since 3.2.0
 */
class LabelOverrideService
{
    public const MAX_ROWS = 200;
    public const MAX_LENGTH = 200;

    /** @var array<string, string>|null original => replacement */
    private static ?array $map = null;

    public static function init(): void
    {
        if (self::map() === []) {
            return;
        }
        if (is_admin() && !wp_doing_ajax()) {
            return;
        }
        foreach (self::domains() as $domain) {
            add_filter('gettext_' . $domain, [self::class, 'filterText'], 20, 2);
            add_filter('gettext_with_context_' . $domain, [self::class, 'filterTextWithContext'], 20, 3);
            add_filter('ngettext_' . $domain, [self::class, 'filterPlural'], 20, 4);
        }
        add_action('wp_enqueue_scripts', [self::class, 'addScriptFilter'], 20);
    }

    /**
     * Text domains whose customer-facing texts can be renamed: Yatra's and
     * Yatra Pro's (its cart buttons, for example).
     *
     * @return string[]
     */
    public static function domains(): array
    {
        $domains = (array) apply_filters('yatra_label_override_domains', ['yatra', 'yatra-pro']);

        return array_values(array_unique(array_filter(array_map('sanitize_key', $domains))));
    }

    /** @return array<string, string> */
    public static function map(): array
    {
        if (self::$map === null) {
            self::$map = [];
            foreach (self::rows() as $row) {
                self::$map[$row['from']] = $row['to'];
            }
        }

        return self::$map;
    }

    /** Forget the cached map (after saving, in tests). */
    public static function reset(): void
    {
        self::$map = null;
    }

    /** @return array<int, array{from:string, to:string}> */
    public static function rows(): array
    {
        $stored = SettingsService::get('label_overrides', []);
        if (is_string($stored)) {
            $stored = maybe_unserialize($stored);
        }

        return self::sanitizeRows(is_array($stored) ? $stored : []);
    }

    /**
     * @param mixed $rows
     * @return array<int, array{from:string, to:string}>
     */
    public static function sanitizeRows($rows): array
    {
        $out = [];
        $seen = [];
        foreach (is_array($rows) ? $rows : [] as $row) {
            if (!is_array($row)) {
                continue;
            }
            $from = trim(sanitize_text_field((string) ($row['from'] ?? '')));
            $to = trim(sanitize_text_field((string) ($row['to'] ?? '')));
            if ($from === '' || $to === '' || $from === $to || isset($seen[$from])) {
                continue;
            }
            $seen[$from] = true;
            $out[] = [
                'from' => self::cut($from),
                'to' => self::cut($to),
            ];
            if (count($out) >= self::MAX_ROWS) {
                break;
            }
        }

        return $out;
    }

    /**
     * @param string $translation
     * @param string $text
     */
    public static function filterText($translation, $text): string
    {
        $map = self::map();

        return isset($map[$text]) ? $map[$text] : (string) $translation;
    }

    /**
     * @param string $translation
     * @param string $text
     * @param string $context
     */
    public static function filterTextWithContext($translation, $text, $context): string
    {
        return self::filterText($translation, $text);
    }

    /**
     * @param string $translation
     * @param string $single
     * @param string $plural
     * @param int    $number
     */
    public static function filterPlural($translation, $single, $plural, $number): string
    {
        $map = self::map();
        $key = (int) $number === 1 ? $single : $plural;

        return isset($map[$key]) ? $map[$key] : (string) $translation;
    }

    /**
     * The same overrides for Yatra's scripts (booking card, checkout, account
     * page), which translate through wp.i18n.
     */
    public static function addScriptFilter(): void
    {
        $json = wp_json_encode(self::map(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE);
        if (!is_string($json)) {
            return;
        }
        $domains = wp_json_encode(self::domains());
        if (!is_string($domains)) {
            return;
        }
        $js = '(function(){if(!window.wp||!wp.hooks){return;}var m=' . $json . ',d=' . $domains . ';'
            . 'd.forEach(function(x){'
            . 'wp.hooks.addFilter("i18n.gettext_"+x,"yatra/label-overrides",function(t,s){return Object.prototype.hasOwnProperty.call(m,s)?m[s]:t;});'
            . 'wp.hooks.addFilter("i18n.gettext_with_context_"+x,"yatra/label-overrides",function(t,s){return Object.prototype.hasOwnProperty.call(m,s)?m[s]:t;});'
            . 'wp.hooks.addFilter("i18n.ngettext_"+x,"yatra/label-overrides",function(t,s,p,n){var k=n===1?s:p;return Object.prototype.hasOwnProperty.call(m,k)?m[k]:t;});});})();';
        wp_add_inline_script('wp-i18n', $js, 'after');
    }

    private static function cut(string $value): string
    {
        return function_exists('mb_substr') ? mb_substr($value, 0, self::MAX_LENGTH) : substr($value, 0, self::MAX_LENGTH);
    }
}
