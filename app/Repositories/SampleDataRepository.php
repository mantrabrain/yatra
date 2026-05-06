<?php

namespace Yatra\Repositories;

use Yatra\Database\Tables\TripsTable;
use Yatra\Database\Tables\ClassificationsTable;
use Yatra\Database\Tables\TripClassificationsTable;
use Yatra\Database\Tables\DiscountsTable;
use Yatra\Database\Tables\TripAvailabilityDatesTable;
use Yatra\Database\Tables\TripAvailabilityRulesTable;
use Yatra\Database\Tables\TripItineraryDaysTable;
use Yatra\Database\Tables\TripItineraryDayEntryTable;
use Yatra\Database\Tables\TripContentTable;

/**
 * Sample Data Repository
 * 
 * Handles database operations for sample data import.
 * Inserts data into all required tables matching the exact structure
 * that the real UI/API/Service layer uses.
 */
class SampleDataRepository
{
    private $wpdb;

    private $trips_table;
    private $classifications_table;
    private $trip_classifications_table;
    private $discounts_table;
    private $availability_dates_table;
    private $availability_rules_table;
    private $itinerary_days_table;
    private $itinerary_entries_table;
    private $trip_content_table;

    /**
     * Tracks inserted classification type:slug => id mapping.
     * Uses composite key to avoid slug collisions across types.
     */
    private $classification_ids = [];

