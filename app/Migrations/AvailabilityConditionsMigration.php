<?php

namespace Yatra\Migration;

use Yatra\Migration\MigrationProgress;
use Yatra\Utils\Logger;
use Yatra\Database\Tables\TripAvailabilityRulesTable;

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

        try {
            // Ensure months column exists in the table
            $table = TripAvailabilityRulesTable::getTableName();
            $column_exists = $wpdb->get_results("SHOW COLUMNS FROM {$table} LIKE 'months'");
            
            if (empty($column_exists)) {
                $wpdb->query("ALTER TABLE {$table} ADD COLUMN `months` varchar(50) DEFAULT NULL COMMENT 'Comma-separated month numbers 1-12' AFTER `day_of_week`");
                } else {
                }

            // Check if availability conditions data exists in database (regardless of plugin/module status)
            $conditions_count = $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->term_taxonomy} WHERE taxonomy = 'availability_conditions'"
            );
            
            // List all taxonomies for debugging
            $all_taxonomies = $wpdb->get_results(
                "SELECT DISTINCT taxonomy, COUNT(*) as count FROM {$wpdb->term_taxonomy} GROUP BY taxonomy"
            );
            foreach ($all_taxonomies as $tax) {
                }
            
            if ($conditions_count == 0) {
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
            if ($total > 0) {
                foreach ($conditions as $condition) {
                    // Get all meta for this condition
                    $condition_meta = $wpdb->get_results($wpdb->prepare(
                        "SELECT meta_key, meta_value FROM {$wpdb->termmeta} WHERE term_id = %d",
                        $condition->term_id
                    ));
                    
                    if ($condition_meta) {
                        foreach ($condition_meta as $meta) {
                            $value = maybe_unserialize($meta->meta_value);
                            if (is_array($value)) {
                                $value = implode(',', $value);
                            }
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
                        foreach ($tours as $tour) {
                            }
                    } else {
                        }
                    }
            }
            foreach ($conditions as $condition) {
                try {
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
                        $skipped++;
                        continue;
                    }

                    // Migrate to recurring rules for each associated trip
                    foreach ($tours as $tour) {
                        $newTripId = $this->getRawPostMeta((int) $tour->object_id, '_migrated_to_trip_id');
                        
                        if (!$newTripId) {
                            continue;
                        }

                        // Check if this condition was already migrated for this trip
                        if (!$this->isForceMigration()) {
                            $table = TripAvailabilityRulesTable::getTableName();
                            $existing = $wpdb->get_var($wpdb->prepare(
                                "SELECT id FROM {$table} WHERE trip_id = %d AND name = %s",
                                $newTripId,
                                $condition->name
                            ));
                            
                            if ($existing) {
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
                                } else {
                                $failed++;
                                }
                        }
                    }

                } catch (\Exception $e) {
                    $failed++;
                    Logger::error("Availability condition migration exception", [
                        'source' => 'migration',
                        'condition_id' => $condition->term_id,
                        'error' => $e->getMessage()
                    ]);
                }

                $this->updateProgress('availability_conditions', 'running', $migrated, $skipped, $failed, $total, null, null);
            }

        } catch (\Exception $e) {
            Logger::error("Availability conditions migration failed", [
                'source' => 'migration',
                'error' => $e->getMessage()
            ]);
        }

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

        return $ruleData;
    }

    /**
     * Insert recurring rule into new system
     */
    private function insertRecurringRule(int $tripId, array $ruleData, ?int $oldConditionId = null): bool
    {
        global $wpdb;
        $table = TripAvailabilityRulesTable::getTableName();
        
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
            return false;
        }

        return true;
    }
}
