<?php

namespace Yatra\Migration;

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
 */
class ProFeaturesMigration extends BaseMigration
{
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

            // Map legacy feature keys to new Pro module slugs where there is an equivalent.
            $map = [
                // Old services taxonomy feature → new Additional Services module.
                'services' => 'additional_services',
                // Old google calendar feature → new module.
                'google_calendar' => 'google_calendar',
                // Old partial payment → closest equivalent in new Pro.
                'partial_payment' => 'flexible_payments',
                // Other legacy features are now handled by core migrations or were deprecated.
            ];

            $enabled = [];
            foreach ($map as $legacyKey => $newSlug) {
                if (!empty($legacy[$legacyKey])) {
                    $enabled[] = $newSlug;
                }
            }
            $enabled = array_values(array_unique($enabled));

            $existing = get_option('yatra_pro_modules_enabled', []);
            if (!is_array($existing)) {
                $existing = [];
            }

            $final = $this->isForceMigration()
                ? array_values(array_unique(array_merge($existing, $enabled)))
                : array_values(array_unique(array_merge($enabled, $existing)));

            update_option('yatra_pro_modules_enabled', $final);

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
}

