<?php
/**
 * Weather forecast on trip pages (3.3).
 *
 * Settings → General → Weather: a 7-day forecast for the trip's starting
 * point (its start coordinates), from Open-Meteo. Open-Meteo's free service
 * is for non-commercial use; a business site adds its Open-Meteo API key,
 * which switches to the commercial endpoint. Off unless turned on.
 *
 * The page never waits for the weather service: the forecast is loaded by
 * the browser from Yatra's own endpoint (GET /yatra/v1/trips/{id}/weather),
 * which caches each place for three hours. Nothing about the visitor is
 * sent to the weather service — only the trip's coordinates.
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class WeatherService
{
    private const CACHE_TTL = 3 * HOUR_IN_SECONDS;
    private const FAIL_TTL = 15 * MINUTE_IN_SECONDS;

    private static bool $booted = false;
    private static bool $scriptQueued = false;

    public static function init(): void
    {
        if (self::$booted) {
            return;
        }
        self::$booted = true;
        add_action('rest_api_init', [self::class, 'registerRoutes']);
        add_action('yatra_trip_sidebar_after_card', [self::class, 'renderBox'], 10, 1);
    }

    public static function enabled(): bool
    {
        return SettingsService::isEnabled('weather_enabled');
    }

    public static function units(): string
    {
        return SettingsService::get('weather_units', 'metric') === 'imperial' ? 'imperial' : 'metric';
    }

    /** @return array{0:float,1:float}|null */
    public static function coordinates(object $trip): ?array
    {
        $lat = $trip->starting_latitude ?? null;
        $lng = $trip->starting_longitude ?? null;
        if (!is_numeric($lat) || !is_numeric($lng)) {
            return null;
        }
        $lat = (float) $lat;
        $lng = (float) $lng;
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180 || ($lat == 0.0 && $lng == 0.0)) {
            return null;
        }

        return [round($lat, 2), round($lng, 2)];
    }

    public static function registerRoutes(): void
    {
        register_rest_route('yatra/v1', '/trips/(?P<id>\d+)/weather', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'restForecast'],
            'permission_callback' => '__return_true',
            'args' => ['id' => ['validate_callback' => static function ($v) { return is_numeric($v); }]],
        ]);
    }

    public static function restForecast(\WP_REST_Request $request): \WP_REST_Response
    {
        if (!self::enabled()) {
            return new \WP_REST_Response(['success' => false, 'code' => 'disabled'], 404);
        }
        $trip = (new \Yatra\Repositories\TripRepository())->findPublished((int) $request->get_param('id'));
        $coords = $trip ? self::coordinates($trip) : null;
        if ($coords === null) {
            return new \WP_REST_Response(['success' => false, 'code' => 'no_location'], 404);
        }
        $days = self::forecast($coords[0], $coords[1]);
        if ($days === null) {
            return new \WP_REST_Response(['success' => false, 'code' => 'unavailable'], 503);
        }
        $response = new \WP_REST_Response(['success' => true, 'units' => self::units(), 'days' => $days], 200);
        $response->header('Cache-Control', 'public, max-age=1800');

        return $response;
    }

    /**
     * Daily forecast: [{date, code, label, max, min, rain}] or null when the
     * service can't be reached (cached briefly so a broken service isn't hit
     * on every page view).
     *
     * @return list<array{date:string,code:int,label:string,max:float,min:float,rain:?int}>|null
     */
    public static function forecast(float $lat, float $lng): ?array
    {
        $units = self::units();
        $key = trim((string) SettingsService::get('weather_api_key', ''));
        $cacheKey = 'yatra_wx_' . md5($lat . '|' . $lng . '|' . $units . '|' . ($key !== '' ? 'k' : ''));
        $cached = get_transient($cacheKey);
        if (is_array($cached)) {
            return $cached['days'] ?? null;
        }

        $args = [
            'latitude' => $lat,
            'longitude' => $lng,
            'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
            'timezone' => 'auto',
            'forecast_days' => 7,
        ];
        if ($units === 'imperial') {
            $args['temperature_unit'] = 'fahrenheit';
        }
        $base = 'https://api.open-meteo.com/v1/forecast';
        if ($key !== '') {
            $base = 'https://customer-api.open-meteo.com/v1/forecast';
            $args['apikey'] = $key;
        }
        /**
         * The weather service URL (another Open-Meteo compatible host).
         *
         * @since 3.3.0
         */
        $url = (string) apply_filters('yatra_weather_api_url', add_query_arg($args, $base), $lat, $lng);

        $res = wp_safe_remote_get($url, ['timeout' => 6, 'user-agent' => 'Yatra/' . (defined('YATRA_VERSION') ? YATRA_VERSION : '3') . '; WordPress']);
        $days = null;
        if (!is_wp_error($res) && (int) wp_remote_retrieve_response_code($res) === 200) {
            $body = json_decode((string) wp_remote_retrieve_body($res), true);
            $days = self::parse(is_array($body) ? $body : []);
        }
        set_transient($cacheKey, ['days' => $days], $days === null ? self::FAIL_TTL : self::CACHE_TTL);

        return $days;
    }

    /** @return list<array{date:string,code:int,label:string,max:float,min:float,rain:?int}>|null */
    public static function parse(array $body): ?array
    {
        $daily = is_array($body['daily'] ?? null) ? $body['daily'] : null;
        if ($daily === null || !is_array($daily['time'] ?? null)) {
            return null;
        }
        $out = [];
        foreach (array_slice($daily['time'], 0, 7) as $i => $date) {
            if (!is_string($date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                continue;
            }
            $max = $daily['temperature_2m_max'][$i] ?? null;
            $min = $daily['temperature_2m_min'][$i] ?? null;
            if (!is_numeric($max) || !is_numeric($min)) {
                continue;
            }
            $code = (int) ($daily['weather_code'][$i] ?? 0);
            $rain = $daily['precipitation_probability_max'][$i] ?? null;
            $out[] = [
                'date' => $date,
                'code' => $code,
                'label' => self::label($code),
                'icon' => self::icon($code),
                'max' => round((float) $max),
                'min' => round((float) $min),
                'rain' => is_numeric($rain) ? (int) $rain : null,
            ];
        }

        return $out !== [] ? $out : null;
    }

    /** WMO weather code → words. */
    public static function label(int $code): string
    {
        if ($code === 0) {
            return __('Clear', 'yatra');
        }
        if ($code <= 2) {
            return __('Partly cloudy', 'yatra');
        }
        if ($code === 3) {
            return __('Cloudy', 'yatra');
        }
        if ($code === 45 || $code === 48) {
            return __('Fog', 'yatra');
        }
        if ($code >= 51 && $code <= 57) {
            return __('Drizzle', 'yatra');
        }
        if (($code >= 61 && $code <= 67) || ($code >= 80 && $code <= 82)) {
            return __('Rain', 'yatra');
        }
        if (($code >= 71 && $code <= 77) || $code === 85 || $code === 86) {
            return __('Snow', 'yatra');
        }
        if ($code >= 95) {
            return __('Thunderstorm', 'yatra');
        }

        return __('Mixed', 'yatra');
    }

    public static function icon(int $code): string
    {
        if ($code === 0) {
            return '☀️';
        }
        if ($code <= 2) {
            return '⛅';
        }
        if ($code === 3 || $code === 45 || $code === 48) {
            return '☁️';
        }
        if (($code >= 71 && $code <= 77) || $code === 85 || $code === 86) {
            return '❄️';
        }
        if ($code >= 95) {
            return '⛈️';
        }

        return '🌧️';
    }

    /** @param mixed $trip */
    public static function renderBox($trip = null): void
    {
        if (!self::enabled() || !is_object($trip)) {
            return;
        }
        $id = (int) (method_exists($trip, 'getId') ? $trip->getId() : ($trip->id ?? 0));
        if ($id <= 0 || self::coordinates($trip) === null) {
            return;
        }
        $place = trim((string) ($trip->starting_location ?? ''));
        ?>
        <div class="yatra-weather" data-endpoint="<?php echo esc_url(rest_url('yatra/v1/trips/' . $id . '/weather')); ?>" hidden style="margin-top:16px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;">
            <div style="font-weight:600;margin-bottom:8px;">
                <?php
                echo esc_html($place !== ''
                    /* translators: %s: place name */
                    ? sprintf(__('Weather in %s', 'yatra'), $place)
                    : __('Weather at the start point', 'yatra'));
                ?>
            </div>
            <ol class="yatra-weather__days" style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px;font-size:0.8rem;text-align:center;"></ol>
            <div style="margin-top:6px;font-size:0.7rem;color:#6b7280;"><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" style="color:inherit;"><?php esc_html_e('Weather data by Open-Meteo.com', 'yatra'); ?></a></div>
        </div>
        <?php
        if (!self::$scriptQueued) {
            self::$scriptQueued = true;
            add_action('wp_footer', [self::class, 'printScript'], 20);
        }
    }

    public static function printScript(): void
    {
        $locale = str_replace('_', '-', (string) get_locale());
        /* translators: %d: chance of rain in percent */
        $rainText = __('Rain %d%%', 'yatra');
        ?>
        <script>
        (function () {
            var locale = <?php echo wp_json_encode($locale); ?>;
            var rainText = <?php echo wp_json_encode($rainText); ?>;
            document.querySelectorAll('.yatra-weather[data-endpoint]').forEach(function (box) {
                fetch(box.getAttribute('data-endpoint'), { credentials: 'omit' })
                    .then(function (r) { return r.ok ? r.json() : null; })
                    .then(function (res) {
                        if (!res || !res.success || !res.days || !res.days.length) { return; }
                        var list = box.querySelector('.yatra-weather__days');
                        var unit = res.units === 'imperial' ? '°F' : '°C';
                        res.days.forEach(function (d) {
                            var li = document.createElement('li');
                            li.style.cssText = 'background:#f9fafb;border-radius:8px;padding:6px 2px;';
                            var day = d.date;
                            try { day = new Date(d.date + 'T12:00:00').toLocaleDateString(locale, { weekday: 'short' }); } catch (e) {}
                            var parts = [['div', day, 'font-weight:600'], ['div', d.icon, 'font-size:1.2rem'], ['div', Math.round(d.max) + unit + ' / ' + Math.round(d.min) + unit, ''], ['div', d.rain === null ? '' : rainText.replace('%d', d.rain).replace('%%', '%'), 'color:#2563eb']];
                            parts.forEach(function (p) {
                                var el = document.createElement(p[0]);
                                el.textContent = p[1];
                                if (p[2]) { el.style.cssText = p[2]; }
                                li.appendChild(el);
                            });
                            li.title = d.label;
                            list.appendChild(li);
                        });
                        box.hidden = false;
                    })
                    .catch(function () {});
            });
        })();
        </script>
        <?php
    }
}
