# Changelog

All notable changes to this project are documented here. The WordPress.org–canonical history lives in **`readme.txt`** under **Changelog**; this file mirrors recent releases for GitHub and tooling.

## [3.0.3] — 2026-05-03

- **Shortcodes:** `[yatra_trip_category]` — trip category grid (destination-style cards), filters, `trip_category_page` pagination, and AJAX support (`TripCategoryShortcode`, `TripCategoryShortcodeAjax`).
- **Upgrades:** version-gated Free upgrade runner; legacy payment tokens table dropped when applicable (`Upgrade_3_0_3`).
- **Discounts:** REST and repository hardening (writable column whitelist; safer updates).
- **Single trip:** group discount discoverability in the sidebar; **Similar trips** links respect plain permalinks via `yatra_get_trip_permalink()`; enquiry modal **Send Enquiry** uses `yatra-booking-button` for primary CTA styling aligned with **Check Availability**.
- **Admin / i18n:** Trip Builder meal plan labels centralized; attribute icon picker preserves Font Awesome `provider` after save; front-end Important Info uses translated meal plan labels (`yatra_meal_plan_label()`).
