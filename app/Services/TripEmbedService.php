<?php
/**
 * Trips embedder (3.3): show your trips on another website.
 *
 * Settings → API Access → "Embed trips on other websites" turns on a small
 * page at /?yatra_embed=trips that lists trip cards (photo, name, duration,
 * price) and nothing else, made to sit in an <iframe> on a partner's or your
 * other website. Links open the trip on this site in a new tab. The admin
 * screen builds the snippet; a tiny script in the snippet resizes the frame
 * to fit.
 *
 * Parameters: trips=1,2,3 (else the newest), limit (1–12), columns (1–4).
 * Only published trips are shown, and the page reveals nothing that the
 * trip pages don't already show.
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class TripEmbedService
{
    private static bool $booted = false;

    public static function init(): void
    {
        if (self::$booted) {
            return;
        }
        self::$booted = true;
        add_action('template_redirect', [self::class, 'maybeRender'], 1);
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        register_rest_route('yatra/v1', '/embed/snippet', [
            'methods' => 'GET',
            'callback' => static function (\WP_REST_Request $request): \WP_REST_Response {
                $args = self::parseArgs((array) $request->get_params());

                return new \WP_REST_Response(['success' => true, 'enabled' => self::enabled(), 'snippet' => self::snippet($args)], 200);
            },
            'permission_callback' => static function (): bool {
                return current_user_can('manage_options');
            },
        ]);
    }

    public static function enabled(): bool
    {
        return SettingsService::isEnabled('embed_enabled');
    }

    /** @return array{ids: list<int>, limit: int, columns: int} */
    public static function parseArgs(array $q): array
    {
        $ids = [];
        foreach (explode(',', (string) ($q['trips'] ?? '')) as $part) {
            $id = (int) trim($part);
            if ($id > 0 && !in_array($id, $ids, true)) {
                $ids[] = $id;
            }
        }

        return [
            'ids' => array_slice($ids, 0, 12),
            'limit' => max(1, min(12, (int) ($q['limit'] ?? 6) ?: 6)),
            'columns' => max(1, min(4, (int) ($q['columns'] ?? 3) ?: 3)),
        ];
    }

    /** @return list<object> Published trips to show. */
    public static function trips(array $args): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trips';
        if ($args['ids'] !== []) {
            $in = implode(',', array_map('intval', $args['ids']));
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $rows = (array) $wpdb->get_results("SELECT * FROM `{$table}` WHERE status IN ('publish','published') AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00') AND id IN ({$in})");
            $byId = [];
            foreach ($rows as $r) {
                $byId[(int) $r->id] = $r;
            }
            $ordered = [];
            foreach ($args['ids'] as $id) {
                if (isset($byId[$id])) {
                    $ordered[] = $byId[$id];
                }
            }

            return array_slice($ordered, 0, $args['limit']);
        }
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        return (array) $wpdb->get_results($wpdb->prepare("SELECT * FROM `{$table}` WHERE status IN ('publish','published') AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00') ORDER BY id DESC LIMIT %d", $args['limit']));
    }

    public static function maybeRender(): void
    {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if (!isset($_GET['yatra_embed']) || (string) $_GET['yatra_embed'] !== 'trips') {
            return;
        }
        if (!self::enabled()) {
            status_header(404);
            nocache_headers();
            echo esc_html__('Embedding is turned off on this site.', 'yatra');
            exit;
        }
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $args = self::parseArgs(wp_unslash($_GET));
        $trips = self::trips($args);
        status_header(200);
        header('Content-Type: text/html; charset=' . get_option('blog_charset'));
        header('Cache-Control: public, max-age=600');
        // This page is meant to be framed anywhere; it has no forms or actions.
        header_remove('X-Frame-Options');
        echo self::html($trips, $args); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        exit;
    }

    /** @param list<object> $rows */
    public static function html(array $rows, array $args): string
    {
        $cards = '';
        foreach ($rows as $row) {
            try {
                $trip = \Yatra\Models\Trip::fromStdClass($row);
            } catch (\Throwable $e) {
                continue;
            }
            $image = (array) $trip->getImage();
            $price = '';
            try {
                $p = TripPricingService::resolveDisplayPricing($trip);
                if ((float) ($p['effective_price_min'] ?? 0) > 0) {
                    $price = sprintf(
                        /* translators: %s: price */
                        __('From %s', 'yatra'), wp_strip_all_tags((string) yatra_format_price((float) $p['effective_price_min']))
                    );
                }
            } catch (\Throwable $e) {
                $price = '';
            }
            $days = (int) ($row->duration_days ?? 0);
            $cards .= '<a class="card" href="' . esc_url($trip->getPermalink()) . '" target="_blank" rel="noopener">'
                . (!empty($image['has_image']) ? '<img src="' . esc_url((string) $image['url']) . '" alt="" loading="lazy">' : '')
                . '<span class="body"><span class="title">' . esc_html($trip->getTitle()) . '</span>'
                . ($days > 0 ? '<span class="meta">' . esc_html(sprintf(
                    /* translators: %d: number of days */
                    _n('%d day', '%d days', $days, 'yatra'),
                    $days
                )) . '</span>' : '')
                . ($price !== '' ? '<span class="price">' . esc_html($price) . '</span>' : '')
                . '</span></a>';
        }
        if ($cards === '') {
            $cards = '<p class="empty">' . esc_html__('No trips to show.', 'yatra') . '</p>';
        }
        $primary = (string) SettingsService::get('primary_color', '#2563eb');
        $primary = preg_match('/^#[0-9a-fA-F]{3,8}$/', $primary) ? $primary : '#2563eb';
        $site = esc_html((string) get_bloginfo('name'));

        return '<!doctype html><html lang="' . esc_attr(get_bloginfo('language')) . '"><head><meta charset="' . esc_attr(get_option('blog_charset')) . '">'
            . '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' . $site . '</title>'
            . '<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111827;background:transparent}'
            . '.grid{display:grid;grid-template-columns:repeat(' . (int) $args['columns'] . ',minmax(0,1fr));gap:16px;padding:4px}'
            . '@media(max-width:640px){.grid{grid-template-columns:1fr}}'
            . '.card{display:flex;flex-direction:column;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;background:#fff}'
            . '.card img{width:100%;height:160px;object-fit:cover;display:block}.body{display:flex;flex-direction:column;gap:4px;padding:12px}'
            . '.title{font-weight:600}.meta{font-size:13px;color:#6b7280}.price{font-weight:600;color:' . esc_attr($primary) . '}.empty{color:#6b7280}</style></head>'
            . '<body><div class="grid">' . $cards . '</div>'
            . '<script>(function(){function h(){try{parent.postMessage({yatraEmbedHeight:document.documentElement.scrollHeight},"*");}catch(e){}}window.addEventListener("load",h);window.addEventListener("resize",h);h();})();</script>'
            . '</body></html>';
    }

    /** The snippet for another website. */
    public static function snippet(array $args): string
    {
        $url = add_query_arg(array_filter([
            'yatra_embed' => 'trips',
            'trips' => $args['ids'] !== [] ? implode(',', $args['ids']) : null,
            'limit' => $args['limit'],
            'columns' => $args['columns'],
        ], static function ($v) {
            return $v !== null;
        }), home_url('/'));

        return '<iframe src="' . esc_url($url) . '" title="' . esc_attr(get_bloginfo('name')) . '" style="width:100%;border:0;min-height:320px" loading="lazy" data-yatra-embed></iframe>'
            . "\n" . '<script>window.addEventListener("message",function(e){if(e.origin!==' . wp_json_encode(untrailingslashit((string) preg_replace('#^(https?://[^/]+).*$#', '$1', home_url('/')))) . '||!e.data||!e.data.yatraEmbedHeight)return;document.querySelectorAll("iframe[data-yatra-embed]").forEach(function(f){if(f.contentWindow===e.source)f.style.height=e.data.yatraEmbedHeight+"px";});});</script>';
    }
}
