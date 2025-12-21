<?php
/**
 * Migration Detector - Detects old Yatra data from previous versions
 * 
 * This class detects data from Yatra versions prior to 3.0.0
 * All migration-related code is in app/Migration folder for easy removal
 * 
 * @package Yatra\Migration
 * @since 3.0.0
 */

namespace Yatra\Migration;

class MigrationDetector
{
    private $wpdb;
    
    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
    }
    
    /**
     * Check if old Yatra data exists
     */
    public function hasOldData(): bool
    {
        $oldData = $this->detectOldData();
        
        foreach ($oldData as $data) {
            if ($data['count'] > 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Detect all old data from previous Yatra versions
     */
    public function detectOldData(): array
    {
        $prefix = $this->wpdb->prefix;
        
        return [
            'trips' => [
                'label' => 'Trips',
                'count' => $this->countOldTrips(),
                'description' => 'Tour packages from old version',
                'table' => 'posts (post_type=tour)',
            ],
            'bookings' => [
                'label' => 'Bookings',
                'count' => $this->countOldBookings(),
                'description' => 'Customer bookings and reservations',
                'table' => "{$prefix}yatra_booking",
            ],
            'customers' => [
                'label' => 'Customers',
                'count' => $this->countOldCustomers(),
                'description' => 'Customer profiles',
                'table' => "{$prefix}yatra_customer",
            ],
            'destinations' => [
                'label' => 'Destinations',
                'count' => $this->countOldDestinations(),
                'description' => 'Travel destinations',
                'table' => 'terms (taxonomy=destination)',
            ],
            'activities' => [
                'label' => 'Activities',
                'count' => $this->countOldActivities(),
                'description' => 'Trip activities',
                'table' => 'terms (taxonomy=activity)',
            ],
            'trip_categories' => [
                'label' => 'Trip Categories',
                'count' => $this->countOldCategories(),
                'description' => 'Trip categorization',
                'table' => 'terms (taxonomy=tour_category)',
            ],
            'difficulty_levels' => [
                'label' => 'Difficulty Levels',
                'count' => $this->countOldDifficultyLevels(),
                'description' => 'Trip difficulty classifications',
                'table' => 'terms (taxonomy=difficulty)',
            ],
            'reviews' => [
                'label' => 'Reviews',
                'count' => $this->countOldReviews(),
                'description' => 'Trip reviews and ratings',
                'table' => 'comments (comment_type=yatra_review)',
            ],
            'enquiries' => [
                'label' => 'Enquiries',
                'count' => $this->countOldEnquiries(),
                'description' => 'Customer enquiries',
                'table' => "{$prefix}yatra_enquiry",
            ],
        ];
    }
    
    /**
     * Count old trips (stored as custom post type 'tour')
     */
    private function countOldTrips(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->posts} 
             WHERE post_type = 'tour' AND post_status != 'trash'"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old bookings
     */
    private function countOldBookings(): int
    {
        $table = $this->wpdb->prefix . 'yatra_booking';
        
        if (!$this->tableExists($table)) {
            return 0;
        }
        
        $count = $this->wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        
        return (int) $count;
    }
    
    /**
     * Count old customers
     */
    private function countOldCustomers(): int
    {
        $table = $this->wpdb->prefix . 'yatra_customer';
        
        if (!$this->tableExists($table)) {
            return 0;
        }
        
        $count = $this->wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        
        return (int) $count;
    }
    
    /**
     * Count old destinations (stored as taxonomy)
     */
    private function countOldDestinations(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->term_taxonomy} 
             WHERE taxonomy = 'destination'"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old activities (stored as taxonomy)
     */
    private function countOldActivities(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->term_taxonomy} 
             WHERE taxonomy = 'activity'"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old trip categories
     */
    private function countOldCategories(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->term_taxonomy} 
             WHERE taxonomy = 'tour_category'"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old difficulty levels
     */
    private function countOldDifficultyLevels(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->term_taxonomy} 
             WHERE taxonomy = 'difficulty'"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old reviews (stored as comments)
     */
    private function countOldReviews(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->comments} 
             WHERE comment_type = 'yatra_review'"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old enquiries
     */
    private function countOldEnquiries(): int
    {
        $table = $this->wpdb->prefix . 'yatra_enquiry';
        
        if (!$this->tableExists($table)) {
            return 0;
        }
        
        $count = $this->wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        
        return (int) $count;
    }
    
    /**
     * Check if a table exists
     */
    private function tableExists(string $table): bool
    {
        $result = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $table
            )
        );
        
        return $result === $table;
    }
}
