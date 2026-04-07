<?php
/**
 * Migration Detector - Detects old Yatra data from previous versions
 * 
 * This class detects data from Yatra versions prior to 3.0.0
 * All migration-related code is in app/Migrations folder for easy removal
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
     * Pad semver segments so PHP's version_compare matches human expectations (e.g. 3.0 === 3.0.0).
     */
    private static function normalizeSemverForCompare(string $version): string
    {
        $version = preg_replace('/^[vV]+/', '', trim($version));
        $core = preg_split('/[-+]/', $version, 2)[0];
        $segments = explode('.', $core);
        $segments = array_pad($segments, 3, '0');

        return implode('.', array_slice(array_map('intval', $segments), 0, 3));
    }

    /**
     * Old Yatra 2.x stored its release in wp_options as yatra_plugin_version (not yatra_version).
     * Fresh Yatra 3.x sites only have yatra_version / installer options — never this legacy key unless
     * the old plugin ran on this database.
     */
    public function isRecordedLegacyYatraInstall(): bool
    {
        $legacyVer = get_option('yatra_plugin_version', '');
        if ($legacyVer === '' || $legacyVer === false) {
            return false;
        }

        return version_compare(
            self::normalizeSemverForCompare((string) $legacyVer),
            self::normalizeSemverForCompare('3.0.0'),
            '<'
        );
    }

    /**
     * Yatra 2.x stored enabled gateways as an associative array (slug => yes). Yatra 3.x uses numeric keys.
     */
    private function hasLegacyPaymentGatewaysOptionFootprint(): bool
    {
        $gw = get_option('yatra_payment_gateways', null);
        if (!is_array($gw) || $gw === []) {
            return false;
        }
        foreach (array_keys($gw) as $key) {
            if (is_string($key)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Legacy CPTs, taxonomies, and tables from Yatra before 3.0 — excludes options (see countOldSettings).
     */
    public function hasStructuralLegacyData(): bool
    {
        return $this->hasLegacyPaymentGatewaysOptionFootprint()
            || $this->countOldTrips() > 0
            || $this->countOldBookings() > 0
            || $this->countOldCustomers() > 0
            || $this->countOldCoupons() > 0
            || $this->countOldDestinations() > 0
            || $this->countOldActivities() > 0
            || $this->countOldAttributes() > 0
            || $this->countOldReviews() > 0
            || $this->countOldEnquiries() > 0
            || $this->countOldTourDates() > 0
            || $this->countOldItinerary() > 0
            || $this->countOldServices() > 0
            || $this->countOldAvailabilityConditions() > 0
            || $this->countOldTravelerCategories() > 0
            // Pro legacy footprints (may exist even when core legacy is already migrated)
            || $this->countOldProFeatures() > 0
            || $this->countOldProGatewaySettings() > 0
            || $this->countOldProGoogleCalendar() > 0
            || $this->countOldProReviewsCpt() > 0
            || $this->countOldProDownloads() > 0;
    }
    
    /**
     * Check if old Yatra data exists (for migration UI / notices).
     *
     * Do not treat normal Yatra 3.x wp_options as "legacy settings" — that caused false positives
     * on fresh installs when countOldSettings() counted every yatra_* option.
     */
    public function hasOldData(): bool
    {
        if ($this->isRecordedLegacyYatraInstall()) {
            return true;
        }

        return $this->hasStructuralLegacyData();
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
                'description' => 'Core options plus payment gateways (free flat keys + legacy Pro yatra_pro_* bundles) and Google Calendar token remap when Pro 3.0+ is active',
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
            'traveler_categories' => [
                'label' => 'Traveler Categories',
                'count' => $this->countOldTravelerCategories(),
                'description' => 'Multiple pricing / traveler-based pricing options',
                'table' => 'postmeta (yatra_multiple_pricing on tour posts)',
            ],
            'pro_features' => [
                'label' => 'Pro: Feature Toggles',
                'count' => $this->countOldProFeatures(),
                'description' => 'Legacy Pro feature/module toggles (yatra_pro_features option)',
                'table' => 'options (yatra_pro_features)',
            ],
            'pro_reviews_cpt' => [
                'label' => 'Pro: Reviews (CPT)',
                'count' => $this->countOldProReviewsCpt(),
                'description' => 'Legacy Pro reviews stored as yatra-review custom post type',
                'table' => 'posts (post_type=yatra-review)',
            ],
            'pro_downloads' => [
                'label' => 'Pro: Downloads',
                'count' => $this->countOldProDownloads(),
                'description' => 'Legacy downloadable files attached to tours',
                'table' => 'options + postmeta (downloads_downloadable_files)',
            ],
        ];
    }

    private function countOldProFeatures(): int
    {
        $features = get_option('yatra_pro_features', []);
        if (!is_array($features)) {
            return 0;
        }
        $features = array_filter($features, static fn ($v) => (bool) $v);

        return $features !== [] ? 1 : 0;
    }

    private function countOldProGatewaySettings(): int
    {
        $enabled = get_option('yatra_pro_enabled_payment_gateways', []);
        if (is_array($enabled) && $enabled !== []) {
            return 1;
        }

        $keys = [
            'yatra_pro_twocheckout_settings',
            'yatra_pro_square_settings',
            'yatra_pro_razorpay_settings',
            'yatra_pro_authorizenet_settings',
            'yatra_pro_razorpay_refunds',
        ];
        foreach ($keys as $k) {
            $v = get_option($k, null);
            if ($v !== null && $v !== '' && $v !== []) {
                return 1;
            }
        }

        return 0;
    }

    private function countOldProGoogleCalendar(): int
    {
        $token = get_option('yatra_google_calendar_refresh_token', '');
        if (is_string($token) && $token !== '') {
            return 1;
        }
        $enabled = get_option('yatra_enable_google_calendar', '');
        if ($enabled !== '' && $enabled !== null) {
            return 1;
        }

        return 0;
    }

    private function countOldProReviewsCpt(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->posts} WHERE post_type = 'yatra-review' AND post_status NOT IN ('trash','auto-draft')"
        );

        return (int) $count;
    }

    private function countOldProDownloads(): int
    {
        $global = get_option('yatra_global_downloadable_files', '');
        if (is_string($global) && trim($global) !== '') {
            return 1;
        }
        $count = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->wpdb->postmeta} pm INNER JOIN {$this->wpdb->posts} p ON pm.post_id = p.ID
                 WHERE p.post_type = %s AND pm.meta_key = %s AND pm.meta_value <> ''",
                'tour',
                'downloads_downloadable_files'
            )
        );

        return (int) $count;
    }
    
    /**
     * Count old trips from custom post type
     */
    private function countOldTrips(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->posts} 
             WHERE post_type = 'tour' AND post_status != 'auto-draft'"
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
             WHERE post_type = 'yatra-booking' AND post_status != 'auto-draft'"
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
             WHERE post_type = 'yatra-customers' AND post_status != 'auto-draft'"
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
     * Count old reviews (stored as comments on tour posts)
     */
    private function countOldReviews(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->wpdb->comments} c
             INNER JOIN {$this->wpdb->posts} p ON c.comment_post_ID = p.ID
             WHERE p.post_type = 'tour'
             AND c.comment_type IN ('', 'comment', 'review', 'yatra_review')
             AND c.comment_approved != 'trash'"
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
             WHERE post_type = 'yatra-coupons' AND post_status != 'auto-draft'"
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
                 AND p.post_status != 'auto-draft'
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
        if (
            !$this->isRecordedLegacyYatraInstall()
            && !$this->hasStructuralLegacyData()
            && !$this->hasLegacyPaymentGatewaysOptionFootprint()
        ) {
            return 0;
        }

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
     * Count old traveler categories (tours with multiple pricing in postmeta)
     */
    private function countOldTravelerCategories(): int
    {
        $count = $this->wpdb->get_var(
            "SELECT COUNT(DISTINCT pm.post_id)
             FROM {$this->wpdb->postmeta} pm
             INNER JOIN {$this->wpdb->posts} p ON pm.post_id = p.ID
             WHERE pm.meta_key = 'yatra_multiple_pricing'
             AND p.post_type = 'tour'
             AND pm.meta_value != ''
             AND pm.meta_value != 'a:0:{}'
             AND p.post_status != 'auto-draft'"
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
