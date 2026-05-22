<?php

namespace Yatra\Migrations;

use Yatra\Database\Tables\BookingsTable;

/**
 * Add Tax Fields to Bookings Migration
 * 
 * Adds tax-related columns to the bookings table for comprehensive tax tracking
 * 
 * @package Yatra\Migrations
 * @since 3.0.0
 */
class AddTaxFieldsToBookingsMigration
{
    /**
     * Migration version
     */
    const VERSION = '3.0.0';

    /**
     * Run the migration
     * 
     * @return bool True if successful, false otherwise
     */
    public static function up(): bool
    {
        global $wpdb;
        
        $tableName = BookingsTable::getTableName();
        
        // Check if tax_amount column already exists
        $columnExists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'tax_amount'",
            DB_NAME,
            $tableName
        ));
        
        if ($columnExists) {
            return true; // Already migrated
        }
        
        // Add tax columns
        $sql = "ALTER TABLE `{$tableName}` 
                ADD COLUMN `subtotal` decimal(12,2) DEFAULT NULL COMMENT 'Base amount before tax' AFTER `discount_code`,
                ADD COLUMN `tax_amount` decimal(12,2) DEFAULT 0 COMMENT 'Total tax amount' AFTER `subtotal`,
                ADD COLUMN `tax_rate` decimal(5,2) DEFAULT 0 COMMENT 'Total tax rate percentage' AFTER `tax_amount`,
                ADD COLUMN `tax_inclusive` tinyint(1) DEFAULT 0 COMMENT 'Whether tax is included in price' AFTER `tax_rate`,
                ADD COLUMN `tax_details` text COMMENT 'JSON with detailed tax breakdown' AFTER `tax_inclusive`";
        
        // Add indexes for tax fields
        $sql .= ", ADD INDEX `idx_tax_amount` (`tax_amount`)";
        
        return $wpdb->query($sql) !== false;
    }
    
    /**
     * Rollback the migration
     * 
     * @return bool True if successful, false otherwise
     */
    public static function down(): bool
    {
        global $wpdb;
        
        $tableName = BookingsTable::getTableName();
        
        // Remove tax columns
        $sql = "ALTER TABLE `{$tableName}` 
                DROP COLUMN `subtotal`,
                DROP COLUMN `tax_amount`,
                DROP COLUMN `tax_rate`,
                DROP COLUMN `tax_inclusive`,
                DROP COLUMN `tax_details`";
        
        return $wpdb->query($sql) !== false;
    }
    
    /**
     * Get migration description
     * 
     * @return string Migration description
     */
    public static function getDescription(): string
    {
        return 'Add tax tracking fields to bookings table for comprehensive tax management';
    }
    
    /**
     * Update existing bookings with calculated tax data
     * 
     * This method can be called after the migration to populate tax fields
     * for existing bookings based on current tax settings
     * 
     * @return int Number of bookings updated
     */
    public static function updateExistingBookings(): int
    {
        global $wpdb;
        
        $tableName = BookingsTable::getTableName();
        
        // Get bookings without tax data
        $bookings = $wpdb->get_results("
            SELECT id, total_amount, contact_country 
            FROM {$tableName} 
            WHERE tax_amount = 0 OR tax_amount IS NULL
            AND total_amount > 0
        ");
        
        if (empty($bookings)) {
            return 0;
        }
        
        // Load tax service
        if (!class_exists('\Yatra\Services\TaxService')) {
            require_once YATRA_PLUGIN_DIR . 'app/Services/TaxService.php';
        }
        
        if (!class_exists('\Yatra\Services\SettingsService')) {
            require_once YATRA_PLUGIN_DIR . 'app/Services/SettingsService.php';
        }
        
        $updated = 0;
        
        foreach ($bookings as $booking) {
            try {
                // Calculate tax for existing booking
                $taxDetails = \Yatra\Services\TaxService::calculateTax(
                    (float) $booking->total_amount,
                    $booking->contact_country
                );
                
                // Update booking with tax data
                $wpdb->update(
                    $tableName,
                    [
                        'subtotal' => $taxDetails['tax_inclusive'] 
                            ? $booking->total_amount - $taxDetails['tax_amount']
                            : $booking->total_amount,
                        'tax_amount' => $taxDetails['tax_amount'],
                        'tax_rate' => $taxDetails['tax_rate'],
                        'tax_inclusive' => $taxDetails['tax_inclusive'] ? 1 : 0,
                        'tax_details' => json_encode($taxDetails['taxes']),
                        'updated_at' => current_time('mysql'),
                    ],
                    ['id' => $booking->id],
                    ['%f', '%f', '%f', '%d', '%s', '%s'],
                    ['%d']
                );
                
                if ($wpdb->last_error === '') {
                    $updated++;
                }
            } catch (\Exception $e) {
                // Log error but continue with other bookings
            }
        }
        
        return $updated;
    }
}
