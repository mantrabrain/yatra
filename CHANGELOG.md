# Changelog

All notable changes to this project are documented here. The WordPress.org–canonical history lives in **`readme.txt`** under **Changelog**; this file mirrors recent releases for GitHub and tooling.

## [3.0.8] — 2026-06-24

- **Additional Services — percentage pricing fixed:** a percentage-priced service now charges that percent of the trip price (previously a flat amount), with no traveler/day double-counting. The displayed line-item, the live popup total and the charged amount are all server-calculated from one value so they agree. **Fixed-price services are unchanged to the cent.** Price is validated server-side (no negatives; percentages capped at 100%).
- **Translations:** the "Pay Now" / "Complete Booking" button labels (localized from PHP for reliability), the country dropdown (translated at the country definition), the bank-transfer confirmation details and all payment-gateway labels are now translatable; Pro strings corrected to the proper text domain. Regenerated `yatra.pot`.
- **Booking confirmation email:** no longer appends a stray currency code after the total.
- **Lead-traveler fields:** the traveler form can carry fields that apply to the lead traveler (Traveler 1) only — required, saved, and shown in admin/booking details and emails for the lead only.
- **Settings gating:** with Customer Registration / sign-in disabled, account-creation and Sign In no longer appear during booking; deposit/registration toggles honored consistently.
- **Deposit + offline gateways on guest / waitlist checkout:** an offline gateway (Bank Transfer / Pay Later) chosen with a deposit/partial is no longer silently switched to Pay Later with the deposit replaced by the full amount when the booking goes through guest email-verification or the waitlist. The chosen gateway and deposit/partial are preserved through verification and waitlist promotion (`BookingSessionController`); online gateways unaffected. Verified across all 9 gateways.
- **Reports:** Google Analytics & Facebook Pixel reports enable as soon as their module is enabled and configured.
- **Guest email verification** uses the configured, editable template; **SEO** `{name}` token in destination/activity/category meta now expands.
- **Cleanup:** frontend diagnostic `console.log` output gated behind a debug flag (off in production), including PII (form-input) logging in Abandoned Booking Recovery.
- No DB changes, no migration. Safe to update from 3.0.7. Pair with **Yatra Pro 3.0.6**.

## [3.0.6] — 2026-05-27

- **Pricing plans renamed (display-only):** Personal → **Starter**, Agency → **Scale** (Growth unchanged). Updated the Modules page tier badges, `PremiumUpgradeDialog`, the `planLabels` map, the License-page tier badge, and the REST gate messages in `ModuleController` to read Starter / Growth / Scale. The internal capability slugs (`personal`/`growth`/`agency`) and the `requires_agency` / `requires_growth_or_agency` module flags are **unchanged**, so feature gating is byte-for-byte equivalent and existing Pro licenses keep identical access.
- **Scale 1-site / 15-site:** the Scale tier is offered as a 1-site or 15-site license; identical feature set, only activation count differs.
- **UX:** White Label module re-categorised "Agency" → "Branding"; removed the leading icon before the plan name in the upgrade-dialog badge.
- No DB changes, no migration. Safe to update from 3.0.5.x in any order relative to Pro. Pair with **Yatra Pro 3.0.4**.

## [3.0.5.1] — 2026-05-25

- **Hotfix — admin 403 on REST routes.** Administrators on a free-only install hit `rest_forbidden` on Settings (and any other surface whose REST controller gates on a granular `yatra_*` cap). The capability filters that grant `yatra_*` caps to users with `manage_options` were only installed from `AdminServiceProvider::registerAdminMenu()` — hooked on `admin_menu`, which does not fire during REST requests. The admin SPA loads data via REST, so the admin fallback never ran for those calls. Fix: install the filters from `AppServiceProvider::register()` (always-loaded core path) so they're present for every entry point — admin, REST, AJAX, frontend, CLI. Added a `$capabilityFiltersInstalled` static guard so the two call sites don't double-register. Filter logic, priorities, and the team-module-disabled strip branch are unchanged — this is a registration-timing fix, not a semantics change. Safe to update from 3.0.5. Pair with **Yatra Pro 3.0.4**.

## [3.0.5] — 2026-05-24

- **Capability registry foundation:** new `user_has_cap` filter at priority 7 in `AdminServiceProvider::bootstrapMenuCapability()`. Reads the `yatra_team_role_enforcement_active` filter signal — when truthy (Pro Team module enabled, OR module disabled but the operator opted in to "keep access"), caps resolve normally; when falsy (Pro deactivated, or module off without opt-in), non-admin `yatra_*` caps are stripped so stored role assignments become inert. WP administrators always pass via the admin fallback first.
- **Cap-string consistency sweep:** every React page that gated UI on `manage_yatra` now references the canonical registered cap (`yatra_manage_settings`, `yatra_manage_emails`, `yatra_access_admin`). New caps registered: `yatra_view_reviews`, `yatra_edit_reviews`, `yatra_delete_reviews`, `yatra_manage_reviews`. Inline cap checks inside `TripController::restore_revision` and `SingleTripController` draft-preview gain `manage_options` fallback so site owners never fail.
- **`isWpAdmin` always injected:** `AdminAssetsProvider` now always injects `isWpAdmin` and mirrors `manage_options` into `window.yatraAdmin.capabilities` (was previously only set by the Pro Team module). Fixes regression where Reviews + Email Templates didn't load data for admins on free-only or Team-disabled installs. React `usePermissions.can()` gets a triple admin-fallback (`isWpAdmin` → `roles.administrator` → `capabilities.manage_options`).
- **Customer + Availability controllers:** `CustomerController::checkAdminPermission`, `AvailabilitySpecificDatesController::checkPermission`, and `AvailabilityRecurringRulesController::checkPermission` now accept the registered Team caps (`yatra_edit_customers`, `yatra_edit_trips`) in addition to the legacy `manage_options` and pre-existing legacy caps (kept as OR-arms for back-compat with any hand-grant filter).
- **Transactional email types are now extensible:** `TransactionalEmailTemplateService::typeToSettingsKeys()` exposes the `yatra_transactional_email_type_to_keys` filter so Pro modules can register their own type → settings-keys mapping. Default subject/body lookups expose `yatra_transactional_email_default_subject` and `yatra_transactional_email_default_body`. Powers the new Team module's customizable invitation email template.
- **Try Yatra Pro pill:** subtle amber pill appears next to the page title on every admin page when the Pro plugin is NOT active. Links to `https://try.wpyatra.com/try-yatra-pro/` (no credit card required). Hidden as soon as Pro is active. Uses the same `Tooltip` component as the rest of the admin.
- **UX polish:**
  - `SharedTable` action-menu dropdown shadow reduced from `shadow-2xl` to `shadow-md`.
  - Modal-body data loaders replaced with `Skeleton` blocks (Team page, MemberEditDrawer, RoleEditDrawer, AddMemberModal candidate picker).
  - Departure save/cancel redirect now returns to the Departures page instead of the Trips page.
  - Email page tabs (Delivery, Templates, Sequences, Logs) persist in the URL.
- **Layout sidebar:** Reviews entry now gates on `yatra_view_reviews` (was `yatra_view_trips`). `useEmailSettingsManager` gates on `yatra_manage_emails` (was the unregistered `manage_yatra`).
- Safe to update from 3.0.4. Pair with **Yatra Pro 3.0.3** for the Team & Access module.

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
