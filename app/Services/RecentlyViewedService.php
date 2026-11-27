<?php
/**
 * Recently viewed trips (3.3).
 *
 * When Settings → General → "Recently viewed trips" is on, the visitor's
 * browser remembers the last trips they looked at (in its local storage —
 * nothing is sent to or stored on the server, no cookie), and a
 * "Recently viewed" row shows them again:
 *   - under the trip page, when Settings → General → "Recently viewed trips"
 *     is on;
 *   - anywhere with the [yatra_recently_viewed] shortcode (title="…" limit="4").
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class RecentlyViewedService
{
    public const MAX = 8;

    private static bool $booted = false;
    private static bool $scriptQueued = false;

    /** @var array<string, string>|null The trip shown on this page. */
    private static ?array $current = null;

    public static function init(): void
    {
        if (self::$booted) {
            return;
        }
        self::$booted = true;
        add_shortcode('yatra_recently_viewed', [self::class, 'shortcode']);
        add_action('yatra_single_trip_after_tabs', [self::class, 'rememberTrip'], 1, 1);
        add_action('yatra_single_trip_after_tabs', [self::class, 'renderOnTripPage'], 50, 1);
    }

    public static function enabledOnTripPages(): bool
    {
        return SettingsService::isEnabled('recently_viewed_enabled');
    }

    /**
     * The current trip, remembered by the browser (only while the feature is
     * on, so nothing is written to visitors' browsers on sites that don't use it).
     *
     * @param mixed $trip
     */
    public static function rememberTrip($trip = null): void
    {
        if (!is_object($trip) || !method_exists($trip, 'getId')) {
            return;
        }
        /**
         * Remember trips the visitor views (browser storage).
         *
         * @since 3.3.0
         */
        if (!apply_filters('yatra_recently_viewed_remember', self::enabledOnTripPages(), $trip)) {
            return;
        }
        $image = method_exists($trip, 'getImage') ? (array) $trip->getImage() : [];
        $price = '';
        if (class_exists('\\Yatra\\Services\\TripPricingService')) {
            try {
                $p = TripPricingService::resolveDisplayPricing($trip);
                if ((float) ($p['effective_price_min'] ?? 0) > 0 && function_exists('yatra_format_price')) {
                    $price = wp_strip_all_tags((string) yatra_format_price((float) $p['effective_price_min']));
                }
            } catch (\Throwable $e) {
                $price = '';
            }
        }
        self::$current = [
            'id' => (string) (int) $trip->getId(),
            'title' => wp_strip_all_tags((string) $trip->getTitle()),
            'url' => esc_url_raw((string) $trip->getPermalink()),
            'image' => !empty($image['has_image']) ? esc_url_raw((string) ($image['url'] ?? '')) : '',
            'price' => $price,
        ];
        self::queueScript();
    }

    /** @param mixed $trip */
    public static function renderOnTripPage($trip = null): void
    {
        if (!self::enabledOnTripPages()) {
            return;
        }
        echo self::container(__('Recently viewed', 'yatra'), 4, true); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }

    /** @param mixed $atts */
    public static function shortcode($atts = []): string
    {
        $atts = shortcode_atts(['title' => __('Recently viewed', 'yatra'), 'limit' => 4], is_array($atts) ? $atts : [], 'yatra_recently_viewed');
        self::queueScript();

        return self::container((string) $atts['title'], max(1, min(self::MAX, (int) $atts['limit'])), false);
    }

    private static function container(string $title, int $limit, bool $onTripPage): string
    {
        return '<section class="yatra-recently-viewed" hidden data-limit="' . esc_attr((string) $limit) . '"'
            . ($onTripPage ? ' data-exclude-current="1"' : '') . ' style="margin-top:32px;">'
            . '<h2 class="yatra-section-title">' . esc_html($title) . '</h2>'
            . '<div class="yatra-recently-viewed__list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;"></div>'
            . '</section>';
    }

    private static function queueScript(): void
    {
        if (!self::$scriptQueued) {
            self::$scriptQueued = true;
            add_action('wp_footer', [self::class, 'printScript'], 25);
        }
    }

    public static function printScript(): void
    {
        ?>
        <script>
        (function () {
            var KEY = 'yatraRecentlyViewed', MAX = <?php echo (int) self::MAX; ?>;
            var current = <?php echo wp_json_encode(self::$current); ?>;
            var list = [];
            try { list = JSON.parse(window.localStorage.getItem(KEY) || '[]'); } catch (e) { list = []; }
            if (!Array.isArray(list)) { list = []; }
            list = list.filter(function (t) { return t && typeof t.id === 'string' && typeof t.url === 'string' && /^https?:\/\//.test(t.url); });
            var shownBefore = list.slice();
            if (current && current.id) {
                list = [current].concat(list.filter(function (t) { return t.id !== current.id; })).slice(0, MAX);
                try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
            }
            document.querySelectorAll('.yatra-recently-viewed').forEach(function (box) {
                var limit = parseInt(box.getAttribute('data-limit'), 10) || 4;
                var items = box.getAttribute('data-exclude-current') === '1' && current
                    ? shownBefore.filter(function (t) { return t.id !== current.id; })
                    : list;
                items = items.slice(0, limit);
                if (!items.length) { return; }
                var wrap = box.querySelector('.yatra-recently-viewed__list');
                items.forEach(function (t) {
                    var a = document.createElement('a');
                    a.href = t.url;
                    a.className = 'yatra-recently-viewed__item';
                    a.style.cssText = 'display:block;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;background:#fff;';
                    if (t.image && /^https?:\/\//.test(t.image)) {
                        var img = document.createElement('img');
                        img.src = t.image; img.alt = ''; img.loading = 'lazy';
                        img.style.cssText = 'width:100%;height:130px;object-fit:cover;display:block;';
                        a.appendChild(img);
                    }
                    var body = document.createElement('div');
                    body.style.cssText = 'padding:10px 12px;';
                    var h = document.createElement('div');
                    h.textContent = t.title || '';
                    h.style.cssText = 'font-weight:600;';
                    body.appendChild(h);
                    if (t.price) {
                        var p = document.createElement('div');
                        p.textContent = t.price;
                        p.style.cssText = 'font-size:0.9em;color:#6b7280;margin-top:2px;';
                        body.appendChild(p);
                    }
                    a.appendChild(body);
                    wrap.appendChild(a);
                });
                box.hidden = false;
            });
        })();
        </script>
        <?php
    }
}
