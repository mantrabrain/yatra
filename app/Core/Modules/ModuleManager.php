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
        return [
            [
                'slug' => 'partial_payments',
                'name' => __('Partial Payments', 'yatra'),
                'description' => __('Allow travelers to pay deposits and settle the remaining balance later.', 'yatra'),
                'category' => __('Payments', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/partial-payments',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['payments', 'checkout'],
            ],
            [
                'slug' => 'activity_addons',
                'name' => __('Activity Add-ons', 'yatra'),
                'description' => __('Upsell optional add-ons (meals, gear, transfers) during trip booking.', 'yatra'),
                'category' => __('Sales', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/activity-addons',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['upsell', 'activities'],
            ],
            [
                'slug' => 'cross_sell_recommendations',
                'name' => __('Cross-sell Recommendations', 'yatra'),
                'description' => __('Show personalized cross-sell bundles based on traveler preferences.', 'yatra'),
                'category' => __('Sales', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/cross-sell-recommendations',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['sales', 'personalization'],
            ],
            [
                'slug' => 'tiered_pricing',
                'name' => __('Tiered Pricing Rules', 'yatra'),
                'description' => __('Define automatic tiered pricing based on group size or lead time.', 'yatra'),
                'category' => __('Sales', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/tiered-pricing',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['sales', 'pricing'],
            ],
            [
                'slug' => 'guide_portal',
                'name' => __('Guide Portal', 'yatra'),
                'description' => __('Provide guides with access to their upcoming departures and traveler details.', 'yatra'),
                'category' => __('Operations', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/guide-portal',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['operations', 'departures'],
            ],
            [
                'slug' => 'custom_booking_forms',
                'name' => __('Custom Booking Forms', 'yatra'),
                'description' => __('Build multi-step booking forms with conditional fields and validation.', 'yatra'),
                'category' => __('Bookings', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/custom-booking-forms',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['forms', 'booking'],
            ],
            [
                'slug' => 'loyalty_rewards',
                'name' => __('Loyalty & Rewards', 'yatra'),
                'description' => __('Reward repeat travelers with loyalty points redeemable on future trips.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/loyalty-rewards',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['marketing', 'customers'],
            ],
            [
                'slug' => 'inventory_sync',
                'name' => __('Inventory Sync', 'yatra'),
                'description' => __('Sync availability with external CRMs and OTA partners automatically.', 'yatra'),
                'category' => __('Integrations', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/inventory-sync',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=inventory-sync',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['integrations', 'automation'],
            ],
            [
                'slug' => 'payment_plans',
                'name' => __('Payment Plans', 'yatra'),
                'description' => __('Offer flexible installment schedules with automated reminders.', 'yatra'),
                'category' => __('Payments', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/payment-plans',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=payment-plans',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['payments', 'billing'],
            ],
            [
                'slug' => 'currency_switcher',
                'name' => __('Multi-Currency Switcher', 'yatra'),
                'description' => __('Display live exchange rates and allow checkout in local currencies.', 'yatra'),
                'category' => __('Payments', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/currency-switcher',
                'is_premium' => true,
                'purchase_url' => 'https://wpyatra.com/pricing?module=currency-switcher',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['payments', 'currency'],
            ],
            [
                'slug' => 'marketing_automation',
                'name' => __('Marketing Automation', 'yatra'),
                'description' => __('Send drip campaigns, cart abandonment emails, and targeted offers.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/marketing-automation',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['marketing', 'automation'],
            ],
            [
                'slug' => 'affiliate_portal',
                'name' => __('Affiliate Portal', 'yatra'),
                'description' => __('Track referrals, payouts, and provide assets to resellers.', 'yatra'),
                'category' => __('Marketing', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/affiliate-portal',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['affiliate', 'sales'],
            ],
            [
                'slug' => 'operations_dashboard',
                'name' => __('Operations Dashboard', 'yatra'),
                'description' => __('Monitor departures, guide assignments, and logistics KPIs in real time.', 'yatra'),
                'category' => __('Operations', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/operations-dashboard',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['operations', 'analytics'],
            ],
            [
                'slug' => 'resource_scheduler',
                'name' => __('Resource Scheduler', 'yatra'),
                'description' => __('Allocate vehicles, equipment, and staff with drag-and-drop calendars.', 'yatra'),
                'category' => __('Operations', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/resource-scheduler',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['operations', 'resources'],
            ],
            [
                'slug' => 'crm_sync',
                'name' => __('CRM Sync', 'yatra'),
                'description' => __('Two-way sync with HubSpot, Zoho, and Salesforce contacts.', 'yatra'),
                'category' => __('Integrations', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/crm-sync',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['integrations', 'crm'],
            ],
            [
                'slug' => 'api_access',
                'name' => __('Developer API Access', 'yatra'),
                'description' => __('Expose secure REST endpoints and webhooks for third-party apps.', 'yatra'),
                'category' => __('Integrations', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/developer-api-access',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['developers', 'api'],
            ],
            [
                'slug' => 'waitlist_manager',
                'name' => __('Waitlist Manager', 'yatra'),
                'description' => __('Capture interest for sold-out dates and auto-notify when seats open.', 'yatra'),
                'category' => __('Bookings', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/waitlist-manager',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['bookings', 'automation'],
            ],
            [
                'slug' => 'traveler_portal',
                'name' => __('Traveler Portal', 'yatra'),
                'description' => __('Let guests manage documents, payments, and trip updates in one place.', 'yatra'),
                'category' => __('Bookings', 'yatra'),
                'docs_url' => 'https://docs.yatra.com/modules/traveler-portal',
                'is_core' => false,
                'enabled' => false,
                'tags' => ['bookings', 'self-service'],
            ],
        ];
    }

    /**
     * Get modules merged with stored option state
     */
    public static function getModules(): array
    {
        $stored = get_option(self::OPTION_KEY, []);
        $stored = is_array($stored) ? $stored : [];

        $modules = [];
        foreach (self::getDefaultModules() as $module) {
            $slug = $module['slug'];
            $state = $stored[$slug] ?? [];

            $enabled = isset($state['enabled'])
                ? (bool) $state['enabled']
                : (bool) ($module['enabled'] ?? false);

            $modules[] = array_merge($module, [
                'enabled' => $enabled,
                'updated_at' => $state['updated_at'] ?? null,
            ]);
        }

        // Include any custom modules saved in options but not part of defaults
        foreach ($stored as $slug => $state) {
            $exists = array_filter($modules, static fn ($module) => $module['slug'] === $slug);
            if (!$exists) {
                $modules[] = [
                    'slug' => $slug,
                    'name' => $state['name'] ?? ucfirst(str_replace('_', ' ', $slug)),
                    'description' => $state['description'] ?? '',
                    'category' => $state['category'] ?? __('Custom', 'yatra'),
                    'version' => $state['version'] ?? '1.0.0',
                    'is_core' => (bool) ($state['is_core'] ?? false),
                    'enabled' => (bool) ($state['enabled'] ?? false),
                    'tags' => $state['tags'] ?? [],
                    'updated_at' => $state['updated_at'] ?? null,
                ];
            }
        }

        return $modules;
    }

    /**
     * Check if module is enabled
     */
    public static function isModuleEnabled(string $slug): bool
    {
        $modules = self::getModules();
        foreach ($modules as $module) {
            if ($module['slug'] === $slug) {
                return (bool) $module['enabled'];
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

        return self::getModules();
    }
}


