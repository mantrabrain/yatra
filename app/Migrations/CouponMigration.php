<?php

namespace Yatra\Migration;

use Yatra\Database\Tables\DiscountsTable;
use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

/**
 * CouponMigration - Migrates coupons from old Yatra CPT (yatra-coupons) to new discounts table.
 *
 * Old system: Custom Post Type 'yatra-coupons'
 *   - post_title = coupon name/title (NOT the coupon code)
 *   - post_meta 'yatra_coupon_code' = actual coupon code string
 *   - post_meta 'yatra_coupon_type' = 'percentage' or 'fixed'
 *   - post_meta 'yatra_coupon_value' = discount value (number)
 *   - post_meta 'yatra_coupon_expiry_date' = expiry datetime
 *   - post_meta 'yatra_coupon_using_limit' = max usage limit
 *   - post_meta 'yatra_coupon_usages_bookings' = array of booking IDs (usage count = count of this array)
 *
 * New system: Custom table wp_yatra_new_discounts
 */
class CouponMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $oldCoupons = $this->wpdb->get_results(
            "SELECT * FROM {$this->wpdb->posts} 
             WHERE post_type = 'yatra-coupons' 
             AND post_status NOT IN ('trash', 'auto-draft')"
        );
        $total = count($oldCoupons);

        if ($total === 0) {
            return compact('migrated', 'skipped', 'failed');
        }

        Logger::info("Found {$total} old coupons to migrate", ['source' => 'migration', 'data_type' => 'coupons']);

        foreach ($oldCoupons as $oldCoupon) {
            try {
                // Check if already migrated
                $migratedId = $this->getRawPostMeta($oldCoupon->ID, '_migrated_to_coupon_id');
                if ($migratedId && !$this->isForceMigration()) {
                    $skipped++;
                    $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $meta = $this->getPostMeta($oldCoupon->ID);

                // Old system: yatra_coupon_code is the actual code, post_title is the coupon name
                $couponCode = $meta['yatra_coupon_code'] ?? $oldCoupon->post_title;
                $couponType = $meta['yatra_coupon_type'] ?? 'percentage';
                $couponValue = (float) ($meta['yatra_coupon_value'] ?? 0);
                $expiryDate = $meta['yatra_coupon_expiry_date'] ?? null;
                $usageLimit = (int) ($meta['yatra_coupon_using_limit'] ?? 0);

                // Usage count is determined by counting the yatra_coupon_usages_bookings array
                $usageBookings = maybe_unserialize($meta['yatra_coupon_usages_bookings'] ?? '');
                $usageCount = is_array($usageBookings) ? count($usageBookings) : 0;

                // Map coupon type: old uses 'percentage'/'fixed', new uses same
                $discountType = $couponType;

                // Check if coupon code already exists in new table
                $existingId = $this->wpdb->get_var($this->wpdb->prepare(
                    "SELECT id FROM " . DiscountsTable::getTableName() . " WHERE code = %s",
                    $couponCode
                ));

                $couponData = [
                    'code' => $couponCode,
                    'description' => $oldCoupon->post_content ?: $oldCoupon->post_title,
                    'type' => $discountType,
                    'amount' => $couponValue,
                    'usage_limit' => $usageLimit,
                    'usage_count' => $usageCount,
                    'expiry_date' => $expiryDate ?: null,
                    'status' => $oldCoupon->post_status === 'publish' ? 'active' : 'draft',
                    'created_at' => $oldCoupon->post_date,
                    'updated_at' => $oldCoupon->post_modified,
                    'created_by' => (int) $oldCoupon->post_author ?: 0,
                    'updated_by' => (int) $oldCoupon->post_author ?: 0,
                ];

                if ($existingId && !$this->isForceMigration()) {
                    // Update existing coupon
                    $updateData = $couponData;
                    unset($updateData['code']);
                    unset($updateData['created_at']);

                    $this->wpdb->update(
                        DiscountsTable::getTableName(),
                        $updateData,
                        ['id' => $existingId]
                    );
                    $newCouponId = $existingId;
                    $migrated++;
                } else {
                    // For force migration, ensure unique code
                    if ($this->isForceMigration() && $existingId) {
                        $couponData['code'] = $couponCode . '-' . time();
                    }

                    $inserted = $this->wpdb->insert(
                        DiscountsTable::getTableName(),
                        $couponData
                    );

                    if ($inserted) {
                        $newCouponId = $this->wpdb->insert_id;
                        $migrated++;
                    } else {
                        $failed++;
                        Logger::error("Failed to insert coupon ID {$oldCoupon->ID}: {$this->wpdb->last_error}", [
                            'source' => 'migration',
                            'data_type' => 'coupons',
                            'coupon_id' => $oldCoupon->ID,
                            'code' => $couponCode,
                        ]);
                        $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
                        continue;
                    }
                }

                // Mark as migrated
                $this->setRawPostMeta($oldCoupon->ID, '_migrated_to_coupon_id', (string) $newCouponId);

                $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Exception $e) {
                $failed++;
                Logger::error("Exception migrating coupon ID {$oldCoupon->ID}: {$e->getMessage()}", [
                    'source' => 'migration',
                    'data_type' => 'coupons',
                    'coupon_id' => $oldCoupon->ID,
                ]);
                $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        }

        return compact('migrated', 'skipped', 'failed');
    }
}
