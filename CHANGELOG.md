# Changelog

All notable changes to this project are documented here. The WordPress.org–canonical history lives in **`readme.txt`** under **Changelog**; this file mirrors recent releases for GitHub and tooling.

## [3.0.4] — 2026-05-12

- **Unicode / Cyrillic slugs (end-to-end):** `SlugHelper::generate()` rawurldecodes percent-encoded UTF-8 + `mb_strtolower` + `\pL\pN` regex; validators (`ActivityValidator`, `DestinationValidator`, `TripValidator`) and `PrettyRouteMatcher` updated so Cyrillic / CJK slugs round-trip through pretty permalinks.
- **Pricing — single source of truth:** `create_booking` now uses `CalculationService::calculateFromSession` as its primary path so sidebar, AJAX summary refresh, and the payment-gateway amount are all driven by the same code. Result exposes `unit_price_before_dp`, `dp_total_adjustment`, `category_prices_post_dp`, and a `dynamic_pricing` breakdown.
- **Pricing summary UI:** services render as compact rows above Trip Subtotal; one consolidated Dynamic Pricing line; CSS `data-tooltip` hover replaces the native `title` attribute; duplicate-traveler-count bug fixed in `formDataToObject`'s `name[]` handling.
- **Coupon UI persistence:** `remove_coupon` syncs the transient via `yatra_set_booking_session()`; applied-coupon row's visibility is server-rendered on first paint so the Remove button survives a page refresh.
- **Session management:** `yatra_set_booking_session()` writes to both `$_SESSION` and a transient keyed by `booking_token`; `yatra_get_booking_session()` falls back to the transient when REST endpoints arrive without `PHPSESSID`.
- **Mobile sticky bar:** sticky-bottom booking JS extracted to `assets/js/single-trip-sidebar.js` (escapes `convert_chars`-induced `&&` → `&#038;&#038;` corruption that broke the bar when inlined on some themes).
- **FSE / block-theme support:** new `Yatra\Core\Template\FseTemplates` + `Yatra\Core\Routing\PageContext` provide handler→renderer handoff inside the FSE template canvas.
- **Custom trip tab:** `templates/partials/single-trip/content-custom.php` renders an admin-defined tab through the same `yatra_render_tab_icon()` pipeline as the built-in tabs.
- **Pro toggle scaffolding:** Settings → Booking adds "Show available dates as a dropdown" with `<ProBadge>`. The filter contract (`yatra_use_date_dropdown`, `yatra_single_trip_date_dropdown_options`) lives in free; the actual behavior is contributed by the corresponding Yatra Pro module.
- **i18n / Loco Translate:** `Bootstrap::loadTextDomain()` installs a `load_script_translation_file` filter that falls back to `WP_LANG_DIR/loco/plugins/` for `.json` script translations — mirrors the existing `.mo` fallback so Loco-managed translations work on React surfaces (account page, admin app, blocks).
- **CI / DevOps:** silent-failure bug in PHP lint (subshell counter loss in `find | while`) replaced with `xargs -0 -P 4 php -l`. Added concurrency, `permissions: contents: read`, and `timeout-minutes` to every job; moved `composer validate --strict` before install; stripped debug noise and the inline AI-report preamble from `$GITHUB_STEP_SUMMARY`.

## [3.0.3] — 2026-05-03

- **Shortcodes:** `[yatra_trip_category]` — trip category grid (destination-style cards), filters, `trip_category_page` pagination, and AJAX support (`TripCategoryShortcode`, `TripCategoryShortcodeAjax`).
- **Upgrades:** version-gated Free upgrade runner; legacy payment tokens table dropped when applicable (`Upgrade_3_0_3`).
- **Discounts:** REST and repository hardening (writable column whitelist; safer updates).
- **Single trip:** group discount discoverability in the sidebar; **Similar trips** links respect plain permalinks via `yatra_get_trip_permalink()`; enquiry modal **Send Enquiry** uses `yatra-booking-button` for primary CTA styling aligned with **Check Availability**.
- **Admin / i18n:** Trip Builder meal plan labels centralized; attribute icon picker preserves Font Awesome `provider` after save; front-end Important Info uses translated meal plan labels (`yatra_meal_plan_label()`).
