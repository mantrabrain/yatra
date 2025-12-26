<?php

declare(strict_types=1);

namespace Yatra\Repositories;

use Yatra\Repositories\BaseRepository;

/**
 * Export/Import Repository
 * 
 * Handles database operations for export/import functionality.
 */
class ExportImportRepository extends BaseRepository
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
            $jobData = unserialize($option->option_value);
            if ($jobData && isset($jobData['user_id']) && (int) $jobData['user_id'] === $userId) {
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
                "SELECT * FROM $tableName LIMIT %d, %d",
                $offset,
                $limit
            )
        );
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
        global $wpdb;
        
        $result = $wpdb->insert($tableName, $record);
        
        if ($result === false) {
            error_log("Failed to insert record into {$tableName}: " . $wpdb->last_error);
            return false;
        }
        
        return true;
    }

    /**
     * Get table name with prefix
     */
    public function getTableName(string $tableName): string
    {
        global $wpdb;
        return $wpdb->prefix . $tableName;
    }
}
