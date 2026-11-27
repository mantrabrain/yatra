<?php

declare(strict_types=1);

namespace Yatra\Multilingual;

/**
 * One place that talks to the site's multilingual plugin (WPML or Polylang).
 *
 * Yatra keeps trips in its own tables, not as posts, so the multilingual
 * plugins can't translate them the way they translate posts. Yatra registers
 * the visible texts (trip text, FAQs, itinerary, terms) as strings with the
 * plugin's string translation, and shows the translation for the visitor's
 * language. Everything here is a no-op when neither plugin is active.
 *
 * String names: "{hint} [{md5 of the text, 10 chars}]" — stable while the text
 * is unchanged, shared by identical texts (as Polylang already does), and
 * unaffected by reordering FAQs or itinerary entries.
 */
final class Multilingual
{
    public const CONTEXT = 'Yatra';

    /** @var array<int, array{provider:string, lang:string, locale:bool}> */
    private static array $stack = [];

    public static function provider(): string
    {
        if (function_exists('pll_current_language') && function_exists('PLL')) {
            return 'polylang';
        }
        if (defined('ICL_SITEPRESS_VERSION') && has_filter('wpml_current_language')) {
            return 'wpml';
        }

        return '';
    }

    public static function isActive(): bool
    {
        return self::provider() !== '';
    }

    public static function currentLanguage(): string
    {
        switch (self::provider()) {
            case 'polylang':
                $lang = pll_current_language('slug');
                return is_string($lang) ? $lang : '';
            case 'wpml':
                $lang = apply_filters('wpml_current_language', null);
                return is_string($lang) && $lang !== 'all' ? $lang : '';
        }

        return '';
    }

    public static function defaultLanguage(): string
    {
        switch (self::provider()) {
            case 'polylang':
                $lang = function_exists('pll_default_language') ? pll_default_language('slug') : '';
                return is_string($lang) ? $lang : '';
            case 'wpml':
                $lang = apply_filters('wpml_default_language', null);
                return is_string($lang) ? $lang : '';
        }

        return '';
    }

    /** @return string[] Language slugs. */
    public static function languages(): array
    {
        switch (self::provider()) {
            case 'polylang':
                return function_exists('pll_languages_list') ? array_values(array_filter((array) pll_languages_list(['fields' => 'slug']), 'is_string')) : [];
            case 'wpml':
                $langs = apply_filters('wpml_active_languages', null, ['skip_missing' => 0]);
                return is_array($langs) ? array_map('strval', array_keys($langs)) : [];
        }

        return [];
    }

    public static function localeOf(string $lang): string
    {
        if ($lang === '') {
            return '';
        }
        switch (self::provider()) {
            case 'polylang':
                $language = PLL()->model->get_language($lang);
                return $language ? (string) $language->locale : '';
            case 'wpml':
                $langs = apply_filters('wpml_active_languages', null, ['skip_missing' => 0]);
                return is_array($langs) && isset($langs[$lang]['default_locale']) ? (string) $langs[$lang]['default_locale'] : '';
        }

        return '';
    }

    /**
     * Is a language other than the default shown right now? Only then is
     * anything translated. Never on admin screens (unless an email is being
     * rendered in the customer's language): the editor must always load and
     * save the original text, whatever Polylang's admin language filter says.
     */
    public static function isTranslating(): bool
    {
        if (empty($GLOBALS['yatra_ml_switched']) && self::isAdminContext()) {
            return false;
        }
        $current = self::currentLanguage();

        return $current !== '' && $current !== self::defaultLanguage();
    }

    /**
     * The language of the visitor's page ('' on admin screens and in cron,
     * where the current language is the admin's filter or the default, not
     * a customer's).
     */
    public static function visitorLanguage(): string
    {
        if (self::isAdminContext() || wp_doing_cron() || (defined('WP_CLI') && WP_CLI)) {
            return '';
        }

        return self::currentLanguage();
    }

    /** An admin screen, or a REST call made from one (the React admin). */
    private static function isAdminContext(): bool
    {
        if (is_admin() && !wp_doing_ajax()) {
            return true;
        }
        if (defined('REST_REQUEST') && REST_REQUEST) {
            // Sent by Yatra's admin app; the Referer is the fallback (older
            // admin bundles, other admin callers).
            if (isset($_SERVER['HTTP_X_YATRA_CONTEXT']) && $_SERVER['HTTP_X_YATRA_CONTEXT'] === 'admin') {
                return true;
            }
            $referer = (string) wp_get_raw_referer();

            return $referer !== '' && strpos($referer, '/wp-admin/') !== false;
        }

        return false;
    }

    /** A destination / activity / category / difficulty name or description in the visitor's language. */
    public static function translateTerm(string $value): string
    {
        return self::translate($value, TripStrings::termHint(''));
    }

