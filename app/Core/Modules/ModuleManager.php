<?php

declare(strict_types=1);

namespace Yatra\Core\Modules;

/**
 * Module Manager
 * Handles module definitions and persistence via wp_options
 */
class ModuleManager
{
    private const OPTION_KEY = 'yatra_modules';
    private const DEFAULT_VIDEO_URL = 'https://youtu.be/cHmC-x7y0TQ';

    /**
     * Ensure option exists with defaults
     */
    public static function initializeDefaults(): void
    {
        if (get_option(self::OPTION_KEY) === false) {
            $defaults = [];
            $timestamp = current_time('mysql');

            foreach (self::getDefaultModules() as $module) {
                $defaults[$module['slug']] = [
                    'enabled' => !empty($module['enabled']),
                    'updated_at' => $timestamp,
                ];
            }

            add_option(self::OPTION_KEY, $defaults);
        }
    }

    /**
     * Get default module definitions
     */
    public static function getDefaultModules(): array
    {
        $modules = [
            [
                'slug' => 'google_calendar',
                'name' => __('Google Calendar Integration', 'yatra'),
                'description' => __('Automatically sync bookings and departures to Google Calendar. Keep travelers informed with calendar invitations. Perfect integration for managing your travel schedule.', 'yatra'),
                'category' => __('Integrations', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/google-calendar',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=google-calendar',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['integrations', 'calendar', 'automation'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-google-calendar',
            ],
            [
                'slug' => 'additional_services',
                'name' => __('Additional Services', 'yatra'),
                'description' => __('Offer optional add-ons like airport transfers, travel insurance, and equipment rental. Increase revenue per booking with valuable extras travelers want. Enhance complete trip experience for your customers.', 'yatra'),
                'category' => __('Sales', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/additional-services',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=additional-services',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['upsell', 'services', 'add-ons', 'extras'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-additional-services',
            ],
            [
                'slug' => 'trip_consent',
                'name' => __('Trip Consent', 'yatra'),
                'description' => __('Collect digital consent forms and signatures from travelers before their trip. Includes liability waivers and health declarations. Ensure legal compliance and protect your business.', 'yatra'),
                'category' => __('Operations', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/trip-consent',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=trip-consent',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['consent', 'waiver', 'signature', 'forms', 'legal'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-trip-consent',
            ],
            [
                'slug' => 'email_automation',
                'name' => __('Email Automation', 'yatra'),
                'description' => __('Adds the full automation template library (database), sequences, and send logs on the Email screen. Everyone already gets Delivery settings plus the four core customer templates (booking, payment, cancellation, reminder) without this module.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/email-automation',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=email-automation',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['email', 'automation', 'templates', 'marketing', 'notifications'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'email-automation',
            ],
            [
                'slug' => 'dynamic_form_field',
                'name' => __('Dynamic Form Field', 'yatra'),
                'description' => __('Customize booking form fields with drag-and-drop builder. Add custom fields for traveler information and emergency contacts. Create the perfect booking experience for your customers.', 'yatra'),
                'category' => __('Bookings', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/dynamic-form-field',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=dynamic-form-field',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['form', 'booking', 'customization', 'fields', 'builder'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-settings',
            ],
            [
                'slug' => 'advanced_discount',
                'name' => __('Advanced Discount', 'yatra'),
                'description' => __('Create group discounts that auto-apply based on traveler count. Combine promo codes with group savings for maximum flexibility and conversion optimization.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/advanced-discount',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=advanced-discount',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['discount', 'group', 'promo', 'coupon', 'marketing'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
            ],
            [
                'slug' => 'mailchimp',
                'name' => __('Mailchimp Integration', 'yatra'),
                'description' => __('Automatically sync customers to Mailchimp lists when they book. Add tags based on trips booked. Build targeted email campaigns and nurture leads effectively.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/mailchimp',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=mailchimp',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['email', 'marketing', 'mailchimp', 'automation', 'integration'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-mailchimp',
            ],
            [
                'slug' => 'facebook_pixel',
                'name' => __('Facebook Pixel', 'yatra'),
                'description' => __('Track booking conversions with Facebook Pixel. Retarget visitors who viewed trips. Optimize ad campaigns with accurate conversion data and build lookalike audiences.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/facebook-pixel',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=facebook-pixel',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['facebook', 'pixel', 'tracking', 'ads', 'retargeting', 'marketing'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-facebook-pixel',
            ],
            [
                'slug' => 'google_analytics',
                'name' => __('Google Analytics 4 Enhanced', 'yatra'),
                'description' => __('Enhanced e-commerce tracking for GA4. Track view_item, begin_checkout, and purchase events. Server-side tracking via Measurement Protocol for accurate conversion data.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/google-analytics',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=google-analytics',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['google', 'analytics', 'ga4', 'tracking', 'ecommerce', 'marketing'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-google-analytics',
            ],
            [
                'slug' => 'flexible_payments',
                'name' => __('Flexible Payments', 'yatra'),
                'description' => __('Enable deposit and partial payment options for bookings. Allow customers to pay a percentage upfront and the rest later. Perfect for high-value trips and improving conversion rates.', 'yatra'),
                'category' => __('Payments', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/flexible-payments',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=flexible-payments',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['payments', 'deposit', 'partial', 'installments', 'booking'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-settings',
            ],
            [
                'slug' => 'scheduled_payments',
                'name' => __('Scheduled Payments', 'yatra'),
                'description' => __('Automatically schedule the remaining booking balance after a partial or deposit payment. Uses your payment gateway (e.g. Stripe) to invoice or charge on the dates you configure.', 'yatra'),
                'category' => __('Payments', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/scheduled-payments',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=scheduled-payments',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['payments', 'installments', 'balance', 'stripe', 'automation'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-settings',
            ],
            [
                'slug' => 'dynamic_pricing',
                'name' => __('Dynamic Pricing', 'yatra'),
                'description' => __('Automatically adjust trip prices based on demand, seasonality, early bird discounts, and last-minute deals. Maximize revenue with intelligent pricing rules that respond to booking patterns.', 'yatra'),
                'category' => __('Sales', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/dynamic-pricing',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=dynamic-pricing',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['pricing', 'revenue', 'automation', 'discounts', 'sales'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'dynamic-pricing',
            ],
            [
                'slug' => 'custom_landing_pages',
                'name' => __('Custom Landing Pages', 'yatra'),
                'description' => __('Point destinations, activities, and trip types to any WordPress page. Use your page builder and Yatra shortcodes on that page; catalog links and redirects use the page URL when the module is enabled.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.wpyatra.com/modules/custom-landing-pages',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=custom-landing-pages',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['seo', 'landing', 'page-builder', 'destinations', 'taxonomy'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'yatra-settings',
            ],
            [
                'slug' => 'abandoned_booking_recovery',
                'name' => __('Abandoned Booking Recovery', 'yatra'),
                'description' => __('Recover lost sales by automatically tracking abandoned bookings and sending targeted email sequences. Win back customers who left before completing their purchase.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/abandoned-booking-recovery',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=abandoned-booking-recovery',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['recovery', 'email', 'automation', 'marketing', 'conversion'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'settings_page' => 'abandoned-recovery',
            ],
            [
                'slug' => 'white_label',
                'name' => __('White Label', 'yatra'),
                'description' => __('Fully rebrand Yatra as your own product. Replace the plugin name, logo, author, support URL, and email/PDF branding shown to clients. Available exclusively on the Agency plan.', 'yatra'),
                'category' => __('Agency', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/white-label',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=white-label',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['branding', 'agency', 'whitelabel', 'rebrand'],
                'video_url' => self::DEFAULT_VIDEO_URL,
                'requires_pro' => true,
                'requires_agency' => true,
                'settings_page' => 'white-label',
            ],
        ];
        
        return apply_filters('yatra_default_modules', $modules);
    }

    /**
     * Get modules merged with stored option state
     */
    public static function getModules(): array
    {
        // Get enable/disable status ONLY from database
        $stored_status = get_option(self::OPTION_KEY, []);
        $stored_status = is_array($stored_status) ? $stored_status : [];

        // Get module definitions ONLY from hardcoded array
        $modules = self::getDefaultModules();
        
        $result = [];
        foreach ($modules as $module) {
            $slug = $module['slug'];
            
            // Get enable/disable status from database only
            $enabled = isset($stored_status[$slug]['enabled'])
                ? (bool) $stored_status[$slug]['enabled']
                : (bool) ($module['enabled'] ?? false);

            // Check if module is available (can be enabled)
            $is_available = true;
            if (!empty($module['requires_pro'])) {
                $pro_active = apply_filters('yatra_is_pro_active', false);
                if ($pro_active) {
                    // Check if this module is available in Pro
                    $available_modules = apply_filters('yatra_pro_available_modules', []);
                    $is_available = in_array($slug, $available_modules, true);
                } else {
                    $is_available = false;
                }
            }

            // Agency-tier-only modules require both Pro AND an Agency license.
            if ($is_available && !empty($module['requires_agency'])) {
                $is_available = (bool) apply_filters('yatra_is_agency_active', false);
            }

            // Plan badge: 'agency' for Agency-only, 'personal' for any other
            // Pro module, 'free' for core. Surfaced on the Modules page.
            if (!empty($module['requires_agency'])) {
                $plan = 'agency';
            } elseif (!empty($module['requires_pro'])) {
                $plan = 'personal';
            } else {
                $plan = 'free';
            }

            $result[] = array_merge($module, [
                'enabled' => $enabled,
                'updated_at' => $stored_status[$slug]['updated_at'] ?? null,
                'is_available' => $is_available,
                'plan' => $plan,
            ]);
        }

        return $result;
    }

    /**
     * Check if module is enabled
     */
    public static function isModuleEnabled(string $slug): bool
    {
        // Allow direct override for specific modules
        $override = apply_filters('yatra_module_enabled_status', null, $slug);
        if ($override !== null) {
            return (bool) $override;
        }
        
        $modules = self::getModules();
        foreach ($modules as $module) {
            if ($module['slug'] === $slug) {
                // Check if module requires Pro and if Pro is active
                if (!empty($module['requires_pro'])) {
                    $pro_active = apply_filters('yatra_is_pro_active', false);
                    if (!$pro_active) {
                        return false;
                    }
                }

                // Agency-tier-only modules also need an Agency license — a
                // toggle stuck "on" must not keep working after a downgrade.
                if (!empty($module['requires_agency'])) {
                    if (!apply_filters('yatra_is_agency_active', false)) {
                        return false;
                    }
                }

                return (bool) $module['enabled'];
            }
        }

        return false;
    }

    /**
     * Check if module is available (can be enabled)
     */
    public static function isModuleAvailable(string $slug): bool
    {
        // Allow direct override for specific modules
        $override = apply_filters('yatra_module_is_available_' . $slug, null);
        if ($override !== null) {
            return (bool) $override;
        }

        $modules = self::getModules();
        foreach ($modules as $module) {
            if ($module['slug'] === $slug) {
                // If module requires Pro, check if Pro is active
                if (!empty($module['requires_pro'])) {
                    // Check if Pro is active
                    $pro_active = apply_filters('yatra_is_pro_active', false);
                    if (!$pro_active) {
                        return false;
                    }

                    // Check if this module is available in Pro
                    $available_modules = apply_filters('yatra_pro_available_modules', []);
                    if (!in_array($slug, $available_modules, true)) {
                        return false;
                    }
                }

                if (!empty($module['requires_agency'])) {
                    return (bool) apply_filters('yatra_is_agency_active', false);
                }

                return true;
            }
        }

        return false;
    }

    /**
     * Update module enabled state
     */
    public static function setModuleStatus(string $slug, bool $enabled): array
    {
        $modules = get_option(self::OPTION_KEY, []);
        $modules = is_array($modules) ? $modules : [];

        $modules[$slug] = array_merge($modules[$slug] ?? [], [
            'enabled' => $enabled,
            'updated_at' => current_time('mysql'),
        ]);

        update_option(self::OPTION_KEY, $modules);

        // Trigger module activation/deactivation hook
        if ($enabled) {
            do_action('yatra_module_active', $slug);
        } else {
            do_action('yatra_module_deactive', $slug);
        }

        return self::getModules();
    }

    /**
     * Update multiple modules at once
     *
     * @param array<array{slug:string, enabled:bool}> $items
     */
    public static function setMultipleStatuses(array $items): array
    {
        if (empty($items)) {
            return self::getModules();
        }

        $modules = get_option(self::OPTION_KEY, []);
        $modules = is_array($modules) ? $modules : [];
        $timestamp = current_time('mysql');

        foreach ($items as $item) {
            if (empty($item['slug'])) {
                continue;
            }

            $slug = sanitize_key($item['slug']);
            $enabled = (bool) ($item['enabled'] ?? false);

            $modules[$slug] = array_merge($modules[$slug] ?? [], [
                'enabled' => $enabled,
                'updated_at' => $timestamp,
            ]);
        }

        update_option(self::OPTION_KEY, $modules);

        // Trigger module activation/deactivation hooks for bulk updates
        foreach ($items as $item) {
            if (empty($item['slug'])) {
                continue;
            }
            
            $slug = sanitize_key($item['slug']);
            $enabled = (bool) ($item['enabled'] ?? false);
            
            if ($enabled) {
                do_action('yatra_module_active', $slug);
            } else {
                do_action('yatra_module_deactive', $slug);
            }
        }

        return self::getModules();
    }
}
