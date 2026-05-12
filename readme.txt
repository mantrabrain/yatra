=== Yatra - Travel Booking & Tour Management ===
Contributors: MantraBrain
Tags: tour-booking, tour-operator, travel, travel-booking, travel-agency
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 3.0.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Tours & activities: trips, departures, PayPal, Pay Later, guests, email, reports. [Yatra Pro](https://wpyatra.com/pricing/): cards, deposits, modules.

== Description ==

**✈️ Yatra** is a WordPress plugin built for **tour operators, activity providers, and travel brands** that need real trip inventory—not a generic shop. The free version includes a full booking office: trips, availability, checkout, customer records, and essential emails. **[Yatra Pro](https://wpyatra.com/pricing/)** unlocks [premium payment methods](https://wpyatra.com/pricing/) and a suite of [Pro modules](https://wpyatra.com/pricing/) you can turn on as your business grows.

**Official site:** 🌐 [wpyatra.com](https://wpyatra.com/) · 📖 [docs.wpyatra.com](https://docs.wpyatra.com) · 💬 [WordPress.org forum](https://wordpress.org/support/plugin/yatra/)

= 🎬 See Yatra in action =

🎥   Watch the Yatra 3.0 walkthrough on YouTube — trips, bookings, checkout, and traveler accounts in a few minutes. For release highlights and upgrade notes, see **[Yatra 3.0 on wpyatra.com](https://wpyatra.com/yatra-3-0/)**. More tutorials: **[MantraBrain on YouTube](https://www.youtube.com/@MantraBrain)**.
	[youtube https://www.youtube.com/watch?v=cHmC-x7y0TQ]

= ✈️ Why teams pick Yatra =

* 🗺️ **Travel-first data model** — Departures, capacity, traveler types, and itineraries match how tours are actually sold.
* 🧭 **One admin workspace** — Modern Yatra dashboard inside wp-admin; less tab-hopping than bolting travel onto a generic commerce stack.
* ⚖️ **Honest Free vs [Pro](https://wpyatra.com/pricing/)** — Core booking, CRM-style records, reviews, and PayPal / Pay Later are in the free plugin. Card gateways and advanced modules are in [Pro](https://wpyatra.com/pricing/)—no surprise paywalls on basics like “save a trip” (saved trips / wishlist are a **[Pro](https://wpyatra.com/pricing/)** feature when enabled in settings).
* 🔒 **Your site, your data** — Bookings and customer data stay in your WordPress database; payments go through the gateways you configure.

= 🎁 Free plugin — what you get =

**Trips and catalog**

* Unlimited trips with rich descriptions, gallery, difficulty, duration, meeting points, included/excluded lists
* Itinerary builder (day-by-day)
* Per-trip FAQs and custom attributes
* Destinations, activities, categories, and archives visitors can browse

**Bookings and customers**

* Booking lifecycle (e.g. pending, confirmed, completed, cancelled) with references
* Traveler details, notes, and operational views your staff use daily
* Customer accounts: booking history, payments, profile, and document access (e.g. invoices, vouchers, itineraries) where you enable them
* Guest checkout and registered users

**Pricing and availability**

* Sale and regular pricing, traveler-based pricing (adults, children, custom types)
* Departures, capacity, and recurring availability rules
* Discounts and coupons

**Payments (free)**

* **PayPal**
* **Pay Later** (book now, confirm or pay offline—ideal for bank transfer, cash on arrival, or invoice workflows)

**Email**

* Core delivery settings and essential traveler templates (e.g. booking, payment, cancellation, reminder)

**Front end**

* Templates for trip listings, single trip, booking flow, checkout, and account
* Blocks and shortcodes to place trips, search, login, and account on any page
* Responsive layouts; works with well-coded block and classic themes

**Reviews and reporting**

* Reviews with moderation and trip-level display
* Admin reports for bookings, revenue, and trends

**Quality and extensibility**

* PHP 7.4 or newer, structured codebase
* Hooks and filters for customization; template overrides in your theme
* REST-oriented flows for booking and account experiences in 3.x

= 💎 Yatra Pro — when you are ready to scale =

**[Compare plans and buy Yatra Pro](https://wpyatra.com/pricing/)** — same [Pro](https://wpyatra.com/pricing/) software on every tier; plans differ by **site activations** and **support level**.

**Premium gateways (examples)**

* [Stripe](https://wpyatra.com/pricing/), [Razorpay](https://wpyatra.com/pricing/), [Mollie](https://wpyatra.com/pricing/), [Paystack](https://wpyatra.com/pricing/), [Square](https://wpyatra.com/pricing/), [Authorize.Net](https://wpyatra.com/pricing/), [bank transfer](https://wpyatra.com/pricing/) (region and account dependent)

**[Pro modules](https://wpyatra.com/pricing/)** (enable under Yatra → Modules)

* [Flexible Payments](https://wpyatra.com/pricing/) — deposits and partial payments
* [Dynamic Pricing](https://wpyatra.com/pricing/) — rules for seasonality, demand, early bird, last minute
* [Advanced Discount](https://wpyatra.com/pricing/) — group-style discounts alongside coupons
* [Google Calendar sync](https://wpyatra.com/pricing/)
* [Additional Services](https://wpyatra.com/pricing/) — sell extras with the trip
* [Trip Consent](https://wpyatra.com/pricing/) — digital waivers and signatures
* [Email Automation](https://wpyatra.com/pricing/) — extended templates, sequences, logs
* [Custom booking questions](https://wpyatra.com/pricing/) — drag-and-drop extra fields
* [Mailchimp](https://wpyatra.com/pricing/), [Facebook Pixel](https://wpyatra.com/pricing/), [Google Analytics 4 Enhanced](https://wpyatra.com/pricing/)
* [Abandoned Booking Recovery](https://wpyatra.com/pricing/)
* [Custom Landing Pages](https://wpyatra.com/pricing/) — build dedicated, conversion-focused landing pages per trip or campaign

**Traveler experience**

* [Saved trips / wishlist](https://wpyatra.com/pricing/) when [Yatra Pro](https://wpyatra.com/pricing/) is active and wishlist is enabled in settings

**Support**

* [Premium or priority support](https://wpyatra.com/pricing/) depending on plan; see [wpyatra.com](https://wpyatra.com/) for current terms and **money-back window** for paid licenses.

= 🧩 Blocks and shortcodes =

Use the **block editor** or **classic shortcodes** to drop catalog widgets, search, and account UI into any page.

**Blocks** (search the inserter for “Yatra” or the block name):

* **Trip** — block name `yatra/tour` (trip grid; the registered name stays `yatra/tour` for backward compatibility, but the inserter title and UI now read **Trip**). **Trip Settings** (layout, **Featured Priority** — restrict to *Featured*, *New*, or *Limited Time* picked on the trip form’s **Categorization → Featured Priority**) and **Filters**: each taxonomy (destinations, activities, trip categories, difficulty / fitness level) supports **Listing scope** — either **All published** (no ID filter saved) or **Only selected**, with **search plus checkboxes** to pick numeric classification IDs. Choices load from Yatra’s block-editor REST route for users who can `edit_posts`. **Same filtering backend** as **`[yatra_trip]` / `[yatra_tour]`** (`destination`, `activity`, `category`, `difficulty` as comma-separated IDs and `featured_priority` in shortcodes). The legacy **Show only featured trips** toggle has been retired — its behavior is now expressed by setting **Featured Priority = Featured**, and existing block instances are migrated automatically when re-opened in the editor.
* **Activity** — `yatra/activity`: same taxonomy picker pattern (All published vs search + IDs) in the sidebar; matches **`[yatra_activity]`** ID rules.
* **Destination** — `yatra/destination`: same pattern; matches **`[yatra_destination]`** ID rules.
* **Trip categories** — `yatra/trip-category` (same card layout as destinations; links use your trip category base from Settings). Sidebar picker matches **`[yatra_trip_category]`** ID rules.

**Shortcodes** (attributes shown are the main filters; all accept string values as in the plugin defaults—use `yes` / `no` or `0` / `1` where noted):

**Classification filters (`[yatra_trip]`, `[yatra_destination]`, `[yatra_activity]`, `[yatra_trip_category]`):** Shortcodes use the **same numeric ID-only rules** as the blocks above. Omit an attribute entirely or leave it **empty** to show **everything** on that dimension (equivalent to the block’s “All published”). There is **no searchable picker** in the shortcode—copy IDs from your Yatra taxonomy screens (comma-separated lists are fine).

* **`[yatra_trip]`** — Trip listing. Alias: **`[yatra_tour]`** (same output). **IDs only:** `destination`, `activity`, and `category` accept **comma-separated classification IDs** (digits). If any token in the list is non-numeric, that attribute is treated as invalid and **ignored**. Combine attributes to narrow results (**AND**). Optional: `order` (`asc` or `desc`), `featured_priority` (one of `featured`, `new`, `limited`; mirrors the trip form’s **Categorization → Featured Priority** value; empty / `none` = no filter), `featured` (back-compat alias — `featured="1"` is equivalent to `featured_priority="featured"`; if both are set, `featured_priority` wins), `per_page`, `difficulty` (comma-separated difficulty / fitness-level **IDs** from Yatra → Trips → Difficulty levels), `price_min`, `price_max`, `duration_min`, `duration_max`, `search`, `columns`, `show_pagination`, `title`. Pagination: `trip_page`. Examples: `[yatra_trip]` (all trips), `[yatra_trip destination="44" activity="12" category="8"]`, `[yatra_trip featured_priority="new" per_page="6"]`, `[yatra_trip difficulty="3,5" featured_priority="limited"]`, `[yatra_trip featured="1"]` (back-compat — same as `featured_priority="featured"`).
* **`[yatra_activity]`** — Activity listing cards. Optional filter: `activity="1,2"` (**IDs**). Other attributes: `order`, `per_page`, `columns`, `show_trip_count`, `show_description`, `show_image`, `show_pagination`, `hide_empty`, `title`. Omit **`activity`** to list activities without that restriction.
* **`[yatra_destination]`** — Destination showcase. Optional: `destination="44,45"` (**IDs**). Other attributes: `order`, `per_page`, `columns`, `show_trip_count`, `show_description`, `show_image`, `show_pagination`, `hide_empty`, `featured_only`, `title`. Omit **`destination`** for all published destinations (subject to **`hide_empty`** / **`featured_only`**).
* **`[yatra_trip_category]`** — Trip category cards (same layout as destinations). Optional: `category="8,9"` (**trip type IDs**). Other attributes: `order`, `per_page`, `columns`, `show_trip_count`, `show_description`, `show_image`, `show_pagination`, `hide_empty`, `featured_only`, `title`. Pagination: `trip_category_page`. Omit **`category`** for all categories (subject to **`hide_empty`** / **`featured_only`**).
* **`[yatra_search]`** — Advanced trip search form. Toggle parts with `show_filters`, `show_categories`, `show_destinations`, `show_activities`, `show_price_range`, `show_duration`, `show_difficulty` (yes or no), plus `placeholder` and `button_text`.
* **`[yatra_login]`** — Customer login form. Attributes include `show_register`, `show_forgot_password`, `remember_me` (yes or no), `redirect_url`, `title`, `subtitle`.
* **`[yatra_my_account]`** — Account dashboard for logged-in users (same React experience as the virtual account URL). Legacy attributes are accepted for backward compatibility but do not change the 3.x UI.
* **`[yatra_discount_and_deals]`** — Discounted trips. Attributes include `order`, `per_page`, `columns`, `discount_type` (all, percentage, fixed, or group), `min_discount`, `max_discount`, `category`, `destination`, `show_original_price`, `show_percentage`, `show_time_left`, `show_pagination`, `show_filters`, `title`. **Note:** `category` and `destination` here match **term slugs**, not numeric classification IDs (**different** from **`[yatra_trip]`** filters).

**Note:** Older Yatra 2.x docs sometimes mentioned **`[yatra_cart]`**, **`[yatra_checkout]`**, or **`[yatra_mini_cart]`**. Those shortcodes are **not registered in Yatra 3.x**—checkout and booking flow use the plugin’s front-end routes and templates instead. See **[docs.wpyatra.com](https://docs.wpyatra.com)** for URLs and page setup.

= 🎨 Compatible with popular themes =

Yatra works with most well-coded block themes, classic themes, and major page builders. **Recommended themes** (optional—not required):

* 🧳 **[Resa](https://wordpress.org/themes/resa/?ref=yatrapluginorg)** — official Yatra travel theme by MantraBrain
* 🧱 **[Blocksy](https://wordpress.org/themes/blocksy/?ref=yatrapluginorg)** — modern block theme
* ⚡ **[Kadence](https://wordpress.org/themes/kadence/?ref=yatrapluginorg)** — fast, flexible theme

= 🔗 Quick links =

* 📖 **[Documentation](https://docs.wpyatra.com/)** — installation, blocks, shortcodes, and operations
* ✨ **[All features](https://wpyatra.com/features/)** — full capability list with Free vs [Pro](https://wpyatra.com/pricing/) labels (use this instead of a separate “extensions” catalog; [Pro modules](https://wpyatra.com/pricing/) are summarized there and on 💳 **[Pricing](https://wpyatra.com/pricing/)**)
* 🎯 **[Live demo](https://demo.wpyatra.com/)** — see Yatra on a real WordPress demo
* 🆘 **[Support portal / contact](https://mantrabrain.com/contact)** — help and commercial support routing

= 💙 Join the community =

* ⭐ **[Rate Yatra five stars](https://wordpress.org/support/plugin/yatra/reviews/?filter=5)** — helps other operators find the plugin
* 💬 **[Facebook community](https://www.facebook.com/groups/yatrawordpressplugin)** — connect with other Yatra users
* 📧 **[Email support](mailto:mantrabrain@gmail.com)** — direct email for product questions
* 🐛 **[GitHub — issues & contributions](https://github.com/MantraBrain/yatra)** — bug reports and pull requests

= 🚀 Try Yatra risk-free =

* 🧪 **[Create a free demo site (WordPress Playground)](https://try.new/plugins/yatra)** — spin up a temporary WordPress with Yatra pre-installed; no local setup required

== Installation ==

🛠️ **Quick setup**

1. Install and activate **Yatra** from this screen or upload the ZIP under Plugins → Add New → Upload.
2. Complete the setup wizard (currency, basics, permalinks as prompted).
3. Add destinations and activities, then create your first trip under **Yatra → Trips**.
4. Configure **PayPal** and/or **Pay Later** under Yatra payment settings (free). Add **[Yatra Pro](https://wpyatra.com/pricing/)** when you need card gateways or [Pro modules](https://wpyatra.com/pricing/).
5. Place the booking experience on your site using Yatra templates, **blocks**, or **shortcodes** (see **🧩 Blocks and shortcodes** in the description above and [docs.wpyatra.com](https://docs.wpyatra.com)).

== Frequently Asked Questions ==

= Is Yatra free? =

Yes. The plugin on WordPress.org is free and includes the core booking stack for many operators. **[Yatra Pro](https://wpyatra.com/pricing/)** is a paid upgrade for [premium gateways](https://wpyatra.com/pricing/) and [Pro modules](https://wpyatra.com/pricing/).

= Do I need code skills? =

No for day-to-day operation. Developers can override templates and use hooks for custom workflows.

= Which payments are free vs Pro? =

**Free:** PayPal and Pay Later. **[Pro](https://wpyatra.com/pricing/):** [Stripe](https://wpyatra.com/pricing/), [Razorpay](https://wpyatra.com/pricing/), [Mollie](https://wpyatra.com/pricing/), [Paystack](https://wpyatra.com/pricing/), [Square](https://wpyatra.com/pricing/), [Authorize.Net](https://wpyatra.com/pricing/), [bank transfer](https://wpyatra.com/pricing/) (as supported for your account and region).

= Can I take bookings without charging a card immediately? =

Yes. Use **Pay Later** for offline confirmation, invoices, or pay-on-arrival flows.

= Does Yatra work with my theme? =

It works with most modern WordPress themes. Yatra ships front-end templates; your theme controls global layout and typography. For suggested pairings, see **🎨 Compatible with popular themes** in the description above.

= Are invoices and vouchers only in Pro? =

Travelers can access invoices, vouchers, and itineraries from the account area on the free plugin when your site is configured for it. [Pro](https://wpyatra.com/pricing/) expands payment choices and business modules—it does not remove core documents by default.

= How do saved trips / wishlist work? =

Saved trips appear when **[Yatra Pro](https://wpyatra.com/pricing/)** is active and **wishlist** is enabled in Yatra settings.

= Is Yatra GDPR-friendly? =

Use WordPress privacy tools together with Yatra: export or delete user-related data as required by your policy. Payment data is handled by your chosen gateways under their terms.

= Where is documentation? =

See **[docs.wpyatra.com](https://docs.wpyatra.com)** and **[wpyatra.com](https://wpyatra.com/)** for features, **[Pro](https://wpyatra.com/pricing/)**, and updates.

= Where are shortcodes and blocks documented? =

See **🧩 Blocks and shortcodes** in the description above. Full walkthroughs (pages, permalinks, checkout URLs) are in the documentation.

= Does Yatra provide cart or checkout shortcodes? =

**Not in 3.x.** Use the plugin’s booking and checkout routes and templates. Catalog, search, login, and account still have shortcodes and blocks as listed in the description.

== Screenshots ==

📷 **Screenshots** (as shown on WordPress.org)

1. Yatra dashboard inside WordPress — bookings, revenue, and quick access to daily tasks
2. Trip Creation Process — content, pricing, media, and settings in one workspace
3. Trip list & All listing page — search, filters, and status at a glance
4. Trip Booking Process — hero, itinerary, and book flow
5. Global Settings - Payment Gateways etc.
6. Traveler account — bookings, payments, and documents
 

== Changelog ==

= 3.0.4 =
* **Unicode / Cyrillic slugs (end-to-end):** `SlugHelper::generate()` now rawurldecodes percent-encoded UTF-8 and uses `mb_strtolower` with a Unicode-aware regex (`\pL\pN`), so Cyrillic / CJK trip, destination, activity, and category slugs round-trip cleanly through validators and pretty-permalink routing. `ActivityValidator`, `DestinationValidator`, and `TripValidator` now route raw user input through `SlugHelper` instead of `sanitize_title` (which stripped non-ASCII characters down to a single dash). `PrettyRouteMatcher` decodes captured slugs the same way before lookup, so a URL like `/trip/токио/` resolves correctly.
* **Pricing — single source of truth:** `create_booking` now uses `CalculationService::calculateFromSession` as its primary path, so the sidebar pricing summary, the AJAX summary refresh, and the actual amount sent to the payment gateway are all driven by the same code. The calculation result exposes `unit_price_before_dp`, `dp_total_adjustment`, `category_prices_post_dp`, and a `dynamic_pricing` breakdown so templates can render a clean "Trip Pricing → Services → Itinerary → Dynamic Pricing → Discount" stack with no double-counting and no sidebar/payment drift.
* **Pricing summary — UI cleanup:** services render as compact rows above Trip Subtotal (matching the traveler-row style instead of a separate card), Dynamic Pricing renders as one consolidated line (no "1 rule applied" caption), and service descriptions surface via a CSS `data-tooltip` hover (no native `title` attribute, no info-icon clutter). The duplicate-traveler bug (1 selected showing as 2) is fixed in `formDataToObject`'s handling of `name[]` array notation.
* **Coupon UI persistence:** `remove_coupon` now writes back via `yatra_set_booking_session()` so the transient stays in sync, and the applied-coupon row's visible state is server-rendered on first paint — the Remove button is now visible after a page refresh.
* **Session management:** `yatra_set_booking_session()` writes to both `$_SESSION` and a transient keyed by a `booking_token` in the URL, and `yatra_get_booking_session()` falls back to the transient when REST endpoints arrive without `PHPSESSID`. Service toggles, summary refresh, coupon apply / remove, and create-booking all resolve the same cart regardless of how the request authenticated.
* **Mobile sticky bar:** the sticky-bottom booking widget's flatpickr / traveler-sync JavaScript is extracted into `assets/js/single-trip-sidebar.js` so it can no longer be mangled by WordPress's `convert_chars` content filter (which previously rewrote `&&` operators inside inline scripts as `&#038;&#038;` and broke the bar on some themes).
* **FSE / block-theme support:** new `Yatra\Core\Template\FseTemplates` + `Yatra\Core\Routing\PageContext` provide a proper handoff between page handlers and the renderer so single-trip, booking, account, and confirmation pages render correctly inside the FSE template canvas.
* **Custom trip tab:** new `templates/partials/single-trip/content-custom.php` lets an admin-defined "Custom" frontend tab render through the same `yatra_render_tab_icon()` pipeline as the built-in tabs.
* **Pro toggle scaffolding:** Settings → Booking now has **"Show available dates as a dropdown"** with a PRO badge. The setting key (`date_picker_as_dropdown`) and free-side filter contract (`yatra_use_date_dropdown`, `yatra_single_trip_date_dropdown_options`) live in the free plugin; the actual behavior (gate, option-builder, flexible-trip date synthesis) is contributed by the corresponding Yatra Pro module.
* **i18n / Loco Translate:** `Bootstrap::loadTextDomain()` now installs a `load_script_translation_file` filter that falls back to `WP_LANG_DIR/loco/plugins/` for `.json` script-translation files. This mirrors the existing `.mo` fallback so React surfaces (account page, admin app, blocks) pick up Loco-managed translations from Loco's standard private workspace.
* **CI / DevOps:** the PHP-lint pipeline's silent-failure bug (subshell counter in `find | while`) is fixed; `xargs -0 -P 4 php -l` now aggregates failures correctly. Added `concurrency`, least-privilege `permissions: contents: read`, and `timeout-minutes` to every job; `composer validate --strict` moved before `composer install`; debug noise and the inline AI-report preamble removed from `$GITHUB_STEP_SUMMARY`.
* Safe to update from 3.0.3.

= 3.0.3 =
* **Shortcodes:** **`[yatra_trip_category]`** — lists trip categories in the same card layout as destinations, with optional filters, pagination (`trip_category_page`), and AJAX-friendly behavior (see `TripCategoryShortcode` + `TripCategoryShortcodeAjax`).
* **Shortcodes / blocks (`[yatra_trip]`, Trip block):** **Featured Priority** filter (`featured_priority` = `featured` / `new` / `limited`; mirrors the trip form's *Categorization → Featured Priority*) and **Difficulty / fitness-level** filter (`difficulty="3,5"`) are now first-class attributes. Legacy `featured="1"` is retained as a back-compat alias for `featured_priority="featured"` (`featured_priority` wins if both are set). Centralised in `TripListingFilterBuilder` so the same rules apply to both shortcode and block inputs.
* **Trip block:** retired the legacy *Show only featured trips* toggle in favor of the unified **Featured Priority** dropdown; existing block instances saved with `featured: true` are auto-migrated to `featured_priority: "featured"` when reopened in the editor. Inserter title and labels read **Trip** (registered block name `yatra/tour` is preserved for back-compat with saved posts).
* **Cards (Destination / Activity / Trip Category — shortcodes + blocks):** the whole card is now a click target instead of just the title text. Implemented via the WAI-ARIA "stretched link" pattern (CSS pseudo-element on the existing title `<a>`) so a single canonical link is exposed to screen readers and crawlers; keyboard focus shows a card-wide outline.
* **Enquiry emails:** `{{trip_name}}` (and other trip merge tags) now resolve correctly when an enquiry is submitted from a single-trip page. The modal posts `trip_id` / `trip_slug` reliably; backend normalizes `tripId` casing and derives `trip_id` from slug or `HTTP_REFERER` when missing; `EnquiryService` now eager-loads joined trip data before firing `yatra_enquiry_created` so admin templates and Pro automation receive a complete object. Merge-tag regex now tolerates surrounding whitespace (`{{ trip_name }}`).
* **Payments admin (Add / Edit Payment):** the *Booking ID* text field is replaced with a searchable **booking picker** that queries `GET /yatra/v1/bookings?search=…` and matches against booking code (reference), customer name, and email — debounced server-side search with rich rows (code, customer, trip, email). The *Payment Date* field now uses the shared admin `DatePicker` for visual parity with every other date field in the admin and prevents future-dated payments by default.
* **Upgrades:** version-gated Free upgrade runner; legacy payment tokens table dropped when applicable (see `Upgrade_3_0_3`).
* **Discounts:** REST and repository hardening (writable column whitelist; safer updates).
* **Single trip:** group discount discoverability in the sidebar; **Similar trips** links respect plain permalinks via `yatra_get_trip_permalink()`; enquiry modal **Send Enquiry** uses `yatra-booking-button` so primary color matches **Check Availability** and global `--yatra-primary` tokens.
* **Admin / i18n:** Trip Builder meal plan strings use shared labels; attribute icon picker preserves Font Awesome `provider` after save; front-end Important Info shows translated meal plan labels (`yatra_meal_plan_label()`).
* Safe to update from 3.0.2.x.

= 3.0.2.9 =
* **Mobile booking bar:** Improved sticky booking UI on small screens (date + travelers layout, full-width travelers dropdown opening upward, and reliable click targets).
* **Admin caching:** Fixed service cache invalidation so updates (including SEO fields) reflect immediately when cache is enabled.
* Safe to update from 3.0.2.8.

= 3.0.2.8 =
* **Booking UI:** Added Advanced settings to select **Terms & Conditions** and **Privacy Policy** pages; booking form now links to these pages (Privacy falls back to WordPress Settings → Privacy when unset).
* **Fix (Usage Tracking):** Moved `StatsUsage` into `app/Services` and updated references to avoid case-sensitive autoload issues on Linux hosts.
* **Fix (Gallery Modal):** Hardened gallery modal image URL resolution against LiteSpeed Cache lazy-load placeholders.
* Safe to update from 3.0.2.7.

= 3.0.2.7 =
* **Fix (Gallery Modal):** Improved compatibility with LiteSpeed Cache lazy-load placeholders (base64 `src`) so the modal always opens the real image URLs.
* **Compat (LiteSpeed Cache):** Excluded Yatra hero/gallery selectors from LiteSpeed lazy-load and excluded Yatra trip assets from optimisation where needed.
* Safe to update from 3.0.2.6.

= 3.0.2.6 =
* **Fix:** Composer autoload path was declared as `includes/Admin/` (uppercase) but the directory on disk is `includes/admin/` (lowercase); caused fatal `include` warnings on Linux/cPanel servers (case-sensitive filesystems).
* **License:** Removed stub `LicenseController` from the free plugin — all `/yatra/v1/license/*` routes are now registered exclusively by Yatra Pro's own controller, eliminating any route conflicts.
* **Admin UI (Additional Services):** Added missing **Add New Service** button via the `PageHeader` component on the Additional Services screen.
* Safe to update from 3.0.2.5.

= 3.0.2.5 =
* Admin: add Review + Upgrade notices (React UI + WordPress notices) with smart dismiss scheduling.
* Setup wizard: save step settings when navigating between steps.

= 3.0.2.4 =
* **REST:** implemented **`TripService::permanentDelete()`** so **`DELETE /yatra/v1/trips/{id}/permanent-delete`** no longer fatals (fixes permanent delete from trash and bulk actions).
* **Admin (React):** bulk trip actions rely on **`BulkActionToolbar`** confirmation only (removed duplicate **`window.confirm`**); improved bulk dialog copy for **`mark_*`** actions.
* Safe to update from 3.0.2.3.

= 3.0.2.3 =
* **Admin (React):** moved fullscreen shell CSS into the document **head** to reduce wp-admin chrome flicker; added HTML/CSS **boot splash** and **`modulepreload`** for the admin bundle; primary **sidebar navigation** uses client-side URL updates so the PHP loading state does not repeat on every screen change.
* **REST:** registered **License** routes in the API registry so **`GET /yatra/v1/license`** works on the free plugin (License screen and scripts that probe it).
* **Admin UI:** hardened **Departures** and **Availability** trip dropdowns against **TanStack Query** cache shapes and `/trips` list payloads (fixes `map` / `find` errors when navigating without a full reload).
* Safe to update from 3.0.2.2.

= 3.0.2.2 =
* Maintenance / patch release. Safe to update from 3.0.2.1.

= 3.0.2.1 =
* **Readme (WordPress.org):** linked **Pro** gateways, modules, traveler features, and related mentions to **[wpyatra.com/pricing](https://wpyatra.com/pricing/)** throughout the long description, FAQ, and quick links.
* Patch release; safe to update from 3.0.2.

= 3.0.2 =
* **Readme (WordPress.org):** reorganized the long description — the **Yatra Pro** section now appears **before** **Blocks and shortcodes** for a clearer Free → Pro → integration flow.
* Documentation-only release for the plugin directory listing; no code changes required for existing 3.0.x sites.

= 3.0.1 =
* Maintenance release: updated WordPress.org **banner** and directory **assets** (including screenshots) for the 3.x listing.
* **Readme:** shortened the plugin short description to meet WordPress.org’s **150-character** limit so imports are no longer truncated.
* Minor fixes and polish; see [wpyatra.com](https://wpyatra.com/) for release notes.

= 3.0.0 =
* Major 3.0 release: redesigned admin experience, streamlined booking and traveler account flows, expanded gateway and module architecture for Pro, and ongoing hardening for production travel sites.
* See the plugin’s release notes and [wpyatra.com](https://wpyatra.com/yatra-3-0/) for highlights. **Always back up** before upgrading from 2.x; follow migration guidance in documentation.

= Earlier versions =
* For 2.x changelog entries, see the plugin’s GitHub releases or historical notes on the vendor site.

== Upgrade Notice ==

= 3.0.4 =
Release **3.0.4** — Unicode / Cyrillic slug support end-to-end, pricing single-source-of-truth (sidebar = payment-gateway amount), pricing summary cleanup, services dedupe fix, Loco script-translation fallback so React surfaces (account page, admin) pick up `.json` translations from Loco's workspace, mobile sticky-bar JS extraction, FSE template support, and CI pipeline fixes. Safe to update from 3.0.3.

= 3.0.3 =
Release **3.0.3** (`[yatra_trip_category]` shortcode, versioned upgrades, discounts, single-trip and admin polish). Safe to update from 3.0.2.x.

= 3.0.2.5 =
Maintenance release (setup wizard autosave, admin notices). Safe to update from 3.0.2.4.

= 3.0.2.4 =
Bugfix release (trip permanent-delete REST endpoint, bulk trip confirmation UX). Safe to update from 3.0.2.3.

= 3.0.2.3 =
Maintenance update (admin UX, REST license route, trip list stability in Departures/Availability). Safe to update from 3.0.2.2.

= 3.0.2.2 =
Patch release. Safe to update from 3.0.2.1.

= 3.0.2.1 =
Readme update (Pro feature links to pricing). Safe to update from 3.0.2.

= 3.0.2 =
Readme / documentation listing update only. Safe to update from 3.0.1.

= 3.0.1 =
Maintenance update (banner, WordPress.org readme/assets, and small fixes). Safe to update from 3.0.0.

= 3.0.0 =
Major release. Back up your site and database before upgrading from 2.x. Update free Yatra from WordPress.org first; then align **[Yatra Pro](https://wpyatra.com/pricing/)** with a version compatible with 3.0.

== Additional Information ==

= Privacy =

Booking and customer data are stored in your WordPress database. Payment processing is performed by the gateways you enable; review each provider’s privacy and PCI documentation.

= Credits =

Yatra is developed by **MantraBrain**. Third-party libraries include components such as React (admin UI), Vite, TanStack Query, and others as shipped in the plugin package.

= Contributing =

Issues and contributions: [GitHub — Yatra](https://github.com/MantraBrain/yatra)

If Yatra helps your business, a ⭐ **five-star review** on WordPress.org and considering **💎 [Yatra Pro](https://wpyatra.com/pricing/)** when you need paid features both help sustain development. Thank you for using Yatra.
