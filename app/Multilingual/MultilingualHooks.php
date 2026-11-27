<?php

declare(strict_types=1);

namespace Yatra\Multilingual;

/**
 * Wires Yatra into WPML / Polylang. Nothing is hooked when neither is active,
 * so single-language sites behave exactly as before.
 */
final class MultilingualHooks
{
    private const CACHE_OPTION = 'yatra_ml_trip_strings';

    public static function init(): void
    {
        // Providers load their APIs on plugins_loaded; decide once they have.
        if (did_action('plugins_loaded')) {
            self::boot();
        } else {
            add_action('plugins_loaded', [self::class, 'boot'], 20);
        }
    }

    public static function boot(): void
    {
        if (!Multilingual::isActive()) {
            return;
        }

        // /de/trip/everest-trek/ → trip/everest-trek for Yatra's router.
        add_filter('yatra_frontend_request_path', [self::class, 'stripLanguageFromPath'], 5);
        // Yatra's rewrite rules have no language prefix, so WordPress marks
        // /de/trip/… as not found before Yatra's router sees it.
        add_filter('yatra_clear_404_for_routing', [self::class, 'clear404ForLanguagePrefixedRoute']);

        // Links Yatra builds with home_url() keep the visitor's language
        // (Polylang only localises home_url() for whitelisted callers).
        add_filter('pll_home_url_white_list', [self::class, 'polylangWhiteList']);
        add_filter('home_url', [self::class, 'localizeYatraUrl'], 20, 2);

        // Yatra's front-end REST calls (availability, checkout) carry no
        // language; take it from the page that made the call.
        add_filter('rest_pre_dispatch', [self::class, 'restLanguageFromReferer'], 5, 3);

        // Remember the booking's language for emails sent later.
        // Inserted, not created: a booking waiting for e-mail verification
        // fires "created" only when the link is clicked, in another request.
        add_action('yatra_booking_inserted', [self::class, 'rememberBookingLanguage'], 1, 1);

        // Trip page in the visitor's language.
        add_filter('yatra_prepared_trip', [TripStrings::class, 'translate']);
        add_filter('yatra_booking_page_trip', [TripStrings::class, 'translate']);
        // Destination / activity / category page.
        add_filter('yatra_taxonomy_page_term', [self::class, 'translateTermObject']);
        // WPML keeps registered strings: after a trip or term is saved in
        // the admin, register again on the next admin screen.
        add_filter('rest_request_after_callbacks', [self::class, 'markStringsStale'], 10, 3);

        // Strings for the translation screens.
        // Collected once the whole save is done (the trip row is written
        // before its FAQs, terms, inclusions and itinerary).
        foreach (['yatra_trip_created', 'yatra_trip_updated', 'yatra_trip_created_with_relations', 'yatra_trip_updated_with_relations'] as $hook) {
            add_action($hook, [self::class, 'queueTripRefresh'], 20, 1);
        }
        foreach (['yatra_itinerary_day_created', 'yatra_itinerary_day_updated', 'yatra_itinerary_activity_created', 'yatra_itinerary_activity_updated'] as $hook) {
            add_action($hook, [self::class, 'queueItineraryTripRefresh'], 20, 2);
        }
        add_action('yatra_trip_deleted', [self::class, 'forgetTripStrings'], 20, 1);
        add_action('admin_init', [self::class, 'registerStringsForTranslationScreen']);
    }

    public static function stripLanguageFromPath($path)
    {
        $path = (string) $path;
        $first = strtok($path, '/');
        if ($first !== false && $first !== '' && in_array($first, Multilingual::languages(), true)) {
            return ltrim((string) substr($path, strlen($first)), '/');
        }

        return $path;
    }

    /** @param mixed $clear */
    public static function clear404ForLanguagePrefixedRoute($clear): bool
    {
        if ($clear) {
            return true;
        }
        $raw = isset($GLOBALS['wp']->request) ? trim((string) $GLOBALS['wp']->request, '/') : '';
        $first = (string) strtok($raw, '/');
        if ($first === '' || !in_array($first, Multilingual::languages(), true)) {
            return false;
        }
        $path = \Yatra\Core\Routing\UrlParser::getCleanRequestPath();

        return $path !== '' && \Yatra\Core\Routing\PrettyRouteMatcher::match($path) !== null;
    }

