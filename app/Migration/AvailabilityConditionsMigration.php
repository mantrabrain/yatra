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
            // Check if availability conditions data exists in database (regardless of plugin/module status)
            $conditions_count = $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->term_taxonomy} WHERE taxonomy = 'availability_conditions'"
            );
            
            if ($conditions_count == 0) {
                error_log("[Yatra Migration] No availability conditions found in database");
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

                        // Convert availability condition to recurring rule
                        $ruleData = $this->convertToRecurringRule($condition, $months, $week_days, $start_date, $end_date, $availability);
                        
                        if ($ruleData) {
                            $result = $this->insertRecurringRule($newTripId, $ruleData);
                            
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
        // Determine rule type based on what's configured
        $rule_type = 'weekly'; // Default
        
        if (!empty($months) && empty($week_days)) {
            $rule_type = 'monthly';
        } elseif (!empty($week_days)) {
            $rule_type = 'weekly';
        } elseif (!empty($start_date) || !empty($end_date)) {
            $rule_type = 'interval';
        }

        // Convert month indices (0-11) to month numbers (1-12)
        $month_numbers = array_map(function($m) {
            return intval($m) + 1;
        }, $months);

        // Convert weekday indices (0-6, Sunday=0) to our format (0-6, Sunday=0)
        $days_of_week = array_map('intval', $week_days);

        // Prepare months as JSON array for the new system
        $months_json = !empty($month_numbers) ? wp_json_encode($month_numbers) : null;
        
        // Prepare days_of_week as comma-separated string
        $days_of_week_string = !empty($days_of_week) ? implode(',', $days_of_week) : null;

        $ruleData = [
            'name' => $condition->name,
            'rule_type' => $rule_type,
            'status' => $availability === 'available' ? 'active' : 'inactive',
            'start_date' => !empty($start_date) ? $start_date : null,
            'end_date' => !empty($end_date) ? $end_date : null,
            'months' => $months_json, // JSON array for months filter
            'days_of_week' => $days_of_week_string, // Comma-separated for weekly rules
            'interval_days' => null,
            'interval_type' => null,
            'seats_total' => null,
            'original_price' => null,
            'sale_price' => null,
            'traveler_pricing' => null,
            'created_at' => current_time('mysql'),
        ];

        error_log("[Yatra Migration] Converted to recurring rule: type={$rule_type}, months=" . ($months_json ?: 'none') . ", days_of_week=" . ($days_of_week_string ?: 'none'));

        return $ruleData;
    }

    /**
     * Insert recurring rule into new system
     */
    private function insertRecurringRule(int $tripId, array $ruleData): bool
    {
        global $wpdb;
        $table = $wpdb->prefix . 'yatra_trip_availability_rules';

        $insertData = [
            'trip_id' => $tripId,
            'name' => $ruleData['name'],
            'rule_type' => $ruleData['rule_type'],
            'status' => $ruleData['status'],
            'start_date' => $ruleData['start_date'],
            'end_date' => $ruleData['end_date'],
            'months' => $ruleData['months'], // JSON array
            'days_of_week' => $ruleData['days_of_week'], // Comma-separated string
            'interval_days' => $ruleData['interval_days'],
            'seats_total' => $ruleData['seats_total'],
            'original_price' => $ruleData['original_price'],
            'sale_price' => $ruleData['sale_price'],
            'traveler_pricing' => $ruleData['traveler_pricing'],
            'created_at' => $ruleData['created_at'],
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
