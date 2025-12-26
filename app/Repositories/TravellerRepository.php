<?php

namespace Yatra\Repositories;

/**
 * Traveller Repository
 * 
 * Handles CRUD operations for booking travellers using normalized tables:
 * - yatra_booking_travellers: Core traveller data
 * - yatra_booking_traveller_meta: Dynamic key-value fields
 * 
 * @package Yatra
 */
class TravellerRepository
{
    /**
     * @var \wpdb WordPress database instance
     */
    private \wpdb $wpdb;

    /**
     * @var string Travellers table name
     */
    private string $travellers_table;

    /**
     * @var string Traveller meta table name
     */
    private string $meta_table;

    /**
     * Constructor
     */
    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        
        // Using hardcoded table names since there's no dedicated repository for these tables
        $this->travellers_table = $wpdb->prefix . 'yatra_booking_travellers';
        $this->meta_table = $wpdb->prefix . 'yatra_booking_traveller_meta';
    }

    /**
     * Create a new traveller for a booking
     * 
     * @param int   $booking_id     Booking ID
     * @param int   $traveller_index Position in the booking (0-based)
     * @param bool  $is_lead        Whether this is the lead/primary traveller
     * @param array $fields         Dynamic fields as key-value pairs
     * @return int|false Traveller ID on success, false on failure
     */
    public function create(int $booking_id, int $traveller_index, bool $is_lead = false, array $fields = [])
    {
        // Insert traveller record
        $result = $this->wpdb->insert(
            $this->travellers_table,
            [
                'booking_id' => $booking_id,
                'traveller_index' => $traveller_index,
                'is_lead' => $is_lead ? 1 : 0,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
            ['%d', '%d', '%d', '%s', '%s']
        );

        if ($result === false) {
            return false;
        }

        $traveller_id = $this->wpdb->insert_id;

        // Save all dynamic fields to meta table
        if (!empty($fields)) {
            $this->saveMeta($traveller_id, $fields);
        }

        return $traveller_id;
    }

    /**
     * Update a traveller's core data
     * 
     * @param int   $traveller_id Traveller ID
     * @param array $data         Data to update (is_lead, traveller_index)
     * @return bool Success
     */
    public function update(int $traveller_id, array $data): bool
    {
        $update_data = [];
        $update_format = [];

        if (isset($data['is_lead'])) {
            $update_data['is_lead'] = $data['is_lead'] ? 1 : 0;
            $update_format[] = '%d';
        }

        if (isset($data['traveller_index'])) {
            $update_data['traveller_index'] = (int) $data['traveller_index'];
            $update_format[] = '%d';
        }

        if (empty($update_data)) {
            return true;
        }

        $update_data['updated_at'] = current_time('mysql');
        $update_format[] = '%s';

        $result = $this->wpdb->update(
            $this->travellers_table,
            $update_data,
            ['id' => $traveller_id],
            $update_format,
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Update traveller fields (meta data)
     * 
     * @param int   $traveller_id Traveller ID
     * @param array $fields       Fields to update/create
     * @return bool Success
     */
    public function updateFields(int $traveller_id, array $fields): bool
    {
        // Update timestamp on main record
        $this->wpdb->update(
            $this->travellers_table,
            ['updated_at' => current_time('mysql')],
            ['id' => $traveller_id],
            ['%s'],
            ['%d']
        );

        return $this->saveMeta($traveller_id, $fields);
    }

    /**
     * Delete a traveller and all their meta data
     * 
     * @param int $traveller_id Traveller ID
     * @return bool Success
     */
    public function delete(int $traveller_id): bool
    {
        // Delete meta first
        $this->wpdb->delete(
            $this->meta_table,
            ['traveller_id' => $traveller_id],
            ['%d']
        );

        // Delete traveller record
        $result = $this->wpdb->delete(
            $this->travellers_table,
            ['id' => $traveller_id],
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Delete all travellers for a booking
     * 
     * @param int $booking_id Booking ID
     * @return bool Success
     */
    public function deleteByBookingId(int $booking_id): bool
    {
        // Get all traveller IDs for this booking
        $traveller_ids = $this->wpdb->get_col($this->wpdb->prepare(
            "SELECT id FROM {$this->travellers_table} WHERE booking_id = %d",
            $booking_id
        ));

        if (!empty($traveller_ids)) {
            // Delete meta for all travellers
            $placeholders = implode(',', array_fill(0, count($traveller_ids), '%d'));
            $this->wpdb->query($this->wpdb->prepare(
                "DELETE FROM {$this->meta_table} WHERE traveller_id IN ($placeholders)",
                ...$traveller_ids
            ));
        }

        // Delete traveller records
        $result = $this->wpdb->delete(
            $this->travellers_table,
            ['booking_id' => $booking_id],
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Get a single traveller by ID with all meta fields
     * 
     * @param int $traveller_id Traveller ID
     * @return array|null Traveller data with fields, or null if not found
     */
    public function getById(int $traveller_id): ?array
    {
        $traveller = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->travellers_table} WHERE id = %d",
            $traveller_id
        ), ARRAY_A);

        if (!$traveller) {
            return null;
        }

        // Get all meta fields
        $traveller['fields'] = $this->getMeta($traveller_id);
        $traveller['is_lead'] = (bool) $traveller['is_lead'];

        return $traveller;
    }

    /**
     * Get all travellers for a booking with their meta fields
     * 
     * @param int $booking_id Booking ID
     * @return array Array of travellers with their fields
     */
    public function getByBookingId(int $booking_id): array
    {
        $travellers = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT * FROM {$this->travellers_table} 
             WHERE booking_id = %d 
             ORDER BY traveller_index ASC",
            $booking_id
        ), ARRAY_A);

        if (empty($travellers)) {
            return [];
        }

        // Get all traveller IDs
        $traveller_ids = array_column($travellers, 'id');

        // Batch fetch all meta for these travellers
        $all_meta = $this->getMetaBatch($traveller_ids);

        // Merge meta into travellers
        foreach ($travellers as &$traveller) {
            $traveller['is_lead'] = (bool) $traveller['is_lead'];
            $traveller['fields'] = $all_meta[$traveller['id']] ?? [];
        }

        return $travellers;
    }

    /**
     * Get the lead traveller for a booking
     * 
     * @param int $booking_id Booking ID
     * @return array|null Lead traveller data, or null if not found
     */
    public function getLeadTraveller(int $booking_id): ?array
    {
        $traveller = $this->wpdb->get_row($this->wpdb->prepare(
            "SELECT * FROM {$this->travellers_table} 
             WHERE booking_id = %d AND is_lead = 1
             LIMIT 1",
            $booking_id
        ), ARRAY_A);

        if (!$traveller) {
            // Fallback to first traveller
            $traveller = $this->wpdb->get_row($this->wpdb->prepare(
                "SELECT * FROM {$this->travellers_table} 
                 WHERE booking_id = %d 
                 ORDER BY traveller_index ASC
                 LIMIT 1",
                $booking_id
            ), ARRAY_A);
        }

        if (!$traveller) {
            return null;
        }

        $traveller['is_lead'] = (bool) $traveller['is_lead'];
        $traveller['fields'] = $this->getMeta((int) $traveller['id']);

        return $traveller;
    }

    /**
     * Count travellers for a booking
     * 
     * @param int $booking_id Booking ID
     * @return int Count
     */
    public function countByBookingId(int $booking_id): int
    {
        return (int) $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->travellers_table} WHERE booking_id = %d",
            $booking_id
        ));
    }

    /**
     * Save meta fields for a traveller (insert or update)
     * 
     * @param int   $traveller_id Traveller ID
     * @param array $fields       Key-value pairs of fields
     * @return bool Success
     */
    public function saveMeta(int $traveller_id, array $fields): bool
    {
        foreach ($fields as $meta_key => $meta_value) {
            // Sanitize key
            $meta_key = sanitize_key($meta_key);
            
            if (empty($meta_key)) {
                continue;
            }

            // Sanitize value based on type
            if (is_array($meta_value)) {
                $meta_value = wp_json_encode($meta_value);
            } else {
                $meta_value = sanitize_text_field((string) $meta_value);
            }

            // Check if meta exists
            $existing = $this->wpdb->get_var($this->wpdb->prepare(
                "SELECT id FROM {$this->meta_table} 
                 WHERE traveller_id = %d AND meta_key = %s",
                $traveller_id,
                $meta_key
            ));

            if ($existing) {
                // Update existing meta
                $this->wpdb->update(
                    $this->meta_table,
                    ['meta_value' => $meta_value],
                    [
                        'traveller_id' => $traveller_id,
                        'meta_key' => $meta_key,
                    ],
                    ['%s'],
                    ['%d', '%s']
                );
            } else {
                // Insert new meta
                $this->wpdb->insert(
                    $this->meta_table,
                    [
                        'traveller_id' => $traveller_id,
                        'meta_key' => $meta_key,
                        'meta_value' => $meta_value,
                    ],
                    ['%d', '%s', '%s']
                );
            }
        }

        return true;
    }

    /**
     * Get all meta fields for a traveller
     * 
     * @param int $traveller_id Traveller ID
     * @return array Key-value pairs of fields
     */
    public function getMeta(int $traveller_id): array
    {
        $meta = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT meta_key, meta_value FROM {$this->meta_table} 
             WHERE traveller_id = %d",
            $traveller_id
        ), ARRAY_A);

        $fields = [];
        foreach ($meta as $row) {
            $value = $row['meta_value'];
            
            // Try to decode JSON arrays/objects
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $value = $decoded;
            }
            
            $fields[$row['meta_key']] = $value;
        }

        return $fields;
    }

    /**
     * Get a specific meta value for a traveller
     * 
     * @param int    $traveller_id Traveller ID
     * @param string $meta_key     Meta key
     * @param mixed  $default      Default value if not found
     * @return mixed Meta value or default
     */
    public function getMetaValue(int $traveller_id, string $meta_key, $default = null)
    {
        $value = $this->wpdb->get_var($this->wpdb->prepare(
            "SELECT meta_value FROM {$this->meta_table} 
             WHERE traveller_id = %d AND meta_key = %s",
            $traveller_id,
            $meta_key
        ));

        if ($value === null) {
            return $default;
        }

        // Try to decode JSON
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        return $value;
    }

    /**
     * Delete a specific meta field
     * 
     * @param int    $traveller_id Traveller ID
     * @param string $meta_key     Meta key
     * @return bool Success
     */
    public function deleteMeta(int $traveller_id, string $meta_key): bool
    {
        $result = $this->wpdb->delete(
            $this->meta_table,
            [
                'traveller_id' => $traveller_id,
                'meta_key' => $meta_key,
            ],
            ['%d', '%s']
        );

        return $result !== false;
    }

    /**
     * Batch fetch meta for multiple travellers
     * 
     * @param array $traveller_ids Array of traveller IDs
     * @return array Associative array of traveller_id => fields
     */
    private function getMetaBatch(array $traveller_ids): array
    {
        if (empty($traveller_ids)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($traveller_ids), '%d'));
        
        $meta = $this->wpdb->get_results($this->wpdb->prepare(
            "SELECT traveller_id, meta_key, meta_value FROM {$this->meta_table} 
             WHERE traveller_id IN ($placeholders)",
            ...$traveller_ids
        ), ARRAY_A);

        $result = [];
        foreach ($meta as $row) {
            $traveller_id = $row['traveller_id'];
            $value = $row['meta_value'];
            
            // Try to decode JSON
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $value = $decoded;
            }
            
            if (!isset($result[$traveller_id])) {
                $result[$traveller_id] = [];
            }
            $result[$traveller_id][$row['meta_key']] = $value;
        }

        return $result;
    }

    /**
     * Search travellers across all bookings
     * 
     * @param string $search   Search term
     * @param int    $trip_id  Optional trip ID filter
     * @param int    $page     Page number
     * @param int    $per_page Items per page
     * @return array Array with 'data' and 'total'
     */
    public function search(string $search = '', int $trip_id = 0, int $page = 1, int $per_page = 20): array
    {
        // Use BookingRepository for bookings table
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $bookings_table = $bookingRepository->getTableName();
        
        // Use TripRepository for trips table
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $trips_table = $tripRepository->getTableName();

        // Base query to get travellers with booking info
        $query = "SELECT t.*, b.reference as booking_reference, b.travel_date, b.contact_email, b.contact_phone,
                         tr.title as trip_title, tr.id as trip_id
                  FROM {$this->travellers_table} t
                  INNER JOIN {$bookings_table} b ON t.booking_id = b.id
                  LEFT JOIN {$trips_table} tr ON b.trip_id = tr.id";

        $where_clauses = [];
        $where_values = [];

        if ($trip_id > 0) {
            $where_clauses[] = "b.trip_id = %d";
            $where_values[] = $trip_id;
        }

        if (!empty($where_clauses)) {
            $query .= " WHERE " . implode(' AND ', $where_clauses);
        }

        $query .= " ORDER BY b.created_at DESC, t.traveller_index ASC";

        if (!empty($where_values)) {
            $query = $this->wpdb->prepare($query, ...$where_values);
        }

        $travellers = $this->wpdb->get_results($query, ARRAY_A);

        if (empty($travellers)) {
            return ['data' => [], 'total' => 0];
        }

        // Get all meta
        $traveller_ids = array_column($travellers, 'id');
        $all_meta = $this->getMetaBatch($traveller_ids);

        // Merge meta and apply search filter
        $filtered = [];
        $search_lower = strtolower($search);

        foreach ($travellers as $traveller) {
            $traveller['is_lead'] = (bool) $traveller['is_lead'];
            $traveller['fields'] = $all_meta[$traveller['id']] ?? [];

            // Add lead traveller contact info
            if ($traveller['is_lead']) {
                if (empty($traveller['fields']['email']) && !empty($traveller['contact_email'])) {
                    $traveller['fields']['email'] = $traveller['contact_email'];
                }
                if (empty($traveller['fields']['phone']) && !empty($traveller['contact_phone'])) {
                    $traveller['fields']['phone'] = $traveller['contact_phone'];
                }
            }

            // Apply search filter
            if (!empty($search)) {
                $searchable = strtolower(implode(' ', array_merge(
                    [$traveller['booking_reference'] ?? ''],
                    array_values($traveller['fields'])
                )));
                
                if (strpos($searchable, $search_lower) === false) {
                    continue;
                }
            }

            // Clean up unnecessary fields
            unset($traveller['contact_email'], $traveller['contact_phone']);

            $filtered[] = $traveller;
        }

        $total = count($filtered);

        // Apply pagination
        $offset = ($page - 1) * $per_page;
        $paginated = array_slice($filtered, $offset, $per_page);

        return [
            'data' => $paginated,
            'total' => $total,
        ];
    }

    /**
     * Save multiple travellers for a booking (bulk operation)
     * Replaces all existing travellers for the booking
     * 
     * @param int   $booking_id Booking ID
     * @param array $travellers Array of traveller data with 'is_lead' and 'fields'
     * @return array Array of created traveller IDs
     */
    public function saveTravellersForBooking(int $booking_id, array $travellers): array
    {
        // Delete existing travellers for this booking
        $this->deleteByBookingId($booking_id);

        $created_ids = [];

        foreach ($travellers as $index => $traveller_data) {
            $is_lead = !empty($traveller_data['is_lead']) || $index === 0;
            $fields = $traveller_data['fields'] ?? $traveller_data;

            // Remove non-field keys
            unset($fields['is_lead'], $fields['traveller_index']);

            $traveller_id = $this->create($booking_id, $index, $is_lead, $fields);
            
            if ($traveller_id) {
                $created_ids[] = $traveller_id;
            }
        }

        return $created_ids;
    }

    /**
     * Get travellers formatted for API response (backward compatible with JSON format)
     * 
     * @param int $booking_id Booking ID
     * @return array Array of traveller fields (flat structure like old JSON)
     */
    public function getTravellersAsArray(int $booking_id): array
    {
        $travellers = $this->getByBookingId($booking_id);
        
        $result = [];
        foreach ($travellers as $traveller) {
            $data = $traveller['fields'];
            $data['_traveller_id'] = $traveller['id'];
            $data['_is_lead'] = $traveller['is_lead'];
            $data['_traveller_index'] = $traveller['traveller_index'];
            $result[] = $data;
        }

        return $result;
    }

    /**
     * Get paginated travelers with filters
     * 
     * @param array $filters Filter options
     * @return array {data: array, meta: array}
     */
    public function paginate(array $filters = []): array
    {
        // Use BookingRepository for bookings table
        $bookingRepository = new \Yatra\Repositories\BookingRepository();
        $bookings_table = $bookingRepository->getTableName();
        
        // Use TripRepository for trips table
        $tripRepository = new \Yatra\Repositories\TripRepository();
        $trips_table = $tripRepository->getTableName();

        // Pagination
        $page = max(1, (int) ($filters['page'] ?? 1));
        $per_page = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $offset = ($page - 1) * $per_page;

        // Build WHERE clause
        $where_clauses = ['1=1'];
        $where_values = [];

        if (!empty($filters['trip_id'])) {
            $where_clauses[] = 'b.trip_id = %d';
            $where_values[] = (int) $filters['trip_id'];
        }

        if (!empty($filters['search'])) {
            // Search in meta values
            $search_like = '%' . $this->wpdb->esc_like(sanitize_text_field($filters['search'])) . '%';
            $where_clauses[] = "EXISTS (
                SELECT 1 FROM {$this->meta_table} m 
                WHERE m.traveller_id = t.id 
                AND m.meta_value LIKE %s
            )";
            $where_values[] = $search_like;
        }

        $where_sql = implode(' AND ', $where_clauses);

        // Get total count
        $count_query = "SELECT COUNT(DISTINCT t.id) 
                        FROM {$this->travellers_table} t
                        INNER JOIN {$bookings_table} b ON t.booking_id = b.id
                        WHERE {$where_sql}";
        
        if (!empty($where_values)) {
            $count_query = $this->wpdb->prepare($count_query, ...$where_values);
        }
        $total = (int) $this->wpdb->get_var($count_query);

        // Get travellers with booking info
        $query = "SELECT t.id, t.booking_id, t.traveller_index, t.is_lead, t.created_at,
                         b.reference as booking_reference, b.trip_id, b.travel_date,
                         tr.title as trip_title
                  FROM {$this->travellers_table} t
                  INNER JOIN {$bookings_table} b ON t.booking_id = b.id
                  LEFT JOIN {$trips_table} tr ON b.trip_id = tr.id
                  WHERE {$where_sql}
                  ORDER BY t.created_at DESC
                  LIMIT %d OFFSET %d";

        $query_values = array_merge($where_values, [$per_page, $offset]);
        $travellers = $this->wpdb->get_results($this->wpdb->prepare($query, ...$query_values));

        // Get meta for each traveller
        $data = [];
        foreach ($travellers as $traveller) {
            $meta = $this->getMeta((int) $traveller->id);
            
            $data[] = array_merge([
                'id' => (int) $traveller->id,
                'booking_id' => (int) $traveller->booking_id,
                'booking_reference' => $traveller->booking_reference,
                'trip_id' => (int) $traveller->trip_id,
                'trip_title' => $traveller->trip_title,
                'travel_date' => $traveller->travel_date,
                'traveler_index' => (int) $traveller->traveller_index,
                'is_lead' => (bool) $traveller->is_lead,
            ], $meta);
        }

        // Get unique trips for filter dropdown (only on first page with no search)
        $available_trips = [];
        if ($page === 1 && empty($filters['search'])) {
            $trips_query = "SELECT DISTINCT tr.id, tr.title
                            FROM {$this->travellers_table} t
                            INNER JOIN {$bookings_table} b ON t.booking_id = b.id
                            INNER JOIN {$trips_table} tr ON b.trip_id = tr.id
                            WHERE tr.id IS NOT NULL
                            ORDER BY tr.title ASC";
            $trips = $this->wpdb->get_results($trips_query);
            
            foreach ($trips as $trip) {
                $available_trips[] = [
                    'id' => (int) $trip->id,
                    'title' => $trip->title,
                ];
            }
        }

        return [
            'data' => $data,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => (int) ceil($total / $per_page),
                'available_trips' => $available_trips,
            ],
        ];
    }

    /**
     * Bulk delete travellers and their meta
     * 
     * @param int[] $ids Traveller IDs
     * @return array {success: bool, deleted: int, message: string}
     */
    public function bulkDelete(array $ids): array
    {
        $ids = array_values(array_filter(array_map('intval', $ids)));

        if (empty($ids)) {
            return [
                'success' => false,
                'deleted' => 0,
                'message' => __('No travelers selected.', 'yatra'),
            ];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '%d'));

        // Delete meta first
        $metaDeleted = 0;
        if (!empty($this->meta_table)) {
            $metaSql = "DELETE FROM {$this->meta_table} WHERE traveller_id IN ($placeholders)";
            $metaDeleted = $this->wpdb->query($this->wpdb->prepare($metaSql, ...$ids));
        }

        // Delete travellers
        $travellerSql = "DELETE FROM {$this->travellers_table} WHERE id IN ($placeholders)";
        $travellersDeleted = $this->wpdb->query($this->wpdb->prepare($travellerSql, ...$ids));

        $deletedCount = (int) $travellersDeleted;

        if ($deletedCount <= 0) {
            return [
                'success' => false,
                'deleted' => 0,
                'message' => __('Failed to delete travelers.', 'yatra'),
            ];
        }

        return [
            'success' => true,
            'deleted' => $deletedCount,
            'message' => sprintf(_n('%d traveler deleted.', '%d travelers deleted.', $deletedCount, 'yatra'), $deletedCount),
        ];
    }
}

