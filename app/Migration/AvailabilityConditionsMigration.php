<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;

class AvailabilityConditionsMigration extends BaseMigration
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

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Starting Availability Conditions Migration");
        error_log("[Yatra Migration] ========================================");

        try {
            // Ensure months column exists in the table
            $table = $wpdb->prefix . 'yatra_trip_availability_rules';
            $column_exists = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'months'");
            
            if (empty($column_exists)) {
                error_log("[Yatra Migration] Adding months column to {$table}");
                $wpdb->query("ALTER TABLE {$table} ADD COLUMN `months` varchar(50) DEFAULT NULL COMMENT 'Comma-separated month numbers 1-12' AFTER `day_of_week`");
                error_log("[Yatra Migration] Months column added successfully");
            } else {
                error_log("[Yatra Migration] Months column already exists");
            }

            // Check if availability conditions data exists in database (regardless of plugin/module status)
            $conditions_count = $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->term_taxonomy} WHERE taxonomy = 'availability_conditions'"
            );
            
            error_log("[Yatra Migration] Availability conditions taxonomy count: {$conditions_count}");
            
            // List all taxonomies for debugging
            $all_taxonomies = $wpdb->get_results(
                "SELECT DISTINCT taxonomy, COUNT(*) as count FROM {$wpdb->term_taxonomy} GROUP BY taxonomy"
            );
            error_log("[Yatra Migration] All taxonomies in database:");
            foreach ($all_taxonomies as $tax) {
                error_log("[Yatra Migration]   - {$tax->taxonomy}: {$tax->count} terms");
            }
            
            if ($conditions_count == 0) {
                error_log("[Yatra Migration] ========================================");
                error_log("[Yatra Migration] NO OLD AVAILABILITY CONDITIONS DATA FOUND");
                error_log("[Yatra Migration] The old 'availability_conditions' taxonomy has no terms.");
                error_log("[Yatra Migration] This means:");
                error_log("[Yatra Migration]   1. The yatra-availability-conditions plugin was never used, OR");
                error_log("[Yatra Migration]   2. No availability conditions were ever created in the old system");
                error_log("[Yatra Migration] ========================================");
                return [
                    'migrated' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                ];
            }

            // Get all availability condition terms directly from database
            $conditions = $wpdb->get_results(
                "SELECT t.term_id, t.name, t.slug, tt.description 
                 FROM {$wpdb->terms} t
                 INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
                 WHERE tt.taxonomy = 'availability_conditions'"
            );

            $total = count($conditions);
            error_log("[Yatra Migration] Found {$total} availability conditions to migrate");
            error_log("[Yatra Migration] ========================================");
            error_log("[Yatra Migration] OLD AVAILABILITY CONDITIONS DATA DUMP:");
            
            if ($total > 0) {
                foreach ($conditions as $condition) {
                    error_log("[Yatra Migration] Condition #{$condition->term_id}:");
                    error_log("[Yatra Migration]   Name: {$condition->name}");
                    error_log("[Yatra Migration]   Slug: {$condition->slug}");
                    error_log("[Yatra Migration]   Description: {$condition->description}");
                    
                    // Get all meta for this condition
                    $condition_meta = $wpdb->get_results($wpdb->prepare(
                        "SELECT meta_key, meta_value FROM {$wpdb->termmeta} WHERE term_id = %d",
                        $condition->term_id
                    ));
                    
                    if ($condition_meta) {
                        error_log("[Yatra Migration]   Meta data:");
                        foreach ($condition_meta as $meta) {
                            $value = maybe_unserialize($meta->meta_value);
                            if (is_array($value)) {
                                $value = implode(',', $value);
                            }
                            error_log("[Yatra Migration]     - {$meta->meta_key}: {$value}");
                        }
                    }
                    
                    // Get tours associated with this condition
                    $tours = $wpdb->get_results($wpdb->prepare(
                        "SELECT tr.object_id, p.post_title 
                         FROM {$wpdb->term_relationships} tr
                         LEFT JOIN {$wpdb->posts} p ON tr.object_id = p.ID
                         WHERE tr.term_taxonomy_id IN (
                             SELECT term_taxonomy_id FROM {$wpdb->term_taxonomy} 
                             WHERE term_id = %d AND taxonomy = 'availability_conditions'
                         )",
                        $condition->term_id
                    ));
                    
                    if ($tours) {
                        error_log("[Yatra Migration]   Associated with " . count($tours) . " tours:");
                        foreach ($tours as $tour) {
                            error_log("[Yatra Migration]     - Tour #{$tour->object_id}: {$tour->post_title}");
                        }
                    } else {
                        error_log("[Yatra Migration]   No tours associated");
                    }
                    error_log("[Yatra Migration]   ---");
                }
            }
            error_log("[Yatra Migration] ========================================");

            foreach ($conditions as $condition) {
                try {
                    error_log("[Yatra Migration] Processing availability condition: {$condition->name} (ID: {$condition->term_id})");

                    // Get condition meta directly from database
                    $months_raw = $wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key = 'months'",
                        $condition->term_id
                    ));
                    $months = $months_raw ? maybe_unserialize($months_raw) : [];
                    $months = is_array($months) ? $months : [];
                    
                    $week_days_raw = $wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key = 'week_days'",
                        $condition->term_id
                    ));
                    $week_days = $week_days_raw ? maybe_unserialize($week_days_raw) : [];
                    $week_days = is_array($week_days) ? $week_days : [];
                    
                    $start_date = $wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key = 'start_date'",
                        $condition->term_id
                    ));
                    
                    $end_date = $wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key = 'end_date'",
                        $condition->term_id
                    ));
                    
                    $availability = $wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key = 'availability'",
                        $condition->term_id
                    ));

                    error_log("[Yatra Migration] Condition meta - months: " . implode(',', $months) . ", weekdays: " . implode(',', $week_days) . ", dates: {$start_date} to {$end_date}, availability: {$availability}");

                    // Get tours associated with this condition
                    $tours = $wpdb->get_results($wpdb->prepare(
                        "SELECT object_id FROM {$wpdb->term_relationships} 
                         WHERE term_taxonomy_id IN (
                             SELECT term_taxonomy_id FROM {$wpdb->term_taxonomy} 
                             WHERE term_id = %d AND taxonomy = 'availability_conditions'
                         )",
                        $condition->term_id
                    ));

                    if (empty($tours)) {
                        error_log("[Yatra Migration] No tours associated with condition '{$condition->name}', skipping");
                        $skipped++;
                        continue;
                    }

                    error_log("[Yatra Migration] Found " . count($tours) . " tours with this availability condition");

                    // Migrate to recurring rules for each associated trip
                    foreach ($tours as $tour) {
                        $newTripId = get_post_meta($tour->object_id, '_migrated_to_trip_id', true);
                        
                        if (!$newTripId) {
                            error_log("[Yatra Migration] Tour {$tour->object_id} not migrated yet, skipping");
                            continue;
                        }

                        // Check if this condition was already migrated for this trip
                        if (!$this->isForceMigration()) {
                            $table = $wpdb->prefix . 'yatra_trip_availability_rules';
                            $existing = $wpdb->get_var($wpdb->prepare(
                                "SELECT id FROM {$table} WHERE trip_id = %d AND name = %s",
                                $newTripId,
                                $condition->name
                            ));
                            
                            if ($existing) {
                                error_log("[Yatra Migration] Recurring rule already exists for trip {$newTripId}, skipping");
                                $skipped++;
                                continue;
                            }
                        }

                        // Convert availability condition to recurring rule
                        $ruleData = $this->convertToRecurringRule($condition, $months, $week_days, $start_date, $end_date, $availability);
                        
                        if ($ruleData) {
                            $result = $this->insertRecurringRule($newTripId, $ruleData, $condition->term_id);
                            
                            if ($result) {
                                $migrated++;
                                error_log("[Yatra Migration] Created recurring rule for trip {$newTripId} from condition '{$condition->name}'");
                            } else {
                                $failed++;
                                error_log("[Yatra Migration] Failed to create recurring rule for trip {$newTripId}");
                            }
                        }
                    }

                } catch (\Exception $e) {
                    $failed++;
                    error_log("[Yatra Migration] Exception migrating availability condition '{$condition->name}': " . $e->getMessage());
                    Logger::error("Availability condition migration exception", [
                        'source' => 'migration',
                        'condition_id' => $condition->term_id,
                        'error' => $e->getMessage()
                    ]);
                }

                $this->updateProgress('availability_conditions', 'running', $migrated, $skipped, $failed, $total, null, null);
            }

        } catch (\Exception $e) {
            error_log("[Yatra Migration] Availability conditions migration exception: " . $e->getMessage());
            Logger::error("Availability conditions migration failed", [
                'source' => 'migration',
                'error' => $e->getMessage()
            ]);
        }

        error_log("[Yatra Migration] ========================================");
        error_log("[Yatra Migration] Availability Conditions Migration Complete");
        error_log("[Yatra Migration] Migrated: {$migrated}, Skipped: {$skipped}, Failed: {$failed}");
        error_log("[Yatra Migration] ========================================");

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }

    /**
     * Convert old availability condition to new recurring rule format
     */
    private function convertToRecurringRule($condition, array $months, array $week_days, $start_date, $end_date, $availability): ?array
    {
        // Old plugin only had weekly availability rules
        $rule_type = 'weekly';

        // Convert weekday indices (0-6, Sunday=0) to our format (0-6, Sunday=0)
        $days_of_week = array_map('intval', $week_days);

        // Prepare days_of_week as comma-separated string for weekly rules
        $days_of_week_string = !empty($days_of_week) ? implode(',', $days_of_week) : null;

        // Normalize months to 1-12 range (old data stored 0-11 where 0 = January)
        $normalized_months = [];
        if (!empty($months)) {
            $normalized_months = array_map(function ($month) {
                $monthInt = (int) $month;
                if ($monthInt >= 0 && $monthInt <= 11) {
                    return $monthInt + 1; // Convert 0-based to 1-based
                }
                if ($monthInt < 1) {
                    return 1;
                }
                if ($monthInt > 12) {
                    return 12;
                }
                return $monthInt;
            }, $months);
            $normalized_months = array_values(array_unique($normalized_months));
        }

        // Prepare months as JSON array string (e.g., "[1,12]" not "0,11")
        $months_string = !empty($normalized_months) ? json_encode($normalized_months) : null;

        $ruleData = [
            'name' => $condition->name,
            'rule_type' => $rule_type,
            'status' => 'active', // Always active for migrated rules
            'start_date' => !empty($start_date) ? $start_date : current_time('Y-m-d'),
            'end_date' => !empty($end_date) ? $end_date : null,
            'days_of_week' => $days_of_week_string, // Weekly rules use days_of_week
            'week_of_month' => null, // Not used for weekly rules
            'day_of_week' => null, // Not used for weekly rules
            'months' => $months_string, // JSON array string (e.g., "[1,12]")
            'interval_days' => null,
            'interval_start_date' => null,
            'seats_total' => null,
            'original_price' => null,
            'sale_price' => null,
            'traveler_pricing' => null,
            'created_at' => current_time('mysql'),
        ];

        error_log("[Yatra Migration] Converted to recurring rule: type={$rule_type}, days_of_week=" . ($days_of_week_string ?: 'none') . ", months=" . ($months_string ?: 'none'));

        return $ruleData;
    }

    /**
     * Insert recurring rule into new system
     */
    private function insertRecurringRule(int $tripId, array $ruleData, int $oldConditionId = null): bool
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_availability_rules';
        
        error_log("[Yatra Migration] Inserting recurring rule for trip {$tripId} with months: " . ($ruleData['months'] ?: 'none'));

        $insertData = [
            'trip_id' => $tripId,
            'name' => $ruleData['name'],
            'rule_type' => $ruleData['rule_type'],
            'status' => $ruleData['status'],
            'start_date' => $ruleData['start_date'],
            'end_date' => $ruleData['end_date'],
            'days_of_week' => $ruleData['days_of_week'], // Comma-separated string
            'week_of_month' => $ruleData['week_of_month'],
            'day_of_week' => $ruleData['day_of_week'],
            'months' => $ruleData['months'], // Comma-separated month numbers
            'interval_days' => $ruleData['interval_days'],
            'interval_start_date' => $ruleData['interval_start_date'],
            'seats_total' => $ruleData['seats_total'],
            'original_price' => $ruleData['original_price'],
            'sale_price' => $ruleData['sale_price'],
            'traveler_pricing' => $ruleData['traveler_pricing'],
            'created_at' => $ruleData['created_at'],
            'updated_at' => current_time('mysql'),
        ];

        $result = $wpdb->insert($table, $insertData);

        if (!$result) {
            error_log("[Yatra Migration] Failed to insert recurring rule: " . $wpdb->last_error);
            return false;
        }

        error_log("[Yatra Migration] Inserted recurring rule ID: " . $wpdb->insert_id);
        return true;
    }
}
