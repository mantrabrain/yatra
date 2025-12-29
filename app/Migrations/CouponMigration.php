<?php

namespace Yatra\Migration;

use Yatra\Database\Tables\DiscountsTable;
use Yatra\Migration\MigrationProgress;

class CouponMigration extends BaseMigration
{
    public function __construct(MigrationProgress $service)
    {
        parent::__construct($service);
    }

    public function run(): array
    {
        global $wpdb;

        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $oldCoupons = $wpdb->get_results(
            "SELECT * FROM {$wpdb->posts} 
             WHERE post_type = 'yatra-coupons' 
             AND post_status IN ('publish', 'draft')"
        );
        $total = count($oldCoupons);

        foreach ($oldCoupons as $oldCoupon) {
            try {
                if (get_post_meta($oldCoupon->ID, '_migrated_to_coupon_id', true)) {
                    $skipped++;
                    $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
                    continue;
                }

                $meta = $this->getPostMeta($oldCoupon->ID);

                $couponData = [
                    'code' => $oldCoupon->post_title,
                    'description' => $oldCoupon->post_content,
                    'discount_type' => $meta['yatra_coupon_discount_type'] ?? 'percentage',
                    'discount_amount' => floatval($meta['yatra_coupon_discount_amount'] ?? 0),
                    'minimum_amount' => floatval($meta['yatra_coupon_minimum_amount'] ?? 0),
                    'maximum_amount' => floatval($meta['yatra_coupon_maximum_amount'] ?? 0),
                    'usage_limit' => intval($meta['yatra_coupon_usage_limit'] ?? 0),
                    'usage_count' => intval($meta['yatra_coupon_usage_count'] ?? 0),
                    'start_date' => $meta['yatra_coupon_start_date'] ?? null,
                    'end_date' => $meta['yatra_coupon_end_date'] ?? null,
                    'status' => $oldCoupon->post_status === 'publish' ? 'active' : 'inactive',
                    'created_at' => $oldCoupon->post_date,
                    'updated_at' => $oldCoupon->post_modified,
                ];

                $wpdb->insert(
                    DiscountsTable::getTableName(),
                    $couponData
                );

                $newCouponId = $wpdb->insert_id;

                if ($newCouponId) {
                    update_post_meta($oldCoupon->ID, '_migrated_to_coupon_id', $newCouponId);
                    $migrated++;
                } else {
                    $failed++;
                }

                $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
            } catch (\Exception $e) {
                $failed++;
                $this->updateProgress('coupons', 'running', $migrated, $skipped, $failed, $total, null, null);
                error_log("Coupon migration failed for ID {$oldCoupon->ID}: " . $e->getMessage());
            }
        }

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }
}