    /**
     * Simple slug => id mapping (last wins) for backward compat.
     */
    private $slug_to_id = [];

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        
        $this->trips_table              = TripsTable::getTableName();
        $this->classifications_table    = ClassificationsTable::getTableName();
        $this->trip_classifications_table = TripClassificationsTable::getTableName();
        $this->discounts_table          = DiscountsTable::getTableName();
        $this->availability_dates_table = TripAvailabilityDatesTable::getTableName();
        $this->availability_rules_table = TripAvailabilityRulesTable::getTableName();
        $this->itinerary_days_table     = TripItineraryDaysTable::getTableName();
        $this->itinerary_entries_table  = TripItineraryDayEntryTable::getTableName();
        $this->trip_content_table       = TripContentTable::getTableName();
    }

    /**
     * Get sample data directory path
     */
    private function get_sample_data_dir()
    {
        return YATRA_ABSPATH . 'sample-data/';
    }

    /**
     * Read JSON file
     */
    private function read_json_file($filename)
    {
        $file_path = $this->get_sample_data_dir() . $filename;
        
        if (!file_exists($file_path)) {
            return [];
        }
        
        $json_content = file_get_contents($file_path);
        $data = json_decode($json_content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [];
        }
        
        return $data;
    }

    /**
     * Get all sample data from JSON files
     */
    public function get_all_sample_data()
    {
        return [
            'categories'            => $this->read_json_file('categories.json'),
            'activities'            => $this->read_json_file('activities.json'),
            'destinations'          => $this->read_json_file('destinations.json'),
            'difficulty_levels'     => $this->read_json_file('difficulty-levels.json'),
            'attributes'            => $this->read_json_file('attributes.json'),
            'item_types'            => $this->read_json_file('item-types.json'),
            'traveler_categories'   => $this->read_json_file('traveler-categories.json'),
            'items'                 => $this->read_json_file('items.json'),
            'discounts'             => $this->read_json_file('discounts.json'),
            'trips'                 => $this->read_json_file('trips.json'),
            'trip_classifications'  => $this->read_json_file('trip-classifications.json'),
            'availability_dates'    => $this->read_json_file('availability-dates.json'),
            'availability_rules'    => $this->read_json_file('availability-rules.json'),
            'itinerary_days'        => $this->read_json_file('itinerary-days.json'),
            'itinerary_entries'     => $this->read_json_file('itinerary-entries.json'),
        ];
    }

    /**
     * Get the tracked classification IDs (slug => id)
     */
    public function get_classification_ids()
    {
        return $this->classification_ids;
    }

    /**
     * Insert classifications and track their IDs by slug.
     * Returns the count of inserted records.
     */
    public function insert_classifications($data)
    {
        $inserted = 0;
        $now = current_time('mysql');
        $uid = get_current_user_id();
        
        foreach ($data as $item) {
            // Track the slug before inserting
            $slug = $item['slug'] ?? '';
            
            // Set defaults for required fields
            $item['created_at']  = $item['created_at']  ?? $now;
            $item['updated_at']  = $item['updated_at']  ?? $now;
            $item['created_by']  = $item['created_by']  ?? $uid;
            $item['updated_by']  = $item['updated_by']  ?? $uid;
            $item['parent_id']   = $item['parent_id']   ?? null;
            $item['level']       = $item['level']        ?? 0;
            $item['sorting']     = $item['sorting']      ?? 0;
            $item['is_featured'] = $item['is_featured']  ?? 0;
            
            // Convert metadata to JSON if it's an array
            if (isset($item['metadata']) && is_array($item['metadata'])) {
                $item['metadata'] = json_encode($item['metadata']);
            }
            
            $result = $this->wpdb->insert($this->classifications_table, $item);
            
            if ($result && $this->wpdb->insert_id) {
                $inserted++;
                $id = $this->wpdb->insert_id;
                $type = $item['type'] ?? '';
                // Track by composite key (type:slug) and simple slug
                if ($slug) {
                    $this->classification_ids[$type . ':' . $slug] = $id;
                    $this->slug_to_id[$slug] = $id;
                }
            } else {
            }
        }
        
        return $inserted;
    }

    /**
     * Insert items (type='item') with parent_id resolved from item_type slugs.
     * Items use parent_slug to reference their item_type.
     */
    public function insert_items($data)
    {
        $inserted = 0;
        $now = current_time('mysql');
        $uid = get_current_user_id();
        
        foreach ($data as $item) {
            $slug = $item['slug'] ?? '';
            $parent_slug = $item['parent_slug'] ?? '';
            unset($item['parent_slug']);
            
            // Resolve parent_id from the item_type slug using composite key
            $parent_key = 'item_type:' . $parent_slug;
            if ($parent_slug && isset($this->classification_ids[$parent_key])) {
                $item['parent_id'] = $this->classification_ids[$parent_key];
            } else {
                $item['parent_id'] = null;
                if ($parent_slug) {
                }
            }
            
            $item['created_at']  = $item['created_at']  ?? $now;
            $item['updated_at']  = $item['updated_at']  ?? $now;
            $item['created_by']  = $item['created_by']  ?? $uid;
            $item['updated_by']  = $item['updated_by']  ?? $uid;
            $item['level']       = $item['level']        ?? 0;
            $item['sorting']     = $item['sorting']      ?? 0;
            $item['is_featured'] = $item['is_featured']  ?? 0;
            
            if (isset($item['metadata']) && is_array($item['metadata'])) {
                $item['metadata'] = json_encode($item['metadata']);
            }
            
            $result = $this->wpdb->insert($this->classifications_table, $item);
            
            if ($result && $this->wpdb->insert_id) {
                $inserted++;
                $id = $this->wpdb->insert_id;
                if ($slug) {
                    $this->classification_ids['item:' . $slug] = $id;
                    $this->slug_to_id[$slug] = $id;
                }
            }
        }
        
        return $inserted;
    }

    /**
     * Insert trip-classification pivot records.
     * Links trips to their categories, activities, destinations, difficulty, traveler_types.
     */
    public function insert_trip_classifications($data, $trip_ids)
    {
        $inserted = 0;
        $now = current_time('mysql');
        
        foreach ($data as $mapping) {
            $trip_slug = $mapping['trip_slug'] ?? '';
            if (!isset($trip_ids[$trip_slug])) {
                continue;
            }
            $trip_id = $trip_ids[$trip_slug];
            
            $classifications = $mapping['classifications'] ?? [];
            
            // Track index per classification type so first of each type gets 'primary'
            // This matches how TripRepository::saveDestinations/saveActivities works
            $type_counters = [];
            
            foreach ($classifications as $classification) {
                $cls_slug = $classification['slug'] ?? '';
                $cls_type = $classification['type'] ?? '';
                
                if (!$cls_slug || !$cls_type) {
                    continue;
                }
                
                // Look up the classification ID using composite key (type:slug)
                $composite_key = $cls_type . ':' . $cls_slug;
                if (!isset($this->classification_ids[$composite_key])) {
                    // Try to find it in DB if not tracked (might already exist)
                    $existing = $this->wpdb->get_var($this->wpdb->prepare(
                        "SELECT id FROM {$this->classifications_table} WHERE slug = %s AND type = %s LIMIT 1",
                        $cls_slug, $cls_type
                    ));
                    if ($existing) {
                        $this->classification_ids[$composite_key] = (int) $existing;
                    } else {
                        continue;
                    }
                }
                
                $classification_id = $this->classification_ids[$composite_key];
                
                // Per-type index for relationship_type and sort_order
                if (!isset($type_counters[$cls_type])) {
                    $type_counters[$cls_type] = 0;
                }
                $type_index = $type_counters[$cls_type];
                $type_counters[$cls_type]++;

                $metadata_json = null;
                if ($cls_type === 'attribute') {
                    if (!empty($classification['metadata']) && is_array($classification['metadata'])) {
                        $metadata_json = wp_json_encode($classification['metadata']);
                    } elseif (array_key_exists('value', $classification) || !empty($classification['field_type'])) {
                        $metadata_json = wp_json_encode([
                            'field_type' => $classification['field_type'] ?? 'text_field',
                            'value'      => $classification['value'] ?? '',
                        ]);
                    }
                } elseif (!empty($classification['metadata'])) {
                    $meta = $classification['metadata'];
                    $metadata_json = is_string($meta) ? $meta : wp_json_encode($meta);
                }

                $result = $this->wpdb->insert(
                    $this->trip_classifications_table,
                    [
                        'trip_id'             => $trip_id,
                        'classification_id'   => $classification_id,
                        'classification_type' => $cls_type,
                        'relationship_type'   => $type_index === 0 ? 'primary' : 'secondary',
                        'metadata'            => $metadata_json,
                        'sort_order'          => $type_index,
                        'is_featured'         => $type_index === 0 ? 1 : 0,
                        'is_active'           => 1,
                        'created_at'          => $now,
                        'updated_at'          => $now,
                    ],
                    ['%d', '%d', '%s', '%s', '%s', '%d', '%d', '%d', '%s', '%s']
                );
                
                if ($result) {
                    $inserted++;
                }
            }
        }
        
        return $inserted;
    }

    /**
     * Insert discounts
     */
    public function insert_discounts($data)
    {
        $inserted = 0;
        $now = current_time('mysql');
        $future = date('Y-m-d H:i:s', strtotime('+6 months'));
        $uid = get_current_user_id();
        
        foreach ($data as $item) {
            $item['created_at']              = $item['created_at']              ?? $now;
            $item['updated_at']              = $item['updated_at']              ?? $now;
            $item['created_by']              = $item['created_by']              ?? $uid;
            $item['updated_by']              = $item['updated_by']              ?? $uid;
            $item['usage_count']             = $item['usage_count']             ?? 0;
            $item['usage_limit_per_customer'] = $item['usage_limit_per_customer'] ?? 0;
            $item['applicable_to']           = $item['applicable_to']           ?? 'all';
            $item['first_time_customer_only'] = $item['first_time_customer_only'] ?? 0;
            $item['is_group_discount']       = $item['is_group_discount']       ?? 0;
            $item['discount_mode']           = $item['discount_mode']           ?? 'both';
            $item['valid_from']              = $item['valid_from']              ?? $now;
            $item['expiry_date']             = $item['expiry_date']             ?? $future;
            
            $result = $this->wpdb->insert($this->discounts_table, $item);
            if ($result) {
                $inserted++;
            }
        }
        
        return $inserted;
    }

    /**
     * Insert trips. Returns slug => id mapping.
     */
    public function insert_trips($data)
    {
        $trip_ids = [];
        $now = current_time('mysql');
        $uid = get_current_user_id();
        
        foreach ($data as $item) {
            $trip_slug = $item['slug'];
            
            $item['created_at'] = $item['created_at'] ?? $now;
            $item['updated_at'] = $item['updated_at'] ?? $now;
            $item['created_by'] = $item['created_by'] ?? $uid;
            $item['updated_by'] = $item['updated_by'] ?? $uid;
            
            // Resolve price_types: convert traveler_category slugs to category_id
            // and map field names (price→original_price, sale_price→discounted_price)
            if (!empty($item['price_types'])) {
                $price_types_raw = $item['price_types'];
                
                // Decode if it's a JSON string
                if (is_string($price_types_raw)) {
                    $price_types_raw = json_decode($price_types_raw, true);
                }
                
                if (is_array($price_types_raw) && !empty($price_types_raw)) {
                    $resolved_price_types = [];
                    foreach ($price_types_raw as $pt) {
                        $resolved = [];
                        
                        // Resolve traveler_category slug to numeric category_id
                        // Composite key uses 'traveler_type:' (matches type field in classifications table)
                        if (isset($pt['traveler_category'])) {
                            $slug = $pt['traveler_category'];
                            $composite_key = 'traveler_type:' . $slug;
                            if (isset($this->classification_ids[$composite_key])) {
                                $resolved['category_id'] = $this->classification_ids[$composite_key];
                            } elseif (isset($this->slug_to_id[$slug])) {
                                $resolved['category_id'] = $this->slug_to_id[$slug];
                            } else {
                                // Keep slug as label fallback
                                $resolved['category_id'] = null;
                                $resolved['label'] = ucfirst(str_replace('-', ' ', $slug));
                            }
                        } elseif (isset($pt['category_id'])) {
                            $resolved['category_id'] = $pt['category_id'];
                        }
                        
                        // Map field names: price → original_price, sale_price → discounted_price
                        $resolved['original_price'] = (float) ($pt['original_price'] ?? $pt['price'] ?? 0);
                        $resolved['discounted_price'] = (float) ($pt['discounted_price'] ?? $pt['sale_price'] ?? 0);
                        
                        if (isset($resolved['label'])) {
                            // Keep label for fallback display
                        }
                        
                        $resolved_price_types[] = $resolved;
                    }
                    
                    $item['price_types'] = wp_json_encode($resolved_price_types);
                    
                    // Auto-set pricing_type to traveler_based when price_types exist
                    if (empty($item['pricing_type']) || $item['pricing_type'] === 'regular') {
                        $item['pricing_type'] = 'traveler_based';
                    }
                } else {
                    $item['price_types'] = null;
                }
            }
            
            // Ensure other JSON fields are properly encoded
            foreach (['included_items', 'excluded_items', 'frontend_tabs', 'custom_fields'] as $jsonField) {
                if (isset($item[$jsonField]) && is_array($item[$jsonField])) {
                    $item[$jsonField] = wp_json_encode($item[$jsonField]);
                }
            }
            
            $result = $this->wpdb->insert($this->trips_table, $item);
            
            if ($result && $this->wpdb->insert_id) {
                $trip_ids[$trip_slug] = $this->wpdb->insert_id;
            } else {
            }
        }
        
        return $trip_ids;
    }

    /**
     * Insert availability dates
     */
    public function insert_availability_dates($data, $trip_ids)
    {
        $inserted = 0;
        
        foreach ($data as $item) {
            $trip_slug = $item['trip_slug'];
            unset($item['trip_slug']);
            
            if (!isset($trip_ids[$trip_slug])) {
                continue;
            }
            $item['trip_id'] = $trip_ids[$trip_slug];

            if (empty($item['return_date']) && !empty($item['arrival_date'])) {
                $item['return_date'] = $item['arrival_date'];
            }
            
            $result = $this->wpdb->insert($this->availability_dates_table, $item);
            if ($result) {
                $inserted++;
            }
        }
        
        return $inserted;
    }

    /**
     * Insert availability rules.
     *
     * Sample JSON only knows the legacy columns (`recurrence_type`,
     * `capacity_value`, `interval`, `day_of_month`). The new admin React UI
     * binds to a parallel set (`rule_type`, `seats_total`, `interval_days`,
     * `interval_start_date`). We populate both so a freshly imported sample
     * dataset is immediately editable in the new UI without needing the
     * idempotent {@see InstallerService::maybeNormalizeAvailabilityRulesLegacyData()}
     * heal-step to fix it on next admin_init.
     */
    public function insert_availability_rules($data, $trip_ids)
    {
        $inserted = 0;

        foreach ($data as $item) {
            $trip_slug = $item['trip_slug'];
            unset($item['trip_slug']);

            if (!isset($trip_ids[$trip_slug])) {
                continue;
            }
            $item['trip_id'] = $trip_ids[$trip_slug];

            $item = $this->mapLegacyAvailabilityRuleToNewSchema($item);

            // Convert arrays to JSON
            if (isset($item['days_of_week']) && is_array($item['days_of_week'])) {
                $item['days_of_week'] = json_encode($item['days_of_week']);
            }
            if (isset($item['recurrence_pattern']) && is_array($item['recurrence_pattern'])) {
                $item['recurrence_pattern'] = json_encode($item['recurrence_pattern']);
            }

            $result = $this->wpdb->insert($this->availability_rules_table, $item);
            if ($result) {
                $inserted++;
            }
        }

        return $inserted;
    }

    /**
     * Map a sample-data row written against the legacy availability-rule
     * schema onto the new-schema columns the admin UI reads.
     *
     * Mirrors the heal logic in
     * {@see InstallerService::maybeNormalizeAvailabilityRulesLegacyData()}
     * so write-time and read-time-repair stay in lock-step.
     *
     * @param array<string, mixed> $item
     * @return array<string, mixed>
     */
    private function mapLegacyAvailabilityRuleToNewSchema(array $item): array
    {
        $recurrence = isset($item['recurrence_type']) ? (string) $item['recurrence_type'] : 'weekly';
        $intervalRaw = isset($item['interval']) ? (int) $item['interval'] : 1;
        $intervalNorm = $intervalRaw > 0 ? $intervalRaw : 1;

        if (!isset($item['rule_type']) || $item['rule_type'] === '' || $item['rule_type'] === null) {
            switch ($recurrence) {
                case 'daily':
                    $item['rule_type'] = 'interval';
                    if (!isset($item['interval_days'])) {
                        $item['interval_days'] = $intervalNorm;
                    }
                    if (!isset($item['interval_start_date']) && !empty($item['start_date'])) {
                        $item['interval_start_date'] = $item['start_date'];
                    }
                    break;
                case 'monthly':
                case 'yearly':
                    $item['rule_type'] = 'monthly';
                    break;
                case 'custom':
                    $item['rule_type'] = 'interval';
                    if (!isset($item['interval_days'])) {
                        $item['interval_days'] = $intervalNorm;
                    }
                    if (!isset($item['interval_start_date']) && !empty($item['start_date'])) {
                        $item['interval_start_date'] = $item['start_date'];
                    }
                    break;
                case 'weekly':
                default:
                    $item['rule_type'] = 'weekly';
                    break;
            }
        }

        // seats_total mirrors capacity_value when capacity is fixed (the
        // sample dataset doesn't model percentage capacity). CapacityService
        // and the React table read seats_total directly.
        $capacityType = $item['capacity_type'] ?? 'fixed';
        if (
            !isset($item['seats_total'])
            && isset($item['capacity_value'])
            && (int) $item['capacity_value'] > 0
            && $capacityType === 'fixed'
        ) {
            $item['seats_total'] = (int) $item['capacity_value'];
        }

        return $item;
    }

    /**
     * Insert itinerary days. Returns composite key => day_id mapping.
     */
    public function insert_itinerary_days($data, $trip_ids)
    {
        $day_ids = [];
        $now = current_time('mysql');
        $uid = get_current_user_id();
        
        foreach ($data as $item) {
            $trip_slug = $item['trip_slug'];
            unset($item['trip_slug']);
            
            if (!isset($trip_ids[$trip_slug])) {
                continue;
            }
            $item['trip_id']    = $trip_ids[$trip_slug];
            $item['created_at'] = $item['created_at'] ?? $now;
            $item['updated_at'] = $item['updated_at'] ?? $now;
            $item['created_by'] = $item['created_by'] ?? $uid;
            $item['updated_by'] = $item['updated_by'] ?? $uid;
            
            $result = $this->wpdb->insert($this->itinerary_days_table, $item);
            
            if ($result && $this->wpdb->insert_id) {
                $key = $trip_slug . '_day_' . $item['day_number'];
                $day_ids[$key] = $this->wpdb->insert_id;
            }
        }
        
        return $day_ids;
    }

    /**
     * Insert itinerary entries with proper item_type_id and item_id resolution.
     * Uses item_type slug from JSON to look up real classification IDs.
     */
    public function insert_itinerary_entries($data, $trip_ids, $day_ids)
    {
        $inserted = 0;
        $now = current_time('mysql');
        $uid = get_current_user_id();
        
        // Build a map of item_type slug => {id, name, icon} from classifications
        $item_type_map = $this->build_item_type_map();
        // Build a map of item slug => {id, name, icon, parent_id} from classifications
        $item_map = $this->build_item_map();
        
        foreach ($data as $item) {
            $trip_slug  = $item['trip_slug'];
            $day_number = $item['day_number'];
            unset($item['trip_slug'], $item['day_number']);
            
            if (!isset($trip_ids[$trip_slug])) {
                continue;
            }
            $day_key = $trip_slug . '_day_' . $day_number;
            if (!isset($day_ids[$day_key])) {
                continue;
            }
            
            $item['trip_id'] = $trip_ids[$trip_slug];
            $item['day_id']  = $day_ids[$day_key];
            
            // Resolve item_type field to real item_type_id, item_name, item_icon
            // Note: item_type is also a real DB column (varchar(50)) so we keep it
            $item_type_slug = $item['item_type'] ?? null;
            if ($item_type_slug && isset($item_type_map[$item_type_slug])) {
                $typeInfo = $item_type_map[$item_type_slug];
                $item['item_type_id'] = $typeInfo['id'];
                $item['item_name']    = $item['item_name'] ?? $typeInfo['name'];
                $item['item_icon']    = $item['item_icon'] ?? $typeInfo['icon'];
                
                // Try to find a matching item for this item_type
                $matched_item = $this->find_best_item_match($item_type_slug, $item['title'] ?? '', $item_map);
                if ($matched_item) {
                    $item['item_id']   = $matched_item['id'];
                    $item['item_name'] = $matched_item['name'];
                    $item['item_icon'] = $matched_item['icon'] ?: ($item['item_icon'] ?? null);
                }
            }
            
            $item['created_at'] = $item['created_at'] ?? $now;
            $item['updated_at'] = $item['updated_at'] ?? $now;
            $item['created_by'] = $item['created_by'] ?? $uid;
            $item['updated_by'] = $item['updated_by'] ?? $uid;
            
            // Convert JSON fields if arrays
            foreach (['included_items', 'excluded_items', 'gallery'] as $jsonField) {
                if (isset($item[$jsonField]) && is_array($item[$jsonField])) {
                    $item[$jsonField] = json_encode($item[$jsonField]);
                }
            }
            
            $result = $this->wpdb->insert($this->itinerary_entries_table, $item);
            if ($result) {
                $inserted++;
            } else {
            }
        }
        
        return $inserted;
    }

    /**
     * Build item_type slug => info map from DB
     */
    private function build_item_type_map()
    {
        $map = [];
        $rows = $this->wpdb->get_results(
            "SELECT id, slug, name, icon FROM {$this->classifications_table} WHERE type = 'item_type'"
        );
        foreach ($rows as $row) {
            $map[$row->slug] = [
                'id'   => (int) $row->id,
                'name' => $row->name,
                'icon' => $row->icon,
            ];
        }
        return $map;
    }

    /**
     * Build item slug => info map from DB (type='item')
     */
    private function build_item_map()
    {
        $map = [];
        $rows = $this->wpdb->get_results(
            "SELECT id, slug, name, icon, parent_id FROM {$this->classifications_table} WHERE type = 'item'"
        );
        foreach ($rows as $row) {
            $map[$row->slug] = [
                'id'        => (int) $row->id,
                'name'      => $row->name,
                'icon'      => $row->icon,
                'parent_id' => (int) $row->parent_id,
            ];
        }
        return $map;
    }

    /**
     * Find the best matching item for an itinerary entry based on item_type and title
     */
    private function find_best_item_match($item_type_slug, $entry_title, $item_map)
    {
        // Get the item_type_id for this slug using composite key
        $item_type_id = $this->classification_ids['item_type:' . $item_type_slug] ?? null;
        if (!$item_type_id) {
            return null;
        }
        
        // Filter items that belong to this item_type (via parent_id)
        $candidates = [];
        foreach ($item_map as $slug => $info) {
            if ($info['parent_id'] === $item_type_id) {
                $candidates[$slug] = $info;
            }
        }
        
        if (empty($candidates)) {
            return null;
        }
        
        // Simple keyword matching
        $title_lower = strtolower($entry_title);
        foreach ($candidates as $slug => $info) {
            $name_lower = strtolower($info['name']);
            $slug_words = explode('-', $slug);
            
            // Check if any word from slug appears in the entry title
            foreach ($slug_words as $word) {
                if (strlen($word) > 2 && strpos($title_lower, $word) !== false) {
                    return $info;
                }
            }
            // Check if item name appears in title
            if (strpos($title_lower, $name_lower) !== false) {
                return $info;
            }
        }
        
        // Return first candidate as fallback
        return reset($candidates);
    }

    /**
     * Cleanup all sample data
     */
    public function cleanup_sample_data()
    {
        $results = [];
        
        // Get trip IDs first for cleaning pivot tables
        $trip_slugs = [
            'swiss-alps-mountain-trek', 'maldives-beach-escape', 'kyoto-cultural-journey',
            'serengeti-wildlife-safari', 'paris-city-explorer', 'bali-island-adventure',
            'iceland-northern-lights', 'new-zealand-adventure', 'peru-machu-picchu-trek',
            'norway-fjords-cruise', 'grand-canyon-day-tour', 'paris-city-highlights-tour',
            'nyc-helicopter-liberty-tour', 'tokyo-cultural-food-tour'
        ];
        $slugs_string = "'" . implode("','", $trip_slugs) . "'";
        
        // Get trip IDs before deleting
        $trip_ids = $this->wpdb->get_col(
            "SELECT id FROM {$this->trips_table} WHERE slug IN ({$slugs_string})"
        );
        
        if (!empty($trip_ids)) {
            $trip_ids_string = implode(',', array_map('intval', $trip_ids));
            
            // Clean pivot table
            $this->wpdb->query(
                "DELETE FROM {$this->trip_classifications_table} WHERE trip_id IN ({$trip_ids_string})"
            );
            
            // Clean itinerary entries
            $this->wpdb->query(
                "DELETE FROM {$this->itinerary_entries_table} WHERE trip_id IN ({$trip_ids_string})"
            );
            
            // Clean itinerary days
            $this->wpdb->query(
                "DELETE FROM {$this->itinerary_days_table} WHERE trip_id IN ({$trip_ids_string})"
            );
            
            // Clean availability dates
            $this->wpdb->query(
                "DELETE FROM {$this->availability_dates_table} WHERE trip_id IN ({$trip_ids_string})"
            );
            
            // Clean availability rules
            $this->wpdb->query(
                "DELETE FROM {$this->availability_rules_table} WHERE trip_id IN ({$trip_ids_string})"
            );
            
            // Clean trip content
            $this->wpdb->query(
                "DELETE FROM {$this->trip_content_table} WHERE trip_id IN ({$trip_ids_string})"
            );
        }
        
        // Delete trips
        $result = $this->wpdb->query(
            "DELETE FROM {$this->trips_table} WHERE slug IN ({$slugs_string})"
        );
        $results['trips'] = $result !== false;
        
        // All classification slugs including items
        $classification_slugs = [
            'adventure-tours', 'beach-island', 'cultural-tours', 'wildlife-safari',
            'city-tours', 'trekking-hiking', 'cruise-tours', 'food-wine',
            'hiking', 'snorkeling', 'city-walking-tour', 'wildlife-viewing',
            'kayaking', 'photography', 'camping', 'rock-climbing', 'cycling', 'cooking-class',
            'swiss-alps', 'maldives', 'kyoto-japan', 'serengeti-tanzania', 'paris-france',
            'bali-indonesia', 'iceland', 'new-zealand', 'peru', 'norway',
            'easy', 'moderate', 'challenging', 'difficult', 'extreme', 'expert',
            'group-size', 'age-restriction', 'fitness-level', 'accommodation-type',
            'meal-plan', 'transportation', 'guide-language', 'season',
            'accommodation', 'activity', 'meal', 'sightseeing', 'free-time',
            'adult', 'child', 'infant', 'student', 'senior', 'group-leader', 'family', 'solo-traveler',
            'mountain-hut', '5-star-hotel', 'beach-resort', 'safari-lodge', 'tented-camp',
            'guided-hiking', 'snorkeling-trip', 'temple-visit', 'game-drive',
            'city-walking-tour-item', 'cooking-class-item',
            'breakfast', 'lunch', 'dinner', 'welcome-dinner',
            'airport-transfer', 'coach-transfer', 'boat-transfer',
            'landmark-visit', 'scenic-viewpoint',
            'rest-and-explore', 'shopping-time'
        ];
        
        $class_slugs_string = "'" . implode("','", $classification_slugs) . "'";
        $result = $this->wpdb->query(
            "DELETE FROM {$this->classifications_table} WHERE slug IN ({$class_slugs_string})"
        );
        $results['classifications'] = $result !== false;
        
        // Clean discounts
        $discount_codes = ['SUMMER2024', 'EARLYBIRD', 'GROUP10', 'WELCOME50',
                          'FAMILY20', 'LASTMINUTE', 'LOYAL100', 'WINTER2024'];
        $codes_string = "'" . implode("','", $discount_codes) . "'";
        $result = $this->wpdb->query(
            "DELETE FROM {$this->discounts_table} WHERE code IN ({$codes_string})"
        );
        $results['discounts'] = $result !== false;
        
        // Clear import flags
        delete_option('yatra_sample_data_imported');
        delete_option('yatra_sample_data_import_date');
        
        return $results;
    }
}