    /**
     * Put the language in links to Yatra pages (trip, listing, booking,
     * account, taxonomy) built with home_url('/trip/…'). The multilingual
     * plugins only localise the bare home URL, so these links dropped the
     * visitor back into the default language.
     *
     * @param mixed $url
     * @param mixed $path
     * @return mixed
     */
    public static function localizeYatraUrl($url, $path)
    {
        if (!is_string($url) || !is_string($path) || $path === '' || $path === '/') {
            return $url;
        }
        if (is_admin() && !wp_doing_ajax() && empty($GLOBALS['yatra_ml_switched'])) {
            return $url;
        }
        $lang = Multilingual::currentLanguage();
        if ($lang === '') {
            return $url;
        }

        // Not cached: the bases can be filtered or change during a request.
        // First segment only, so a base like "tours/nepal" still matches.
        $bases = \Yatra\Services\SettingsService::getPermalinkBases();
        $prefixes = array_values(array_unique(array_filter(array_map(static function ($b) {
            return (string) strtok(trim((string) $b, '/'), '/');
        }, [
            $bases['trip_base'] ?? '', $bases['booking_base'] ?? '', $bases['account_base'] ?? '',
            $bases['destination_base'] ?? '', $bases['activity_base'] ?? '', $bases['trip_category_base'] ?? '',
            $bases['legacy_booking_confirmation_prefix'] ?? '', $bases['remaining_checkout_prefix'] ?? '',
            $bases['email_verification_prefix'] ?? '',
        ]))));
        $first = (string) strtok(ltrim($path, '/'), '/?#');
        if (!in_array($first, $prefixes, true)) {
            return $url;
        }

        if (Multilingual::provider() === 'polylang') {
            $language = PLL()->model->get_language($lang);
            if (!$language || !isset(PLL()->links_model)) {
                return $url;
            }
            // Already localised (e.g. home_url() called twice through filters).
            $home = untrailingslashit((string) get_option('home'));
            if (strpos($url, $home . '/' . $lang . '/') === 0) {
                return $url;
            }

            return PLL()->links_model->add_language_to_link($url, $language);
        }

        $localized = apply_filters('wpml_permalink', $url, $lang);

        return is_string($localized) && $localized !== '' ? $localized : $url;
    }

    /**
     * @param array<int, array<string, string>> $list
     * @return array<int, array<string, string>>
     */
    public static function polylangWhiteList($list): array
    {
        $list = is_array($list) ? $list : [];
        if (defined('YATRA_PLUGIN_PATH')) {
            $list[] = ['file' => wp_normalize_path(YATRA_PLUGIN_PATH)];
            $list[] = ['file' => YATRA_PLUGIN_PATH];
        }
        if (defined('YATRA_PRO_ABSPATH')) {
            $list[] = ['file' => YATRA_PRO_ABSPATH];
        }

        return $list;
    }

    /**
     * @param mixed            $result
     * @param \WP_REST_Server  $server
     * @param \WP_REST_Request $request
     * @return mixed
     */
    public static function restLanguageFromReferer($result, $server, $request)
    {
        if (!$request instanceof \WP_REST_Request || strpos((string) $request->get_route(), '/yatra/') !== 0) {
            return $result;
        }
        if ($request->get_param('lang')) {
            return $result;
        }

        $referer = (string) ($request->get_header('referer') ?? wp_get_raw_referer());
        if ($referer === '' || strpos($referer, '/wp-admin/') !== false) {
            return $result;
        }

        $refPath = trim((string) wp_parse_url($referer, PHP_URL_PATH), '/');
        $homePath = trim((string) wp_parse_url(home_url('/'), PHP_URL_PATH), '/');
        if ($homePath !== '' && strpos($refPath, $homePath) === 0) {
            $refPath = trim(substr($refPath, strlen($homePath)), '/');
        }
        $query = (string) wp_parse_url($referer, PHP_URL_QUERY);
        parse_str($query, $q);

        $first = (string) strtok($refPath, '/');
        $lang = in_array($first, Multilingual::languages(), true)
            ? $first
            : (isset($q['lang']) && is_string($q['lang']) && in_array($q['lang'], Multilingual::languages(), true) ? $q['lang'] : '');

        if ($lang === '') {
            return $result;
        }

        if (Multilingual::provider() === 'polylang') {
            // Polylang reads it at priority 10. As a query parameter, so it
            // never ends up in a JSON body a handler stores.
            $request->set_query_params(array_merge((array) $request->get_query_params(), ['lang' => $lang]));
        } else {
            do_action('wpml_switch_language', $lang);
        }

        return $result;
    }

