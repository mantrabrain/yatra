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
            $table = TripAvailabilityRulesTable::getTableName();

            $conditions_count = $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->term_taxonomy} WHERE taxonomy = 'availability_conditions'"
            );

            if ((int) $conditions_count === 0) {
                return [
                    'migrated' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                ];
            }

            $conditions = $wpdb->get_results(
                "SELECT t.term_id, t.name, t.slug, tt.description 
                 FROM {$wpdb->terms} t
                 INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
                 WHERE tt.taxonomy = 'availability_conditions'"
            );

            $total = count($conditions);

            foreach ($conditions as $condition) {
                try {
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

                    $tourObjectIds = $this->resolveTourObjectIdsForCondition((int) $condition->term_id);

                    if ($tourObjectIds === []) {
                        $skipped++;
                        continue;
                    }

                    foreach ($tourObjectIds as $oldTourId) {
                        $newTripId = $this->getMigratedTripId($oldTourId);

                        if (!$newTripId) {
                            continue;
                        }

                        if (!$this->isForceMigration()) {
                            $existing = $wpdb->get_var($wpdb->prepare(
                                "SELECT id FROM `{$table}` WHERE trip_id = %d AND name = %s",
                                $newTripId,
                                $condition->name
                            ));

                            if ($existing) {
                                $skipped++;
                                continue;
                            }
                        }

                        $ruleData = $this->convertToRecurringRule(
                            $condition,
                            $months,
                            $week_days,
                            $start_date ? (string) $start_date : null,
                            $end_date ? (string) $end_date : null,
                            $availability ? (string) $availability : null
                        );

                        $result = $this->insertRecurringRule($newTripId, $ruleData);

                        if ($result) {
                            $migrated++;
                        } else {
                            $failed++;
                            Logger::error('Availability condition: insert failed', [
                                'source' => 'migration',
                                'condition_id' => $condition->term_id,
                                'old_tour_id' => $oldTourId,
                                'new_trip_id' => $newTripId,
                                'db_error' => $wpdb->last_error,
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    $failed++;
                    Logger::error('Availability condition migration exception', [
                        'source' => 'migration',
                        'condition_id' => $condition->term_id,
                        'error' => $e->getMessage(),
                    ]);
                }

                $this->updateProgress('availability_conditions', 'running', $migrated, $skipped, $failed, $total, null, null);
            }
        } catch (\Throwable $e) {
            Logger::error('Availability conditions migration failed', [
                'source' => 'migration',
                'error' => $e->getMessage(),
            ]);
        }

        return [
            'migrated' => $migrated,
            'skipped' => $skipped,
            'failed' => $failed,
        ];
    }

    /**
     * Tours linked via term_relationships and/or legacy Pro meta _yatra_availability_conditions_ids_order (term_taxonomy_ids).
     *
     * @return int[] Old tour post IDs
     */
    private function resolveTourObjectIdsForCondition(int $termId): array
    {
        global $wpdb;

        $ttId = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT term_taxonomy_id FROM {$wpdb->term_taxonomy}
             WHERE term_id = %d AND taxonomy = 'availability_conditions' LIMIT 1",
            $termId
        ));

        $seen = [];

        if ($ttId > 0) {
            $fromRel = $wpdb->get_col($wpdb->prepare(
                "SELECT object_id FROM {$wpdb->term_relationships} WHERE term_taxonomy_id = %d",
                $ttId
            ));
            foreach ($fromRel as $oid) {
                $seen[(int) $oid] = true;
            }

            // Meta stores comma-separated term_taxonomy_id values (see yatra-pro set_object_terms).
            $fromMeta = $wpdb->get_col($wpdb->prepare(
                "SELECT pm.post_id FROM {$wpdb->postmeta} pm
                 INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
                 WHERE pm.meta_key = '_yatra_availability_conditions_ids_order'
                   AND p.post_type = 'tour'
                   AND p.post_status NOT IN ('trash', 'auto-draft')
                   AND FIND_IN_SET(%d, REPLACE(pm.meta_value, ' ', ''))",
                $ttId
            ));
            foreach ($fromMeta as $oid) {
                $seen[(int) $oid] = true;
            }
        }

        return array_keys($seen);
    }

    /**
     * Map legacy yatra_tour_availability_status keys (booking|enquiry|none) to new enum.
     */
    private function mapLegacyAvailabilityStatus(?string $legacy): string
    {
        $key = $legacy !== null ? strtolower(trim($legacy)) : '';
        return match ($key) {
            'none', 'unavailable' => 'unavailable',
            'enquiry', 'limited' => 'limited',
            default => 'available',
        };
    }

    /**
     * Convert old availability condition to new recurring rule format
     */
    private function convertToRecurringRule(
        object $condition,
        array $months,
        array $week_days,
        ?string $start_date,
        ?string $end_date,
        ?string $availability
    ): array {
        $days_of_week = array_values(array_unique(array_map('intval', $week_days)));
        if ($days_of_week === []) {
            $days_of_week = [0, 1, 2, 3, 4, 5, 6];
        }

        $normalized_months = [];
        if ($months !== []) {
            foreach ($months as $month) {
                $monthInt = (int) $month;
                if ($monthInt >= 0 && $monthInt <= 11) {
                    $normalized_months[] = $monthInt + 1;
                } elseif ($monthInt >= 1 && $monthInt <= 12) {
                    $normalized_months[] = $monthInt;
                }
            }
            $normalized_months = array_values(array_unique($normalized_months));
        }

        $recurrencePattern = [];
        if ($normalized_months !== []) {
            $recurrencePattern['months'] = $normalized_months;
        }

        $availabilityStatus = $this->mapLegacyAvailabilityStatus($availability);

        return [
            'name' => $condition->name,
            'rule_type' => 'weekly',
            'recurrence_type' => 'weekly',
            'status' => 'active',
            'start_date' => !empty($start_date) ? $start_date : current_time('Y-m-d'),
            'end_date' => !empty($end_date) ? $end_date : null,
            'days_of_week' => wp_json_encode($days_of_week),
            'recurrence_pattern' => $recurrencePattern !== [] ? wp_json_encode($recurrencePattern) : null,
            'months' => $normalized_months !== [] ? wp_json_encode($normalized_months) : null,
            'interval' => 1,
            'availability_status' => $availabilityStatus,
            'created_at' => current_time('mysql'),
        ];
    }

    /**
     * Insert recurring rule into new system
     */
    private function insertRecurringRule(int $tripId, array $ruleData): bool
    {
        global $wpdb;
        $table = TripAvailabilityRulesTable::getTableName();

        $insertData = [
            'trip_id' => $tripId,
            'name' => $ruleData['name'],
            'rule_type' => $ruleData['rule_type'],
            'recurrence_type' => $ruleData['recurrence_type'],
            'status' => $ruleData['status'],
            'start_date' => $ruleData['start_date'],
            'end_date' => $ruleData['end_date'],
            'days_of_week' => $ruleData['days_of_week'],
            'recurrence_pattern' => $ruleData['recurrence_pattern'],
            'months' => $ruleData['months'],
            'interval' => (int) $ruleData['interval'],
            'availability_status' => $ruleData['availability_status'],
            'created_at' => $ruleData['created_at'],
            'updated_at' => current_time('mysql'),
        ];

        $formats = [
            '%d',
            '%s',
            '%s',
            '%s',
            '%s',
            '%s',
            '%s',
            '%s',
            '%s',
            '%s',
            '%d',
            '%s',
            '%s',
            '%s',
        ];

        $result = $wpdb->insert($table, $insertData, $formats);

        return $result !== false;
    }
}
