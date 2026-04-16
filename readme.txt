=== Yatra - Travel Booking & Tour Management ===
Contributors: MantraBrain
Tags: travel, booking, tour, travel agency, tour booking
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 3.0.2.5
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

**Traveler experience**

* [Saved trips / wishlist](https://wpyatra.com/pricing/) when [Yatra Pro](https://wpyatra.com/pricing/) is active and wishlist is enabled in settings

**Support**

* [Premium or priority support](https://wpyatra.com/pricing/) depending on plan; see [wpyatra.com](https://wpyatra.com/) for current terms and **money-back window** for paid licenses.

= 🧩 Blocks and shortcodes =

Use the **block editor** or **classic shortcodes** to drop catalog widgets, search, and account UI into any page.

**Blocks** (search the inserter for “Yatra” or the block name):

* **Tour** — block name `yatra/tour` (trip grid; same data options as the **`[yatra_trip]`** shortcode).
* **Activity** — `yatra/activity`.
* **Destination** — `yatra/destination`.

**Shortcodes** (attributes shown are the main filters; all accept string values as in the plugin defaults—use `yes` / `no` or `0` / `1` where noted):

* **`[yatra_trip]`** — Trip listing. Alias: **`[yatra_tour]`** (same output; kept for backward compatibility). Useful attributes include `order` (asc or desc), `featured` (0 or 1), `per_page`, `category`, `destination`, `activity`, `difficulty`, `price_min`, `price_max`, `duration_min`, `duration_max`, `search`, `columns`, `show_pagination` (yes or no), `title`. Example: `[yatra_trip featured="1" per_page="6" columns="3"]`
* **`[yatra_activity]`** — Activity archive-style listing. Attributes include `order`, `per_page`, `columns`, `activity` (slug or comma-separated slugs), `show_trip_count`, `show_description`, `show_image`, `show_pagination`, `hide_empty` (yes or no), `title`.
* **`[yatra_destination]`** — Destination showcase. Attributes include `order`, `per_page`, `columns`, `destination` (slug or comma-separated slugs), `show_trip_count`, `show_description`, `show_image`, `show_pagination`, `hide_empty`, `featured_only` (yes or no), `title`.
* **`[yatra_search]`** — Advanced tour search form. Toggle parts with `show_filters`, `show_categories`, `show_destinations`, `show_activities`, `show_price_range`, `show_duration`, `show_difficulty` (yes or no), plus `placeholder` and `button_text`.
* **`[yatra_login]`** — Customer login form. Attributes include `show_register`, `show_forgot_password`, `remember_me` (yes or no), `redirect_url`, `title`, `subtitle`.
* **`[yatra_my_account]`** — Account dashboard for logged-in users (same React experience as the virtual account URL). Legacy attributes are accepted for backward compatibility but do not change the 3.x UI.
* **`[yatra_discount_and_deals]`** — Discounted trips. Attributes include `order`, `per_page`, `columns`, `discount_type` (all, percentage, fixed, or group), `min_discount`, `max_discount`, `category`, `destination`, `show_original_price`, `show_percentage`, `show_time_left`, `show_pagination`, `show_filters`, `title`.

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