    /** @param int|string $bookingId */
    public static function rememberBookingLanguage($bookingId): void
    {
        // A booking made in the admin has no customer language to remember.
        $lang = Multilingual::visitorLanguage();
        if ((int) $bookingId <= 0 || $lang === '') {
            return;
        }
        $repo = new \Yatra\Repositories\BookingRepository();
        $booking = $repo->find((int) $bookingId);
        if (!$booking) {
            return;
        }
        $meta = json_decode((string) ($booking->meta ?? ''), true);
        $meta = is_array($meta) ? $meta : [];
        if (($meta['language'] ?? '') === $lang) {
            return;
        }
        $meta['language'] = $lang;
        $repo->update((int) $bookingId, ['meta' => wp_json_encode($meta)]);
    }

    /** @var array<int, true> Trips saved in this request. */
    private static array $queued = [];

    /** @param int|string $tripId */
    public static function queueTripRefresh($tripId): void
    {
        $tripId = (int) $tripId;
        if ($tripId <= 0) {
            return;
        }
        if (self::$queued === []) {
            add_action('shutdown', [self::class, 'runQueuedRefreshes'], 5);
        }
        self::$queued[$tripId] = true;
    }

    /**
     * @param mixed $entryId
     * @param mixed $data
     */
    public static function queueItineraryTripRefresh($entryId, $data = []): void
    {
        if (is_array($data) && !empty($data['trip_id'])) {
            self::queueTripRefresh((int) $data['trip_id']);
        }
    }

    public static function runQueuedRefreshes(): void
    {
        $ids = array_keys(self::$queued);
        self::$queued = [];
        foreach ($ids as $tripId) {
            self::refreshTripStrings($tripId);
        }
    }

    /**
     * Drop a deleted trip's cached texts.
     *
     * @param int|string $tripId
     */
    public static function forgetTripStrings($tripId): void
    {
        $tripId = (int) $tripId;
        $cache = get_option(self::CACHE_OPTION, []);
        if (is_array($cache) && isset($cache[$tripId])) {
            unset($cache[$tripId]);
            update_option(self::CACHE_OPTION, $cache, false);
        }
    }

    /**
     * Collect a trip's texts (cached for Polylang's Strings screen) and, for
     * WPML, register them right away.
     *
     * @param int|string $tripId
     */
    public static function refreshTripStrings($tripId): void
    {
        $tripId = (int) $tripId;
        if ($tripId <= 0) {
            return;
        }
        $strings = self::collectTrip($tripId);
        $cache = get_option(self::CACHE_OPTION, []);
        $cache = is_array($cache) ? $cache : [];
        $cache[$tripId] = $strings;
        update_option(self::CACHE_OPTION, $cache, false);

        if (Multilingual::provider() === 'wpml') {
            foreach ($strings as [$value, $hint, $multiline]) {
                Multilingual::register((string) $value, (string) $hint, (bool) $multiline);
            }
        }
    }

