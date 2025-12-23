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
                'table' => 'posts (post_type=yatra-booking)',
            ],
            'customers' => [
                'label' => 'Customers',
                'count' => $this->countOldCustomers(),
                'description' => 'Customer profiles',
                'table' => 'posts (post_type=yatra-customers)',
            ],
            'coupons' => [
                'label' => 'Coupons',
                'count' => $this->countOldCoupons(),
                'description' => 'Discount coupons',
                'table' => 'posts (post_type=yatra-coupons)',
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
            'attributes' => [
                'label' => 'Attributes',
                'count' => $this->countOldAttributes(),
                'description' => 'Trip attributes and characteristics',
                'table' => 'terms (taxonomy=attributes) or yatra_tour_attributes',
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
                'table' => "{$prefix}yatra_tour_enquiries",
            ],
            'tour_dates' => [
                'label' => 'Tour Dates',
                'count' => $this->countOldTourDates(),
                'description' => 'Tour availability dates',
                'table' => "{$prefix}yatra_tour_dates",
            ],
            'itinerary' => [
                'label' => 'Itinerary',
                'count' => $this->countOldItinerary(),
                'description' => 'Trip itineraries and schedules',
                'table' => 'postmeta (tour posts)',
            ],
            'settings' => [
                'label' => 'Settings',
                'count' => $this->countOldSettings(),
                'description' => 'Plugin configuration and settings',
                'table' => 'options (yatra_* keys)',
            ],
            'services' => [
                'label' => 'Additional Services',
                'count' => $this->countOldServices(),
                'description' => 'Extra services and add-ons (Premium)',
                'table' => 'term_taxonomy (services)',
            ],
            'availability_conditions' => [
                'label' => 'Availability Conditions',
                'count' => $this->countOldAvailabilityConditions(),
                'description' => 'Availability rules and conditions (Premium)',
                'table' => 'term_taxonomy (availability_conditions)',
            ],
        ];
    }
    
    /**
     * Count old trips from custom post type
     */
    private function countOldTrips(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->posts} 
             WHERE post_type = 'tour' AND post_status IN ('publish', 'draft', 'pending', 'private')"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old bookings
     */
    private function countOldBookings(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->posts} 
             WHERE post_type = 'yatra-booking' AND post_status NOT IN ('trash', 'auto-draft')"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old customers
     */
    private function countOldCustomers(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->posts} 
             WHERE post_type = 'yatra-customers' AND post_status NOT IN ('trash', 'auto-draft')"
        );
        
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
     * Count old attributes (stored as taxonomy or custom table)
     * Old system uses 'attributes' taxonomy
     */
    private function countOldAttributes(): int
    {
        // Check for old yatra_tour_attributes table
        $table = $this->wpdb->prefix . 'yatra_tour_attributes';
        $tableExists = $this->wpdb->get_var("SHOW TABLES LIKE '{$table}'");
        
        if ($tableExists) {
            $count = $this->wpdb->get_var("SELECT COUNT(*) FROM {$table}");
            return (int) $count;
        }
        
        // Check for taxonomy-based attributes (old system uses 'attributes' taxonomy)
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->term_taxonomy} 
             WHERE taxonomy = 'attributes'"
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
        $table = $this->wpdb->prefix . 'yatra_tour_enquiries';
        $tableExists = $this->wpdb->get_var("SHOW TABLES LIKE '{$table}'");
        
        if (!$tableExists) {
            return 0;
        }
        
        $count = $this->wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        
        return (int) $count;
    }
    
    /**
     * Count old tour dates
     */
    private function countOldTourDates(): int
    {
        $table = $this->wpdb->prefix . 'yatra_tour_dates';
        $tableExists = $this->wpdb->get_var("SHOW TABLES LIKE '{$table}'");
        
        if (!$tableExists) {
            return 0;
        }
        
        $count = $this->wpdb->get_var("SELECT COUNT(*) FROM {$table}");
        
        return (int) $count;
    }
    
    /**
     * Count old coupons
     */
    private function countOldCoupons(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->posts} 
             WHERE post_type = 'yatra-coupons' AND post_status NOT IN ('trash', 'auto-draft')"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old tours with itinerary data
     */
    private function countOldItinerary(): int
    {
        // Count tours that have itinerary-related meta data
        $itineraryKeys = [
            'itinerary_repeator',  // This is the actual key found in the database
            'itinerary_label',
            'yatra_tour_itinerary',
            'yatra_tour_meta_itinerary',
            'yatra_itinerary',
            'tour_itinerary',
            'yatra_tour_days',
            'yatra_tour_meta_days',
            'yatra_days',
            'tour_days',
            'yatra_tour_schedule',
            'yatra_tour_meta_schedule',
            'yatra_schedule',
            'tour_schedule'
        ];

        $placeholders = implode(',', array_fill(0, count($itineraryKeys), '%s'));
        
        $count = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(DISTINCT p.ID) 
                 FROM {$this->wpdb->posts} p
                 INNER JOIN {$this->wpdb->postmeta} pm ON p.ID = pm.post_id
                 WHERE p.post_type = 'tour' 
                 AND p.post_status IN ('publish', 'draft', 'pending', 'private')
                 AND pm.meta_key IN ({$placeholders})",
                ...$itineraryKeys
            )
        );
        
        return (int) $count;
    }
    
    /**
     * Count old settings from options table
     */
    private function countOldSettings(): int
    {
        // Count old Yatra settings in wp_options
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->options} 
             WHERE option_name LIKE 'yatra_%' 
             AND option_name NOT LIKE 'yatra\\_version%'
             AND option_name NOT LIKE 'yatra\\_db\\_version%'
             AND option_name NOT LIKE 'yatra\\_migration%'"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old services from taxonomy (checks database directly)
     */
    private function countOldServices(): int
    {
        // Check database directly, regardless of plugin/module activation
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->term_taxonomy} 
             WHERE taxonomy = 'services'"
        );
        
        return (int) $count;
    }
    
    /**
     * Count old availability conditions from taxonomy (checks database directly)
     */
    private function countOldAvailabilityConditions(): int
    {
        // Check database directly, regardless of plugin/module activation
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->term_taxonomy} 
             WHERE taxonomy = 'availability_conditions'"
        );
        
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