    public static function stringName(string $hint, string $value): string
    {
        return trim($hint) . ' [' . substr(md5($value), 0, 10) . ']';
    }

    /**
     * The visitor-language translation of a text Yatra registered, or the
     * text itself.
     */
    public static function translate(string $value, string $hint): string
    {
        if ($value === '' || !self::isTranslating()) {
            return $value;
        }

        $lang = self::currentLanguage();
        switch (self::provider()) {
            case 'polylang':
                $translated = function_exists('pll_translate_string') ? pll_translate_string($value, $lang) : $value;
                break;
            case 'wpml':
                $translated = apply_filters('wpml_translate_single_string', $value, self::CONTEXT, self::stringName($hint, $value), $lang);
                break;
            default:
                $translated = $value;
        }

        return is_string($translated) && $translated !== '' ? $translated : $value;
    }

    /**
     * Make a text available for translation in the multilingual plugin.
     * Polylang lists strings registered during the current request (its
     * Strings screen); WPML stores them.
     */
    public static function register(string $value, string $hint, bool $multiline = false): void
    {
        if (trim($value) === '') {
            return;
        }
        switch (self::provider()) {
            case 'polylang':
                if (function_exists('pll_register_string')) {
                    pll_register_string(self::stringName($hint, $value), $value, self::CONTEXT, $multiline);
                }
                break;
            case 'wpml':
                // Source language: the texts are always the default-language originals.
                do_action('wpml_register_single_string', self::CONTEXT, self::stringName($hint, $value), $value, false, self::defaultLanguage());
                break;
        }
    }

    /**
     * Show the site in another language for a while (an email to a customer
     * who booked in German, sent from an English admin screen or a cron run).
     * Always pair with restore().
     */
    public static function switchTo(string $lang): void
    {
        $provider = self::provider();
        $previous = self::currentLanguage();
        $locale = self::localeOf($lang);
        $switchedLocale = false;

        // Locale first: WPML filters the locale by its current language, so
        // after switching the language WordPress would already report the
        // new locale and switch_to_locale() would do nothing. Also when the
        // language is already right but WordPress still runs in the site
        // locale (a REST request from a German page).
        if ($provider !== '' && $locale !== '' && $locale !== determine_locale() && function_exists('switch_to_locale')) {
            $switchedLocale = switch_to_locale($locale);
        }
        if ($provider !== '' && $lang !== '' && $lang !== $previous) {
            if ($provider === 'polylang') {
                $language = PLL()->model->get_language($lang);
                if ($language) {
                    self::setPolylangLanguage($language);
                }
            } else {
                do_action('wpml_switch_language', $lang);
            }
        }

        self::$stack[] = ['provider' => $provider, 'lang' => $previous, 'locale' => $switchedLocale];
        // Lets links built while switched (e.g. in an email sent from an
        // admin screen) carry the language too.
        $GLOBALS['yatra_ml_switched'] = count(self::$stack);
    }

    public static function restore(): void
    {
        $entry = array_pop(self::$stack);
        $GLOBALS['yatra_ml_switched'] = count(self::$stack);
        if ($entry === null) {
            return;
        }
        if (!empty($entry['locale']) && function_exists('restore_previous_locale')) {
            restore_previous_locale();
        }
        if ($entry['provider'] === 'polylang') {
            $language = $entry['lang'] !== '' ? PLL()->model->get_language($entry['lang']) : false;
            if ($language) {
                self::setPolylangLanguage($language);
            } else {
                PLL()->curlang = null;
            }
        } elseif ($entry['provider'] === 'wpml') {
            do_action('wpml_switch_language', $entry['lang'] !== '' ? $entry['lang'] : null);
        }
    }

    /**
     * On a front-end page Polylang has already defined the language; firing
     * pll_language_defined again would rebuild its link and canonical
     * filters (and their hooks) a second time. Setting the language is enough
     * there: strings are looked up per language and the locale is switched
     * separately. Elsewhere (REST, cron, admin) the action lets Polylang load
     * the language's string translations.
     *
     * @param object $language PLL_Language
     */
    private static function setPolylangLanguage($language): void
    {
        PLL()->curlang = $language;
        if (!(PLL() instanceof \PLL_Frontend)) {
            do_action('pll_language_defined', $language->slug, $language);
        }
    }

    /** The language a booking was made in ('' when unknown or not multilingual). */
    public static function bookingLanguage(int $bookingId): string
    {
        if ($bookingId <= 0 || !self::isActive()) {
            return '';
        }
        $repo = new \Yatra\Repositories\BookingRepository();
        $booking = $repo->find($bookingId);
        if (!$booking) {
            return '';
        }
        $meta = json_decode((string) ($booking->meta ?? ''), true);

        return is_array($meta) && isset($meta['language']) && is_string($meta['language']) ? $meta['language'] : '';
    }
}
