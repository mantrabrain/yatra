<?php
/**
 * Departure Deduplication Script
 * 
 * Removes duplicate departure entries for the same trip and date combination.
 * This script helps maintain data integrity by ensuring each trip-date pair
 * has only one departure record.
 * 
 * @package Yatra\Scripts
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Scripts;

use Yatra\Core\Database;
use Yatra\Services\DepartureService;

/**
 * Class DepartureDeduplicationScript
 * 
 * Handles the removal of duplicate departure records to maintain data integrity.
 */
class DepartureDeduplicationScript
{
    /**
     * Database instance
     *
     * @var Database
     */
    private Database $db;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->db = new Database();
    }

    /**
     * Run the deduplication process
     *
     * @return array Results of the deduplication process
     */
    public function run(): array
    {
        $results = [
            'duplicates_found' => 0,
            'duplicates_removed' => 0,
            'errors' => []
        ];

        try {
            // Find all duplicate departure records
            $duplicates = $this->findDuplicateDepartures();
            $results['duplicates_found'] = count($duplicates);

            if (!empty($duplicates)) {
                // Remove duplicates, keeping the first occurrence
                $results['duplicates_removed'] = $this->removeDuplicates($duplicates);
            }
        } catch (\Exception $e) {
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Find duplicate departure records
     *
     * @return array Array of duplicate departure IDs
     */
    private function findDuplicateDepartures(): array
    {
        $sql = "
            SELECT GROUP_CONCAT(id) as duplicate_ids, trip_id, date, COUNT(*) as count
            FROM {$this->db->getPrefix()}yatra_departures
            WHERE status != 'trash'
            GROUP BY trip_id, date
            HAVING count > 1
        ";

        $duplicates = $this->db->getResults($sql);
        $duplicateIds = [];

        foreach ($duplicates as $duplicate) {
            // Get all IDs except the first one (keep the first occurrence)
            $ids = explode(',', $duplicate->duplicate_ids);
            array_shift($ids); // Remove the first ID (keep it)
            $duplicateIds = array_merge($duplicateIds, $ids);
        }

        return $duplicateIds;
    }

    /**
     * Remove duplicate departure records
     *
     * @param array $duplicateIds Array of duplicate departure IDs
     * @return int Number of duplicates removed
     */
    private function removeDuplicates(array $duplicateIds): int
    {
        if (empty($duplicateIds)) {
            return 0;
        }

        $placeholders = str_repeat('?,', count($duplicateIds) - 1) . '?';
        $sql = "
            DELETE FROM {$this->db->getPrefix()}yatra_departures
            WHERE id IN ($placeholders)
        ";

        return $this->db->execute($sql, $duplicateIds);
    }

    /**
     * Get a summary of departure data before deduplication
     *
     * @return array Summary statistics
     */
    public function getSummary(): array
    {
        $sql = "
            SELECT 
                COUNT(*) as total_departures,
                COUNT(DISTINCT CONCAT(trip_id, '-', date)) as unique_trip_dates,
                COUNT(*) - COUNT(DISTINCT CONCAT(trip_id, '-', date)) as potential_duplicates
            FROM {$this->db->getPrefix()}yatra_departures
            WHERE status != 'trash'
        ";

        return $this->db->getRow($sql);
    }
}