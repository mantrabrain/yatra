<?php

declare(strict_types=1);

namespace Yatra\Repositories;

/**
 * Export/Import Repository
 * 
 * Handles database operations for export/import functionality.
 */
class ExportImportRepository
{
    /**
     * Get MySQL version
     */
    public function getMySQLVersion(): string
    {
        global $wpdb;
        return $wpdb->get_var("SELECT VERSION()") ?: 'Unknown';
    }

    /**
     * Get all job options from database
     */
    public function getAllJobOptions(): array
    {
        global $wpdb;
        
        return $wpdb->get_results(
            "SELECT option_name, option_value FROM {$wpdb->options} 
             WHERE option_name LIKE 'yatra_job_%'"
        );
    }

    /**
     * Get job options for specific user
     */
    public function getJobOptionsForUser(int $userId): array
    {
        $options = $this->getAllJobOptions();
        
        $jobs = [];
        foreach ($options as $option) {
            $jobData = maybe_unserialize($option->option_value);
            if (is_array($jobData) && isset($jobData['user_id']) && (int) $jobData['user_id'] === $userId) {
                $jobs[] = $jobData;
            }
        }
        
        return $jobs;
    }

    /**
     * Check if table exists
     */
    public function tableExists(string $tableName): bool
    {
        global $wpdb;
        $tableExists = $wpdb->get_var("SHOW TABLES LIKE '$tableName'");
        return !empty($tableExists);
    }

    /**
     * Get count of records in table
     */
    public function getRecordCount(string $tableName): int
    {
        global $wpdb;
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM $tableName");
    }

    /**
     * Get batch of records from table
     */
    public function getBatchRecords(string $tableName, int $offset, int $limit): array
    {
        global $wpdb;
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$tableName}` LIMIT %d, %d",
                $offset,
                $limit
            )
        );
    }

    /**
     * Count rows in classifications table for a single type (destinations, activities, etc.).
     */
    public function getClassificationCount(string $tableName, string $type): int
    {
        global $wpdb;

        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM `{$tableName}` WHERE `type` = %s",
                $type
            )
        );
    }

    /**
     * Batch fetch classification rows for export.
     *
     * @return array<int, object|array>
     */
    public function getClassificationBatch(string $tableName, string $type, int $offset, int $limit): array
    {
        global $wpdb;

        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$tableName}` WHERE `type` = %s ORDER BY `id` ASC LIMIT %d, %d",
                $type,
                $offset,
                $limit
            )
        );

        return is_array($results) ? $results : [];
    }

    /**
     * Get table columns
     */
    public function getTableColumns(string $tableName): array
    {
        global $wpdb;
        return $wpdb->get_col("DESC {$tableName}", 0);
    }

    /**
     * Insert record into table
     */
    public function insertRecord(string $tableName, array $record): bool
    {
        return $this->insertRecordReturningId($tableName, $record) !== null;
    }

    /**
     * Insert and return new auto-increment id, or null on failure.
     */
    public function insertRecordReturningId(string $tableName, array $record): ?int
    {
        global $wpdb;

        $result = $wpdb->insert($tableName, $record);

        if ($result === false) {
            return null;
        }

        $id = (int) $wpdb->insert_id;

        return $id > 0 ? $id : null;
    }
}