    /**
     * Polylang shows only strings registered in the current request, so its
     * Languages → Translations screen gets every trip's texts here. WPML
     * keeps registrations, so trips saved before Yatra registered strings are
     * picked up once (then on every save).
     */
    public static function registerStringsForTranslationScreen(): void
    {
        $provider = Multilingual::provider();
        $page = isset($_GET['page']) ? sanitize_key((string) $_GET['page']) : '';

        if (!current_user_can('manage_options') || wp_doing_ajax()) {
            return;
        }
        if ($provider === 'polylang' && $page !== 'mlang_strings') {
            return;
        }
        if ($provider === 'wpml' && get_option('yatra_ml_wpml_registered')) {
            return;
        }

        $cache = get_option(self::CACHE_OPTION, []);
        $cache = is_array($cache) ? $cache : [];
        $changed = false;
        foreach (self::publishedTripIds() as $tripId) {
            if (!isset($cache[$tripId])) {
                $cache[$tripId] = self::collectTrip($tripId);
                $changed = true;
            }
            foreach ($cache[$tripId] as [$value, $hint, $multiline]) {
                Multilingual::register((string) $value, (string) $hint, (bool) $multiline);
            }
        }
        if ($changed) {
            update_option(self::CACHE_OPTION, $cache, false);
        }
        foreach (self::collectTerms() as [$value, $hint, $multiline]) {
            Multilingual::register($value, $hint, $multiline);
        }
        if (method_exists(\Yatra\Services\TransactionalEmailTemplateService::class, 'customerTemplateTextsForTranslation')) {
            foreach (\Yatra\Services\TransactionalEmailTemplateService::customerTemplateTextsForTranslation() as [$value, $hint, $multiline]) {
                Multilingual::register($value, $hint, $multiline);
            }
        }

        /**
         * Register more texts for the translation screen (Yatra Pro's email
         * templates). Call \Yatra\Multilingual\Multilingual::register().
         *
         * @since 3.2.0
         */
        do_action('yatra_multilingual_register_strings');
        if ($provider === 'wpml') {
            update_option('yatra_ml_wpml_registered', 1, false);
        }
    }

    /**
     * @param mixed $term
     * @return mixed
     */
    public static function translateTermObject($term)
    {
        if (!is_object($term) || !Multilingual::isTranslating()) {
            return $term;
        }
        foreach (['name', 'description'] as $field) {
            if (isset($term->$field) && is_string($term->$field)) {
                $term->$field = Multilingual::translateTerm($term->$field);
            }
        }

        return $term;
    }

    /**
     * @param mixed            $response
     * @param array<mixed>     $handler
     * @param \WP_REST_Request $request
     * @return mixed
     */
    public static function markStringsStale($response, $handler, $request)
    {
        if (Multilingual::provider() !== 'wpml' || !$request instanceof \WP_REST_Request || $request->get_method() === 'GET') {
            return $response;
        }
        // Trips register themselves when saved; terms and email texts don't.
        if (preg_match('#^/yatra/v1/(destinations|activities|categories|trip-categories|difficulty-levels|settings)(/|$)#', (string) $request->get_route())) {
            delete_option('yatra_ml_wpml_registered');
        }

        return $response;
    }

    /**
     * Published destinations, activities, categories and difficulty levels,
     * so a term without trips (or not yet on a trip) can be translated too.
     *
     * @return array<int, array{0:string, 1:string, 2:bool}>
     */
    private static function collectTerms(): array
    {
        global $wpdb;
        $table = \Yatra\Database\Tables\ClassificationsTable::getTableName();
        $rows = (array) $wpdb->get_results("SELECT name, description FROM {$table} WHERE type IN ('category', 'activity', 'destination', 'difficulty') AND status = 'publish' LIMIT 2000");
        $strings = [];
        foreach ($rows as $row) {
            foreach (['name' => false, 'description' => true] as $field => $multiline) {
                // Untrimmed: translation looks the text up exactly as shown.
                $value = (string) ($row->$field ?? '');
                if (trim($value) !== '') {
                    $strings[] = [$value, TripStrings::termHint(), $multiline];
                }
            }
        }

        return $strings;
    }

    /** @return array<int, array{0:string, 1:string, 2:bool}> */
    private static function collectTrip(int $tripId): array
    {
        // Collect from the default-language trip, never a translated one.
        $wasTranslating = Multilingual::isTranslating();
        if ($wasTranslating) {
            Multilingual::switchTo(Multilingual::defaultLanguage());
        }
        try {
            $trip = (new \Yatra\Controllers\SingleTripController())->getById($tripId);
        } catch (\Throwable $e) {
            return [];
        } finally {
            if ($wasTranslating) {
                Multilingual::restore();
            }
        }

        return $trip ? TripStrings::collect($trip) : [];
    }

    /** @return int[] */
    private static function publishedTripIds(): array
    {
        global $wpdb;
        $table = \Yatra\Database\Tables\TripsTable::getTableName();

        return array_map('intval', (array) $wpdb->get_col("SELECT id FROM {$table} WHERE status = 'publish' ORDER BY id ASC LIMIT 1000"));
    }
}
