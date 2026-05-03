<?php

namespace Yatra\Migration;

use Yatra\Core\Modules\ModuleManager;
use Yatra\Utils\Logger;

/**
 * Migrate legacy Pro feature toggles to the new Pro module enablement option.
 *
 * Legacy: wp_options.yatra_pro_features (array of feature => bool)
 * New Pro: wp_options.yatra_pro_modules_enabled (list of module slugs)
 *
 * Old Pro 2.x feature keys (see yatra-pro-old Admin\Features::get_available_features) and outcome:
 * - services              → additional_services (module exists in Pro 3.x)
 * - google_calendar       → google_calendar
 * - partial_payment       → flexible_payments
 * - payment_gateways      → no module slug (gateways live in core SettingsMigration + ProGatewayRegistration)
 * - review_ratings        → no module (reviews: ReviewMigration + ProReviewCptMigration; settings in SettingsMigration)
 * - downloads             → no module (data: ProDownloadsMigration)
 * - available_conditions  → no module (data: AvailabilityConditionsMigration in core)
 *
 * When every legacy Pro 2.x feature flag in yatra_pro_features is on, we enable all Pro 3.x modules
 * that exist in the new plugin (extras like trip_consent were not in 2.x but match "everything on").
 */
class ProFeaturesMigration extends BaseMigration
{
    /** Keys from old yatra-pro Admin\Features::get_available_features(). */
    private const LEGACY_PRO_FEATURE_KEYS = [
        'payment_gateways',
        'services',
        'partial_payment',
        'review_ratings',
        'google_calendar',
        'downloads',
        'available_conditions',
    ];

    /** Pro 3.x module slugs (see yatra-pro ProModuleRepository::$modules). */
    private const PRO_3_MODULE_SLUGS = [
        'google_calendar',
        'additional_services',
        'trip_consent',
        'email_automation',
        'dynamic_form_field',
        'advanced_discount',
        'mailchimp',
        'facebook_pixel',
        'flexible_payments',
        'scheduled_payments',
        'dynamic_pricing',
    ];

    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $legacy = get_option('yatra_pro_features', []);
        $total = (is_array($legacy) && array_filter($legacy)) ? 1 : 0;
        if ($total === 0) {
            return compact('migrated', 'skipped', 'failed');
        }

        $pro = ProMigrationReadiness::getState();
        if (!$pro['ready']) {
            // We cannot safely write module enablement without the new Pro conventions being present.
            $skipped = 1;
            Logger::warning('Skipping ProFeaturesMigration: Yatra Pro 3.0+ not ready', [
                'source' => 'migration',
                'pro_migration' => $pro,
            ]);
            $this->updateProgress('pro_features', 'running', $migrated, $skipped, $failed, $total, null, null);

            return compact('migrated', 'skipped', 'failed');
        }

        try {
            $legacy = is_array($legacy) ? $legacy : [];

            $enabled = [];

            if ($this->allLegacyProFeaturesWereEnabled($legacy)) {
                $enabled = self::PRO_3_MODULE_SLUGS;
                Logger::info('ProFeaturesMigration: all legacy Pro feature toggles on — enabling full Pro 3.x module set.', [
                    'source' => 'migration',
                    'modules' => $enabled,
                ]);
            } else {
                // Map legacy feature keys to new Pro module slugs where there is an equivalent.
                $map = [
                    'services' => 'additional_services',
                    'google_calendar' => 'google_calendar',
                    'partial_payment' => 'flexible_payments',
                ];

                foreach ($map as $legacyKey => $newSlug) {
                    if (!empty($legacy[$legacyKey])) {
                        $enabled[] = $newSlug;
                    }
                }
                $enabled = array_values(array_unique($enabled));
            }

            $existing = get_option('yatra_pro_modules_enabled', []);
            if (!is_array($existing)) {
                $existing = [];
            }

            $final = $this->isForceMigration()
                ? array_values(array_unique(array_merge($existing, $enabled)))
                : array_values(array_unique(array_merge($enabled, $existing)));

            update_option('yatra_pro_modules_enabled', $final);

            // Core 3.x reads module on/off from yatra_modules (ModuleManager). Legacy Pro only set
            // yatra_pro_modules_enabled — without this, Additional Services and other Pro modules stay disabled in UI/runtime.
            if (class_exists(ModuleManager::class)) {
                $knownSlugs = array_column(ModuleManager::getDefaultModules(), 'slug');
                foreach ($final as $slug) {
                    $slug = is_string($slug) ? trim($slug) : '';
                    if ($slug === '' || !in_array($slug, $knownSlugs, true)) {
                        continue;
                    }
                    ModuleManager::setModuleStatus($slug, true);
                }
            }

            $migrated = 1;
            $this->updateProgress('pro_features', 'running', $migrated, $skipped, $failed, $total, null, null);
        } catch (\Throwable $e) {
            $failed = 1;
            Logger::error('ProFeaturesMigration failed', [
                'source' => 'migration',
                'error' => $e->getMessage(),
            ]);
            $this->updateProgress('pro_features', 'running', $migrated, $skipped, $failed, $total, null, null);
        }

        return compact('migrated', 'skipped', 'failed');
    }

    /**
     * True when every legacy Pro 2.x feature we know about is enabled in the saved option.
     * Uses a count so slightly different option shapes (missing keys) still match "all on" when appropriate.
     */
    private function allLegacyProFeaturesWereEnabled(array $legacy): bool
    {
        $required = count(self::LEGACY_PRO_FEATURE_KEYS);
        $enabledCount = 0;
        foreach (self::LEGACY_PRO_FEATURE_KEYS as $key) {
            if (!empty($legacy[$key])) {
                $enabledCount++;
            }
        }

        return $enabledCount >= $required;
    }
}

